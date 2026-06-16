/** URL-safe slug from any string. Idempotent. Strips accents,
 *  lowercases, replaces every non-alphanumeric run with a single dash. */
export function slugify(s: string): string {
  return s
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')   // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Build a slug that's unique within `existing`. Appends "-2", "-3"… if needed. */
export function uniqueSlug(base: string, existing: Set<string>): string {
  const root = slugify(base) || 'item';
  if (!existing.has(root)) return root;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${root}-${n}`;
    if (!existing.has(candidate)) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}
