import { db } from './db';
import type { EnrichedProduct, Product, Review } from './types';

/** Compute { average, count } for a single product's reviews. Hidden reviews are ignored. */
export function aggregate(reviews: Review[]) {
  const live = reviews.filter(r => !r.hidden);
  if (live.length === 0) return { rating: 0, reviewsCount: 0 };
  const sum = live.reduce((s, r) => s + r.rating, 0);
  return { rating: Math.round((sum / live.length) * 10) / 10, reviewsCount: live.length };
}

/**
 * Enrich a list of products with rating + review count. Prefers the
 * cached aggregates persisted on the Product row by
 * `db.recomputeProductAggregate`; only falls back to a live recompute
 * for products that have no cached value yet (the first-deploy
 * migration window). The fallback walks `db.listReviews()` once so it
 * stays O(reviews + products) — same shape as before, just optional.
 */
export async function enrich(products: Product[]): Promise<EnrichedProduct[]> {
  const needsFallback = products.some(p => p.cachedRating == null || p.cachedReviewsCount == null);
  const fallbackByProduct = needsFallback ? new Map<string, Review[]>() : null;
  if (fallbackByProduct) {
    for (const r of await db.listReviews()) {
      const arr = fallbackByProduct.get(r.productId) || [];
      arr.push(r);
      fallbackByProduct.set(r.productId, arr);
    }
  }
  return products.map(p => {
    if (p.cachedRating != null && p.cachedReviewsCount != null) {
      return { ...p, rating: p.cachedRating, reviewsCount: p.cachedReviewsCount };
    }
    const own = fallbackByProduct?.get(p.id) || [];
    return { ...p, ...aggregate(own) };
  });
}

/** Enrich a single product — cache-aware, with a live fallback. */
export async function enrichOne(product: Product): Promise<EnrichedProduct> {
  if (product.cachedRating != null && product.cachedReviewsCount != null) {
    return { ...product, rating: product.cachedRating, reviewsCount: product.cachedReviewsCount };
  }
  const reviews = await db.listReviewsForProduct(product.id);
  return { ...product, ...aggregate(reviews) };
}
