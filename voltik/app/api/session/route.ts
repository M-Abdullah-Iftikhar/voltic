import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clearUserSession, currentUser, publicUser, setUserSession, verifyPassword } from '@/lib/auth';

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

  const user = await db.getUserByEmail(body.email.trim().toLowerCase());
  if (!user || !verifyPassword(body.password, user.passwordHash)) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  // Optional cart merge: client may include anonymous cart lines to fold in.
  if (Array.isArray(body.mergeCart) && body.mergeCart.length) {
    const merged = mergeCart(user.cart, body.mergeCart);
    await db.setUserCart(user.id, merged);
    user.cart = merged;
  }

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
