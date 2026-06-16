'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import { useRecentlyViewed } from './RecentlyViewedContext';
import type { EnrichedProduct } from '@/lib/types';

interface Props {
  /** Full catalog (or any superset) so we can join recently-viewed ids → products. */
  catalog: EnrichedProduct[];
  /** Optional product id to exclude (e.g. the current product detail page). */
  excludeId?: string;
  title?: string;
}

/**
 * Horizontal strip of "Recently viewed" mini-cards. Hides itself when there's
 * nothing to show. Hydrates after mount so SSR + client render line up.
 */
export function RecentlyViewed({ catalog, excludeId, title = 'Recently viewed' }: Props) {
  const { ids, clear } = useRecentlyViewed();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  if (!hydrated) return null;

  const items = ids
    .filter(id => id !== excludeId)
    .map(id => catalog.find(p => p.id === id))
    .filter((p): p is EnrichedProduct => !!p)
    .slice(0, 8);

  if (items.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-xl">{title}</h2>
        <button
          onClick={clear}
          className="text-xs text-muted hover:text-danger underline-offset-2 hover:underline"
        >
          Clear history
        </button>
      </div>

      <ul className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
        {items.map(p => (
          <li key={p.id} className="shrink-0 w-44">
            <Link href={`/product/${p.slug || p.id}`} className="card card-hover p-3 block">
              <ProductIllustration category={p.category} icon={p.icon} className="aspect-square" size={56} />
              <div className="mt-3">
                <div className="text-xs font-semibold text-ink line-clamp-1">{p.name}</div>
                <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                  <span className="font-bold gradient-text">${p.price.toFixed(2)}</span>
                  {p.reviewsCount > 0 && (
                    <span className="ml-auto flex items-center gap-0.5">
                      <Icon.star className="text-warn" width={10} height={10} />
                      {p.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Headless tracker — drop into any page to record a product visit. */
export function TrackVisit({ productId }: { productId: string }) {
  const { track } = useRecentlyViewed();
  useEffect(() => { track(productId); }, [productId, track]);
  return null;
}
