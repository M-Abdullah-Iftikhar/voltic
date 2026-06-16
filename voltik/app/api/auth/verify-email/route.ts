import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
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
 * POST /api/auth/verify-email
 * Body: { token } — consume a verification token from the email link, OR
 *       { action: 'resend' } — re-issue the token for the signed-in user.
 */
export async function POST(req: Request) {
  const body = await req.json();

  if (body.action === 'resend') {
    const u = await currentUser();
    if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (u.emailVerified) return NextResponse.json({ ok: true, already: true });

    // 3 resends per user per hour — covers a sloppy inbox without
    // letting a hijacked session spam.
    const ip = clientIp(req);
    const limit = rateLimit(`verify-resend:${u.id}:${ip}`, 3, 60 * 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many resend requests — try again in an hour.' },
        { status: 429, headers: rateLimitHeaders(limit) }
      );
    }

    try {
      const token = generateToken();
      await db.upsertUser({ ...u, emailVerifyToken: hashToken(token) });
      const link = `${siteUrl().replace(/\/$/, '')}/verify/${token}`;
      log('info', 'email-verify-link', { userId: u.id, email: u.email, link, source: 'resend' });
      return NextResponse.json({ ok: true });
    } catch (e) {
      captureError(e, { hint: 'verify-resend', userId: u.id });
      return NextResponse.json({ error: 'Could not resend.' }, { status: 500 });
    }
  }

  // Default path: consume a token.
  const token = body.token;
  if (typeof token !== 'string' || !token.trim()) {
    return NextResponse.json({ error: 'Verification link is missing its token.' }, { status: 400 });
  }
  try {
    const user = await db.getUserByVerifyTokenHash(hashToken(token));
    if (!user) return NextResponse.json({ error: 'This link is invalid or already used.' }, { status: 400 });

    await db.upsertUser({
      ...user,
      emailVerified: true,
      emailVerifyToken: undefined
    });
    log('info', 'email-verified', { userId: user.id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    captureError(e, { hint: 'verify-email' });
    return NextResponse.json({ error: 'Could not verify — try again.' }, { status: 500 });
  }
}
