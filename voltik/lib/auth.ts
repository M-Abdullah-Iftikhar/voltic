import { cookies } from 'next/headers';
import { db } from './db';
import { signToken, verifyToken } from './signedToken';
import type { PublicUser, User } from './types';

export { hashPassword, verifyPassword } from './passwords';

export const USER_COOKIE = 'voltik_user';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

/* ── Session helpers (cookie-backed) ──────────────────────────── */

/**
 * Issue a fresh signed session cookie for `userId`. The cookie value is
 * an HMAC-signed `userId|expiry` string — clients can no longer flip a
 * single byte to "log in as someone else", and the signature also makes
 * forged-but-correctly-formatted cookies fail verification.
 *
 * Call sites should `clearUserSession` first when rotating credentials
 * (e.g. on successful login) so the browser definitely picks up the
 * new value — important for session-fixation safety.
 */
export async function setUserSession(userId: string) {
  const jar = await cookies();
  jar.set(USER_COOKIE, signToken(userId, SESSION_TTL_SECONDS), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  });
}

export async function clearUserSession() {
  const jar = await cookies();
  jar.delete(USER_COOKIE);
}

/**
 * Resolve the active session into a `User`. Accepts both the new
 * signed-token format AND the legacy raw-userId value so existing
 * sessions don't get logged out on the deploy that ships signing —
 * they'll quietly get re-issued as signed tokens on their next state
 * change (login, profile edit, etc.).
 */
export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const raw = jar.get(USER_COOKIE)?.value;
  if (!raw) return null;

  // Signed token (post-upgrade format) — has two dots.
  if (raw.includes('.')) {
    const userId = verifyToken(raw);
    if (!userId) return null;
    return db.getUser(userId);
  }
  // Legacy plain-userId cookie — treat as valid but stop trusting
  // these once we've migrated everyone (drop this branch after a
  // 30-day window).
  return db.getUser(raw);
}

export function publicUser(u: User | null): PublicUser | null {
  if (!u) return null;
  // Strip server-only fields so they never reach the client (password hash
  // + reset/verify tokens that should stay opaque).
  const { passwordHash, emailVerifyToken, passwordResetToken, passwordResetExpires, ...rest } = u;
  return rest;
}

/* ── Validation ───────────────────────────────────────────────── */

// Disallow emoji + variation selectors in display names + handle-like
// fields. Mostly to keep "RTL trick" + skin-tone-modifier confusion
// attacks out of the userbase. Kept narrow so accented letters and
// non-Latin scripts still work.
const EMOJI_RE = new RegExp(
  '[' +
  '\\u{1F300}-\\u{1FAFF}' +    // pictographic supplemental planes
  '\\u{2600}-\\u{27BF}' +       // miscellaneous symbols + dingbats
  '\\u{2300}-\\u{23FF}' +       // misc technical
  '\\u{2700}-\\u{27BF}' +       // dingbats
  '\\u{FE00}-\\u{FE0F}' +       // variation selectors
  '\\u{1F1E6}-\\u{1F1FF}' +     // regional indicators
  ']',
  'u'
);

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function containsEmoji(s: string): boolean {
  return EMOJI_RE.test(s);
}

export function validateSignup(input: { email?: string; name?: string; password?: string }): string | null {
  if (!input.email || !validateEmail(input.email)) return 'Please enter a valid email address.';
  if (!input.name || input.name.trim().length < 2)  return 'Name must be at least 2 characters.';
  if (containsEmoji(input.name))                    return 'Name can\'t contain emoji.';
  if (input.name.trim().length > 60)                return 'Name is too long (max 60 characters).';
  // Strength gating moved to a shared lib so the form + the API agree.
  // We require length here and let the route delegate to `passwordPassesPolicy`
  // for the full check (which also covers blocklisted + repeat patterns).
  if (!input.password)                              return 'Password is required.';
  return null;
}
