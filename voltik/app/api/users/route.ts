import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, publicUser, setUserSession, validateSignup } from '@/lib/auth';
import { passwordPassesPolicy } from '@/lib/passwordStrength';
import { clientIp, rateLimit, rateLimitHeaders } from '@/lib/rateLimit';
import { generateToken, hashToken } from '@/lib/tokens';
import { log } from '@/lib/observability';
import type { User } from '@/lib/types';

function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/users — register + sign-in. */
export async function POST(req: Request) {
  // 5 signups per IP per hour — slows mass-account creation without
  // affecting normal users.
  const ip = clientIp(req);
  const limit = rateLimit(`signup:${ip}`, 5, 60 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many sign-up attempts from this network. Try again later.' },
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  const body = await req.json();
  const err = validateSignup(body);
  if (err) return NextResponse.json({ error: err }, { status: 400, headers: rateLimitHeaders(limit) });

  // Real strength gate — shared with the client meter so both surfaces
  // agree on the policy. Rejects blocklisted + low-complexity inputs.
  const policy = passwordPassesPolicy(body.password);
  if (!policy.ok) return NextResponse.json({ error: policy.reason }, { status: 400, headers: rateLimitHeaders(limit) });

  const email = body.email.trim().toLowerCase();
  const existing = await db.getUserByEmail(email);
  if (existing) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });

  const id = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const verifyToken = generateToken();
  const newUser: User = {
    id,
    email,
    name: body.name.trim(),
    passwordHash: hashPassword(body.password),
    createdAt: new Date().toISOString().slice(0, 10),
    cart: body.cart || [],
    favorites: body.favorites || [],
    emailVerified: false,
    emailVerifyToken: hashToken(verifyToken)
  };
  await db.upsertUser(newUser);
  await setUserSession(id);

  // "Send" the verification email. Real delivery is a wiring task — for
  // now the link goes to the log so dev/staging can click through.
  const link = `${siteUrl().replace(/\/$/, '')}/verify/${verifyToken}`;
  log('info', 'email-verify-link', { userId: id, email, link });

  return NextResponse.json({ user: publicUser(newUser) }, { status: 201 });
}
