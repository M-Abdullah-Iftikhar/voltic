'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import type { EnrichedProduct } from '@/lib/types';

/** Floating mini-card that cross-fades through trending products. Designed
 *  to overlay the hero carousel without competing for attention. */
export function TrendingWidget({ products }: { products: EnrichedProduct[] }) {
  const items = products.slice(0, 5);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), 3200);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;
  const p = items[idx];

  return (
    <div className="glass rounded-2xl p-3 pr-4 shadow-soft min-w-[240px] animate-floaty" aria-live="polite">
      <div className="flex items-center gap-3">
        <ProductIllustration
          key={p.id}
          category={p.category}
          icon={p.icon}
          className="h-12 w-12 rounded-xl shrink-0 animate-slidein"
          size={26}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-[10px] text-muted uppercase tracking-wider font-semibold">
            <span className="relative grid place-items-center h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-danger animate-pulseRing" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-danger" />
            </span>
            Trending now
          </div>
          <Link href={`/product/${p.slug || p.id}`} className="block text-sm font-semibold text-ink line-clamp-1 hover:text-brand">
            {p.name}
          </Link>
          <div className="text-[11px] text-muted flex items-center gap-1.5">
            <Icon.star className="text-warn" width={10} height={10} />
            <span className="text-ink font-semibold">{p.reviewsCount > 0 ? p.rating.toFixed(1) : 'New'}</span>
            <span>· ${p.price.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
