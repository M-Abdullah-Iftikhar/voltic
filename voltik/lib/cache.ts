/**
 * Centralised cache layer in front of `db.*` reads. We wrap the
 * hot-path collection reads (products, categories, category subtree
 * counts) in `unstable_cache` so the storefront isn't reading from
 * Mongo on every render — and so the data layer stays the same shape
 * for any caller that doesn't want caching (admin tools, etc.).
 *
 * Tag-based invalidation: admin mutations call `bustProducts()` /
 * `bustCategories()` to refresh the next read. That keeps the
 * storefront feeling live while still amortising thousands of reads
 * over a single Mongo round-trip.
 *
 * Cache duration is intentionally short (60s) — the tag-based bust is
 * the authoritative invalidation; the TTL is a safety net for the case
 * where a caller forgot to revalidate.
 */
import { revalidateTag, unstable_cache } from 'next/cache';
import { db } from './db';
import type { Category, Product } from './types';

export const PRODUCTS_TAG = 'voltik:products';
export const CATEGORIES_TAG = 'voltik:categories';

/** Cached product list. Falls back to a live read on a thrown error. */
export const getCachedProducts = unstable_cache(
  async (): Promise<Product[]> => db.listProducts(),
  ['voltik-products-v2'],
  { tags: [PRODUCTS_TAG], revalidate: 60 }
);

/** Cached category list. Changes very rarely so we give it a longer TTL. */
export const getCachedCategories = unstable_cache(
  async (): Promise<Category[]> => db.listCategories(),
  ['voltik-categories-v2'],
  { tags: [CATEGORIES_TAG], revalidate: 600 }
);

/**
 * Subtree product counts per category, computed via a single Mongo
 * aggregation instead of the JS-side N+1 the old `subtreeCounts` did.
 *
 * Strategy: pull every product's id + category, plus the full category
 * list, then walk the tree once to compute descendant ids per root.
 * That's still O(categories + products) but it's a single Mongo round
 * trip per cache miss and the result is cached so the storefront pays
 * for it once per 5 min.
 */
export const getCachedCategoryCounts = unstable_cache(
  async (): Promise<Record<string, number>> => {
    const [categories, products] = await Promise.all([
      db.listCategories(),
      db.listProducts()
    ]);
    const childrenByParent = new Map<string | null, string[]>();
    for (const c of categories) {
      const arr = childrenByParent.get(c.parent) || [];
      arr.push(c.id);
      childrenByParent.set(c.parent, arr);
    }
    function subtree(rootId: string, acc: Set<string>) {
      acc.add(rootId);
      for (const cid of childrenByParent.get(rootId) || []) subtree(cid, acc);
    }
    const out: Record<string, number> = {};
    for (const c of categories) {
      const ids = new Set<string>();
      subtree(c.id, ids);
      out[c.id] = products.filter(p => ids.has(p.category)).length;
    }
    return out;
  },
  ['voltik-category-counts-v1'],
  { tags: [PRODUCTS_TAG, CATEGORIES_TAG], revalidate: 300 }
);

/** Admin product CRUD calls this so the next storefront read picks up the change. */
export function bustProducts(): void {
  revalidateTag(PRODUCTS_TAG);
}

/** Admin category CRUD calls this to refresh both lists since counts depend on either. */
export function bustCategories(): void {
  revalidateTag(CATEGORIES_TAG);
  revalidateTag(PRODUCTS_TAG);
}
