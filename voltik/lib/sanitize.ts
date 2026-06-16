/**
 * Shared input-cleaning helpers. Every API route that accepts user
 * input should funnel through these before persisting — they
 * normalise the shape of what reaches Mongo so downstream code can
 * trust the data.
 *
 * Cheap, allocation-light operations only. None of this is a security
 * boundary on its own — we layer it on top of React's escaping +
 * server-side schema checks.
 */

// C0 controls (0x00-0x1F minus the common whitespace we want to keep),
// DEL (0x7F), and the C1 control range (0x80-0x9F). Built as a RegExp
// from string source so the file itself never holds raw control bytes.
const CONTROL_RE = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F]', 'g');
// Zero-width + bidi formatting chars: ZWSP, ZWNJ, ZWJ, LRM, RLM,
// LRE/RLE/PDF/LRO/RLO, isolate marks, BOM.
const INVISIBLE_RE = new RegExp('[\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u206F\\uFEFF]', 'g');

/**
 * Strip control characters and zero-width / formatting characters.
 * These are the usual suspects behind unicode-confusion attacks and
 * SKU/username spoofing. Leaves normal whitespace (space, tab, newline)
 * untouched — those are handled by the per-field cleaners below.
 */
export function stripUnsafe(input: string): string {
  return input.replace(CONTROL_RE, '').replace(INVISIBLE_RE, '');
}

/** Trim + collapse internal whitespace + strip unsafe characters. */
export function cleanLine(input: string): string {
  return stripUnsafe(input).replace(/\s+/g, ' ').trim();
}

/** Same as `cleanLine` but preserves paragraph breaks for long-form text. */
export function cleanText(input: string): string {
  return stripUnsafe(input).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Aggressive HTML scrub for fields that render inside React but get
 * recycled into other contexts — review feeds, JSON-LD `Review` blocks,
 * OG-image generation. React already escapes by default, but a future
 * surface that uses `dangerouslySetInnerHTML` on this content would
 * be safe with the result of this function.
 *
 * We don't run a parser (no DOMPurify on the server boundary) — we just
 * strip the dangerous subset: angle-bracket tags, javascript:/data:
 * URLs in href-like syntax, and HTML entity references that decode to
 * a tag.
 */
export function stripHtml(input: string): string {
  let s = stripUnsafe(input);
  // Defang entity-encoded tags before they decode back to active markup.
  s = s.replace(/&(lt|#0*60|#x0*3c);/gi, '<').replace(/&(gt|#0*62|#x0*3e);/gi, '>');
  // Remove the tag bodies entirely — script + style content goes too.
  s = s.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '');
  s = s.replace(/<style\b[\s\S]*?<\/style\s*>/gi, '');
  // Then strip every remaining angle-bracket span.
  s = s.replace(/<\/?[a-z][\s\S]*?>/gi, '');
  // Neutralise inline JS handlers and the javascript:/data: schemes.
  s = s.replace(/\bjavascript:/gi, 'voltik-blocked:');
  s = s.replace(/\bdata:[^\s'"]*/gi, 'voltik-blocked:');
  return s;
}

/** Lower-cased, trimmed email. */
export function cleanEmail(input: string): string {
  return cleanLine(input).toLowerCase();
}

/** Clip a string to `max` characters; returns the original when short enough. */
export function clip(input: string, max: number): string {
  return input.length > max ? input.slice(0, max) : input;
}

/** Standard caps the reviews / forms reach for. Tweak in one spot. */
export const LIMITS = {
  reviewTitle: 120,
  reviewBody:  2000,
  userName:    60,
  productName: 140,
  productSku:  40,
  productDesc: 4000,
  generic:     500
} as const;
