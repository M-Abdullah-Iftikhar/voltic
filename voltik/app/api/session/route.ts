import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clearUserSession, currentUser, publicUser, setUserSession, verifyPassword } from '@/lib/auth';
import { clientIp, rateLimit, rateLimitHeaders } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/session — login (or merge-cart on login). */
export async function POST(req: Request) {
  const body = await req.json();
  const action = body.action || 'login';

  if (action === 'logout') {
    await clearUserSession();
    return NextResponse.json({ ok: true });
  }

  if (!body.email || !body.password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  // 10 login attempts per IP per 5 minutes.
  const ip = clientIp(req);
  const limit = rateLimit(`user-login:${ip}`, 10, 5 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again in a few minutes.' },
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  const user = await db.getUserByEmail(body.email.trim().toLowerCase());

  // Account lockout. We check this BEFORE the password compare so the
  // lockout can't be probed for password validity, then fall through to
  // the failure-counter increment on a wrong password.
  if (user?.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
    const minutes = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60_000);
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` },
      { status: 423, headers: rateLimitHeaders(limit) }
    );
  }

  if (!user || !verifyPassword(body.password, user.passwordHash)) {
    if (user) await db.recordFailedLogin(user.id);
    return NextResponse.json(
      { error: 'Invalid email or password.' },
      { status: 401, headers: rateLimitHeaders(limit) }
    );
  }

  // Optional cart merge: client may include anonymous cart lines to fold in.
  if (Array.isArray(body.mergeCart) && body.mergeCart.length) {
    const merged = mergeCart(user.cart, body.mergeCart);
    await db.setUserCart(user.id, merged);
    user.cart = merged;
  }

  // Reset failure tracking + rotate the session cookie. Clearing first
  // then issuing a new signed value prevents session-fixation: any
  // pre-login `voltik_user` cookie we inherited can't be reused.
  await db.clearFailedLogins(user.id);
  await clearUserSession();
  await setUserSession(user.id);
  return NextResponse.json({ user: publicUser(user) });
}

/** GET /api/session — current user (200 with user or 200 with null). */
export async function GET() {
  const u = await currentUser();
  return NextResponse.json({ user: publicUser(u) });
}

function mergeCart(server: { id: string; qty: number }[], local: { id: string; qty: number }[]) {
  const map = new Map(server.map(l => [l.id, l.qty]));
  for (const line of local) {
    if (!line || typeof line.id !== 'string' || typeof line.qty !== 'number') continue;
    map.set(line.id, (map.get(line.id) || 0) + line.qty);
  }
  return Array.from(map.entries()).map(([id, qty]) => ({ id, qty }));
}
