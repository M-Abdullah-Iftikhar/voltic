import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clientIp, rateLimit, rateLimitHeaders } from '@/lib/rateLimit';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/passwords';
import { captureError } from '@/lib/observability';

export const runtime = 'nodejs';

const IS_PROD = process.env.NODE_ENV === 'production';

/** Env-var override. Set ADMIN_USER + ADMIN_PASS to skip the DB lookup
 *  entirely (handy for incident recovery or single-admin demos). */
function envAdmin(): { user: string; pass: string } | null {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  return user && pass ? { user, pass } : null;
}

async function verifyDbAdmin(email: string, password: string): Promise<boolean> {
  try {
    const admin = await db.getAdminByEmail(email);
    if (!admin) return false;
    return verifyPassword(password, admin.passwordHash);
  } catch (e) {
    captureError(e, { hint: 'admin-db-verify' });
    return false;
  }
}

export async function POST(req: Request) {
  const { username, password, action } = await req.json();
  const jar = await cookies();

  if (action === 'logout') {
    jar.delete('voltik_admin');
    return NextResponse.json({ ok: true });
  }

  // 5 admin login attempts per IP per 5 minutes.
  const ip = clientIp(req);
  const limit = rateLimit(`admin-login:${ip}`, 5, 5 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again in a few minutes.' },
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  if (!username || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400, headers: rateLimitHeaders(limit) });
  }

  const email = String(username).trim().toLowerCase();

  // 1) Env-var fast path (no DB hit).
  const env = envAdmin();
  let ok = !!env && env.user.toLowerCase() === email && env.pass === password;

  // 2) DB lookup against the seeded admins collection.
  if (!ok) ok = await verifyDbAdmin(email, password);

  if (!ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: rateLimitHeaders(limit) });
  }

  jar.set('voltik_admin', '1', {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8
  });
  return NextResponse.json({ ok: true }, { headers: rateLimitHeaders(limit) });
}

export async function GET() {
  const jar = await cookies();
  const authed = jar.get('voltik_admin')?.value === '1';
  return NextResponse.json({ authed });
}
