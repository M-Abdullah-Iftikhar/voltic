import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

/** Hash a plaintext password using scrypt with a random salt. */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

/** Constant-time verification against a stored "salt:hash" record. */
export function verifyPassword(plain: string, stored: string): boolean {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  try {
    const test = scryptSync(plain, salt, 64);
    const known = Buffer.from(hash, 'hex');
    if (known.length !== test.length) return false;
    return timingSafeEqual(known, test);
  } catch {
    return false;
  }
}
