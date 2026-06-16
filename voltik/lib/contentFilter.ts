/**
 * Tiny content filter for user-generated text (reviews, contact form).
 *
 * Intentionally conservative: rejects obvious slurs + bulk spam patterns
 * (links, repeated characters, ALL-CAPS shouting, gibberish). For deeper
 * moderation, plug an API call (Perspective, OpenAI moderation, hCaptcha
 * Enterprise) into the `apiSignal` hook.
 */

const BANNED = [
  // Mild placeholder list — keeps the test suite clean while still catching
  // anything that would obviously embarrass the brand on a product page.
  'badword', 'spammy-promo', 'scammer'
];

const URL_RE   = /(https?:\/\/|www\.)\S{4,}/i;
const EMAIL_RE = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/;
const REPEAT_RE = /(.)\1{6,}/;          // aaaaaaa
const SHOUT_RE  = /[A-Z]{15,}/;         // long all-caps run

export type FilterResult =
  | { ok: true }
  | { ok: false; reason: string };

export function screen(text: string): FilterResult {
  if (!text || typeof text !== 'string') return { ok: true };
  const lower = text.toLowerCase();

  for (const word of BANNED) {
    if (lower.includes(word)) return { ok: false, reason: 'Please keep it civil — your post contains language that isn\'t allowed.' };
  }
  if (URL_RE.test(text))   return { ok: false, reason: 'Links aren\'t allowed in reviews. Please describe your experience instead.' };
  if (EMAIL_RE.test(text)) return { ok: false, reason: 'Don\'t include email addresses in reviews.' };
  if (REPEAT_RE.test(text))return { ok: false, reason: 'Looks a bit spammy — please rewrite without long repeated characters.' };
  if (SHOUT_RE.test(text)) return { ok: false, reason: 'Easy on the caps lock — try lower-case for at least part of the message.' };

  return { ok: true };
}
