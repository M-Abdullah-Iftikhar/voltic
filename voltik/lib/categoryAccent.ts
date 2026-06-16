/**
 * Per-category accent gradient. Used as a thin tinted strip / glow on
 * product cards so the catalog reads as varied without abandoning the
 * neutral silver illustration treatment.
 *
 * Values are picked once and never derived at render — that means
 * categories you add later need a one-line entry here. Anything missing
 * falls back to the brand→brand2 baseline.
 */

const TABLE: Record<string, string> = {
  charging:  'linear-gradient(90deg, #0ea5e9, #38bdf8)',
  cables:    'linear-gradient(90deg, #0ea5e9, #06b6d4)',
  chargers:  'linear-gradient(90deg, #0284c7, #6366f1)',
  audio:     'linear-gradient(90deg, #a855f7, #ec4899)',
  cases:     'linear-gradient(90deg, #f97316, #ec4899)',
  camera:    'linear-gradient(90deg, #ec4899, #f43f5e)',
  photo:     'linear-gradient(90deg, #ec4899, #f43f5e)',
  mounts:    'linear-gradient(90deg, #14b8a6, #06b6d4)',
  power:     'linear-gradient(90deg, #facc15, #f97316)',
  screen:    'linear-gradient(90deg, #84cc16, #22d3ee)',
  protection:'linear-gradient(90deg, #34d399, #22d3ee)',
  smart:     'linear-gradient(90deg, #6366f1, #a855f7)',
  travel:    'linear-gradient(90deg, #f59e0b, #ef4444)'
};

const FALLBACK = 'linear-gradient(90deg, rgb(var(--brand)), rgb(var(--brand2)))';

/**
 * Look up a CSS gradient for a category. Matches by exact id first, then
 * falls back to a substring match (so `audio-earbuds` still resolves to
 * the `audio` tone) before defaulting to the brand baseline.
 */
export function categoryAccent(category: string | undefined | null): string {
  if (!category) return FALLBACK;
  const key = category.toLowerCase();
  if (TABLE[key]) return TABLE[key];
  for (const [k, v] of Object.entries(TABLE)) {
    if (key.includes(k)) return v;
  }
  return FALLBACK;
}
