import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Tiny "HMAC-signed payload" helper, used for:
 *   • the user session cookie (so the value can't be tampered with to
 *     point at another userId),
 *   • the double-submit CSRF cookie token.
 *
 * Format: `<payload>.<expiryEpochSec>.<hmac>` — all base64url-encoded so
 * the value is safe in a Set-Cookie header. Signing key comes from
 * `process.env.VOLTIK_SESSION_SECRET`; in dev / preview we fall back to
 * a stable-but-noisy default so the app boots without manual setup, and
 * `assertSessionSecret()` shouts in production builds when it's missing.
 */

const DEFAULT_DEV_SECRET = 'voltik-dev-only-secret-do-not-use-in-prod-3a7e';

function getSecret(): string {
  const s = process.env.VOLTIK_SESSION_SECRET;
  if (s && s.length >= 24) return s;
  // Loud warning in non-prod so it's hard to miss. Don't throw — we
  // still want the app to boot.
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.warn('[voltik] VOLTIK_SESSION_SECRET is missing / too short; using dev fallback.');
  }
  return DEFAULT_DEV_SECRET;
}

export function assertSessionSecret(): void {
  if (process.env.NODE_ENV === 'production' && !process.env.VOLTIK_SESSION_SECRET) {
    throw new Error('VOLTIK_SESSION_SECRET must be set in production.');
  }
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function hmac(payload: string, expiry: number): string {
  return b64url(createHmac('sha256', getSecret()).update(`${payload}.${expiry}`).digest());
}

/**
 * Sign `payload` so it can be sent to the client and trusted on the way
 * back. Returns the encoded token. `ttlSeconds` controls expiry.
 */
export function signToken(payload: string, ttlSeconds: number): string {
  const expiry = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = b64url(Buffer.from(payload, 'utf8'));
  return `${body}.${expiry}.${hmac(body, expiry)}`;
}

/**
 * Verify a token previously created by `signToken`. Returns the original
 * payload string when the HMAC matches and the token hasn't expired,
 * `null` otherwise.
 */
export function verifyToken(token: string): string | null {
  if (!token || token.length > 2048) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [body, expiryStr, sig] = parts;
  const expiry = parseInt(expiryStr, 10);
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) return null;
  const expected = hmac(body, expiry);
  // timingSafeEqual requires equal lengths.
  if (sig.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch { return null; }
  try {
    return b64urlDecode(body).toString('utf8');
  } catch {
    return null;
  }
}

/** Fresh random opaque token — used as the CSRF cookie value before signing. */
export function randomToken(bytes = 24): string {
  return b64url(randomBytes(bytes));
}
