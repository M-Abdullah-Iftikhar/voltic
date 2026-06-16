/**
 * Shared password-strength scorer used by both the server-side signup
 * gate and the live meter on the signup / reset forms. Lives in a
 * neutral lib so the client + server can never drift on what "strong
 * enough" means.
 *
 * The algorithm is intentionally hand-rolled (no `zxcvbn`) so the
 * client bundle doesn't pay for a 30kB dictionary the storefront only
 * uses for one form. The cost is precision — we'll never catch every
 * dictionary word — so we offset that with a tight blocklist of the
 * famously-leaked passwords plus character-class diversity scoring.
 */

/** Minimum length we ever accept, regardless of complexity. */
export const MIN_PASSWORD_LENGTH = 10;
/** Score threshold a password must clear server-side (out of 4). */
export const MIN_PASSWORD_SCORE = 2;

// The "top 50" of every breached-password list. Kept short so the cost
// of importing this on the server boundary stays microscopic.
const BLOCKLIST = new Set([
  '123456', '12345678', '123456789', '1234567890', 'qwerty', 'qwerty123',
  'password', 'password1', 'password123', 'p@ssword', 'p@ssw0rd', 'passw0rd',
  'iloveyou', 'admin', 'admin123', 'welcome', 'welcome1', 'welcome123',
  'letmein', 'letmein123', 'monkey', 'dragon', 'sunshine', 'princess',
  'football', 'baseball', 'master', 'shadow', 'superman', 'batman',
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '111111', '000000', '654321',
  'abc123', 'abcdef', 'voltik', 'voltik123', 'changeme'
]);

export interface Strength {
  /** 0..4 — 0 = empty / blocklisted, 4 = very strong. */
  score: 0 | 1 | 2 | 3 | 4;
  /** Plain-English label suitable for a meter caption. */
  label: string;
  /** Up to 3 actionable suggestions if the password is below `MIN_PASSWORD_SCORE`. */
  tips: string[];
  /** Internal diagnostic: which complexity bits were credited. */
  matches: { length: boolean; long: boolean; cases: boolean; digits: boolean; symbols: boolean };
}

export function assessPassword(pw: string): Strength {
  const matches = {
    length:  pw.length >= MIN_PASSWORD_LENGTH,
    long:    pw.length >= 14,
    cases:   /[a-z]/.test(pw) && /[A-Z]/.test(pw),
    digits:  /\d/.test(pw),
    symbols: /[^A-Za-z0-9]/.test(pw)
  };

  const tips: string[] = [];
  if (!matches.length)  tips.push(`Use at least ${MIN_PASSWORD_LENGTH} characters`);
  if (!matches.cases)   tips.push('Mix UPPER and lowercase letters');
  if (!matches.digits)  tips.push('Add at least one number');
  if (!matches.symbols) tips.push('Add a symbol (! @ # $)');

  // Blocklist short-circuits everything else — common passwords are
  // weak by definition.
  if (!pw) {
    return { score: 0, label: 'Add a password', tips: tips.slice(0, 3), matches };
  }
  if (BLOCKLIST.has(pw.toLowerCase())) {
    return {
      score: 0,
      label: 'This password appears in known breach lists',
      tips: ['Pick something unique to you that isn\'t already public'],
      matches
    };
  }
  // Long monotonous strings ("aaaaaaaaaa") look long but aren't strong.
  if (pw.length >= MIN_PASSWORD_LENGTH && /^(.)\1+$/.test(pw)) {
    return { score: 1, label: 'Weak — too repetitive', tips: ['Mix different characters instead of repeating one'], matches };
  }

  let score = 0;
  if (matches.length)  score++;
  if (matches.long)    score++;
  if (matches.cases)   score++;
  if (matches.digits)  score++;
  if (matches.symbols) score++;
  // Clamp to a 0..4 scale so the UI meter stays calibrated.
  const final = Math.min(4, score) as Strength['score'];

  const labels: Record<Strength['score'], string> = {
    0: 'Add a password',
    1: 'Weak — easy to guess',
    2: 'Fair — could be stronger',
    3: 'Strong',
    4: 'Very strong ⚡'
  };

  return { score: final, label: labels[final], tips: tips.slice(0, 3), matches };
}

/** Single-shot accept/reject gate for server endpoints. */
export function passwordPassesPolicy(pw: string): { ok: true } | { ok: false; reason: string } {
  if (!pw)                            return { ok: false, reason: 'Password is required.' };
  if (pw.length < MIN_PASSWORD_LENGTH) return { ok: false, reason: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  const strength = assessPassword(pw);
  if (strength.score < MIN_PASSWORD_SCORE) {
    const why = strength.tips[0] || 'Choose a stronger password.';
    return { ok: false, reason: `Password is too weak. ${why}.` };
  }
  return { ok: true };
}
