import { db } from './db';
import type { EnrichedProduct, Product, Review } from './types';

/** Compute { average, count } for a single product's reviews. */
export function aggregate(reviews: Review[]) {
  if (reviews.length === 0) return { rating: 0, reviewsCount: 0 };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return { rating: Math.round((sum / reviews.length) * 10) / 10, reviewsCount: reviews.length };
}

/** Enrich a list of products with their real-time rating + review count. */
export async function enrich(products: Product[]): Promise<EnrichedProduct[]> {
  const all = await db.listReviews();
  return products.map(p => {
    const own = all.filter(r => r.productId === p.id);
    return { ...p, ...aggregate(own) };
  });
}

/** Enrich a single product. */
export async function enrichOne(product: Product): Promise<EnrichedProduct> {
  const reviews = await db.listReviewsForProduct(product.id);
  return { ...product, ...aggregate(reviews) };
}
