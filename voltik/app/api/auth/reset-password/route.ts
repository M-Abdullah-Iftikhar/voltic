import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/passwords';
import { passwordPassesPolicy } from '@/lib/passwordStrength';
import { hashToken, isFresh } from '@/lib/tokens';
import { captureError, log } from '@/lib/observability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/auth/reset-password { token, password } — consume the token, set new password. */
export async function POST(req: Request) {
  const { token, password } = await req.json();
  if (typeof token !== 'string' || !token.trim()) {
    return NextResponse.json({ error: 'Reset link is missing its token.' }, { status: 400 });
  }
  if (typeof password !== 'string') {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
  }
  // Shared policy gate — reset must clear the same strength bar as signup.
  const policy = passwordPassesPolicy(password);
  if (!policy.ok) return NextResponse.json({ error: policy.reason }, { status: 400 });

  try {
    const user = await db.getUserByResetTokenHash(hashToken(token));
    if (!user || !isFresh(user.passwordResetExpires)) {
      return NextResponse.json({ error: 'This reset link is invalid or expired.' }, { status: 400 });
    }
    // Clear the token + bump password. We don't auto-sign-in — the user
    // must log in fresh with the new credentials. Limits damage if the
    // reset link was intercepted via a shared device.
    await db.upsertUser({
      ...user,
      passwordHash: hashPassword(password),
      passwordResetToken: undefined,
      passwordResetExpires: undefined
    });
    log('info', 'password-reset-success', { userId: user.id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    captureError(e, { hint: 'reset-password' });
    return NextResponse.json({ error: 'Could not reset password — try again.' }, { status: 500 });
  }
}
