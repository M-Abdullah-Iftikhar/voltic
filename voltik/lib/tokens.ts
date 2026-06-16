import { randomBytes, createHash } from 'crypto';

/**
 * Single-use token helpers used by password-reset and email-verification.
 *
 * We never store the raw token in the database — only its SHA-256 hash.
 * The plaintext goes out in the link; if the DB ever leaks, the tokens
 * are useless because an attacker can't compute the original from a hash.
 */

/** Generate a fresh URL-safe token (24 bytes ≈ 32 chars). */
export function generateToken(): string {
  return randomBytes(24).toString('base64url');
}

/** Stable hash of a token for DB storage + comparison. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** True when the stored expiry hasn't passed yet. Treats missing as expired. */
export function isFresh(expiresAtIso: string | undefined): boolean {
  if (!expiresAtIso) return false;
  const exp = Date.parse(expiresAtIso);
  return Number.isFinite(exp) && exp > Date.now();
}
