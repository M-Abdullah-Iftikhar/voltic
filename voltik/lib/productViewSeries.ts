/**
 * Synthetic per-product 7-day view-count series. We don't track real
 * impressions yet, so the table column shows a deterministic-but-lively
 * curve that's seeded from the product id + sku. The same id always
 * produces the same sparkline on every reload, which keeps the admin
 * UI from feeling like a random number generator while still varying
 * meaningfully across rows.
 *
 * Once `views` events land in the DB (see IMPROVEMENTS.md backlog),
 * swap the call site for an aggregation over the last 7 days.
 */

/** Cheap, deterministic 32-bit hash — enough entropy for picking
 *  baselines and amplitudes that *look* different per product. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

interface SeedInputs {
  id: string;
  sku?: string;
  /** Product rating — high-rated products get a higher baseline. */
  rating?: number;
  /** Reviews count — bias toward popular products having more daily views. */
  reviewsCount?: number;
  /** Stock < 30 = "running low", which usually correlates with traffic. */
  stock?: number;
}

export function productViewSeries({ id, sku, rating = 0, reviewsCount = 0, stock = 0 }: SeedInputs): number[] {
  const seed = hash(`${id}|${sku ?? ''}`);
  const baseline = 40 + (seed % 60) + Math.min(120, reviewsCount * 0.6) + rating * 6;
  const amplitude = 12 + (seed >> 3) % 18;
  const phase = (seed >> 9) % 7;
  // Weekend dip is built in — index 5 is "Saturday" in our local convention.
  return Array.from({ length: 7 }, (_, i) => {
    const dayWave = Math.sin(((i + phase) / 7) * Math.PI * 2);
    const noise = (((seed >> (i * 3)) & 7) - 3);
    const weekendDip = (i === 5 || i === 6) ? -8 : 0;
    const lowStockBoost = stock > 0 && stock < 30 ? 6 : 0;
    return Math.max(5, Math.round(baseline + amplitude * dayWave + noise + weekendDip + lowStockBoost));
  });
}

/** Sum the 7 days for a quick "total" pill next to the sparkline. */
export function seriesTotal(series: number[]): number {
  return series.reduce((s, n) => s + n, 0);
}

/** Compare last 3 days vs first 4 to pick a trend direction. */
export function seriesTrendPct(series: number[]): number {
  if (series.length < 7) return 0;
  const early = series.slice(0, 4).reduce((s, n) => s + n, 0) / 4;
  const late  = series.slice(4).reduce((s, n) => s + n, 0) / 3;
  if (early === 0) return 0;
  return ((late - early) / early) * 100;
}
