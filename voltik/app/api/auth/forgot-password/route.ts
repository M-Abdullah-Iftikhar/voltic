import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateToken, hashToken } from '@/lib/tokens';
import { clientIp, rateLimit, rateLimitHeaders } from '@/lib/rateLimit';
import { captureError, log } from '@/lib/observability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

/**
 * POST /api/auth/forgot-password { email }
 *
 * Generates a 1-hour single-use token, stores its hash, and "sends" the
 * reset link by logging it (real email delivery is wired separately).
 * Returns the same 200 whether the email exists or not — prevents email
 * enumeration. Tokens are URL-safe and the plaintext is never persisted.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = rateLimit(`forgot:${ip}`, 3, 15 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests — try again in a few minutes.' },
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  const { email } = await req.json();
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400, headers: rateLimitHeaders(limit) });
  }

  try {
    const user = await db.getUserByEmail(email);
    if (user) {
      const token = generateToken();
      const expires = new Date(Date.now() + 60 * 60_000).toISOString();   // 1 hour
      await db.upsertUser({
        ...user,
        passwordResetToken: hashToken(token),
        passwordResetExpires: expires
      });
      const link = `${siteUrl().replace(/\/$/, '')}/reset/${token}`;
      log('info', 'password-reset-link', { userId: user.id, email: user.email, link, expires });
    }
  } catch (e) {
    captureError(e, { hint: 'forgot-password' });
  }

  // Always 200 with the same body to thwart enumeration.
  return NextResponse.json(
    { ok: true, message: 'If that email is on file, a reset link is on its way.' },
    { headers: rateLimitHeaders(limit) }
  );
}
