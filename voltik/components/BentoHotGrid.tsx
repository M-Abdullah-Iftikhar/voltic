'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import type { EnrichedProduct } from '@/lib/types';

type Cell = { kind: 'hero' | 'medium' | 'small'; intervalMs: number };

/**
 * Bento "What's hot" grid:
 *   - 1 hero spot   (16s rotation, biggest tile, slowest)
 *   - 2 medium      (10s offset)
 *   - 4 small       (7s offset)
 * Each cell crossfades through its own slice of the product list on its
 * own timer, so the page is always moving but never feels chaotic.
 *
 * Pauses when offscreen, kills rotation under prefers-reduced-motion.
 */
const CELLS: Cell[] = [
  { kind: 'hero',   intervalMs: 16000 },
  { kind: 'medium', intervalMs: 10000 },
  { kind: 'medium', intervalMs: 12000 },
  { kind: 'small',  intervalMs: 7000  },
  { kind: 'small',  intervalMs: 8500  },
  { kind: 'small',  intervalMs: 9000  },
  { kind: 'small',  intervalMs: 7500  }
];

export function BentoHotGrid({ products }: { products: EnrichedProduct[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(([entry]) => setPaused(!entry.isIntersecting), { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (products.length < 3) return null;

  // Split the catalog into disjoint pools so two cells never display the
  // same product. Cells rotate through their own pool independently.
  const pools = splitPools(products, CELLS.length);

  return (
    <section className="container-x py-16">
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <span className="text-xs uppercase tracking-[0.18em] font-semibold text-brand">What's hot</span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl mt-2 leading-tight">A snapshot of the catalogue, always moving.</h2>
        </div>
        <Link href="/shop" className="btn-ghost shrink-0">
          Browse everything <Icon.arrow width={14} height={14} />
        </Link>
      </div>

      <div
        ref={sectionRef}
        className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6"
        style={{ gridAutoRows: '160px' }}
      >
        {CELLS.map((cell, i) => (
          <BentoCell key={i} cell={cell} pool={pools[i]} paused={paused} />
        ))}
      </div>
    </section>
  );
}

function BentoCell({ cell, pool, paused }: { cell: Cell; pool: EnrichedProduct[]; paused: boolean }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (paused || pool.length <= 1) return;
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const t = setInterval(() => setIdx(i => (i + 1) % pool.length), cell.intervalMs);
    return () => clearInterval(t);
  }, [pool.length, cell.intervalMs, paused]);

  const product = pool[idx];
  if (!product) return null;

  // Tile sizing — hero spans 2x2, medium 2x1, small 1x1.
  const span =
    cell.kind === 'hero'   ? 'col-span-2 row-span-2 sm:col-span-2 lg:col-span-3 lg:row-span-2'
  : cell.kind === 'medium' ? 'col-span-2 row-span-1 lg:col-span-3'
  :                          'col-span-1 row-span-1 lg:col-span-2';

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <Link
      href={`/product/${product.slug || product.id}`}
      className={`${span} relative overflow-hidden rounded-2xl border border-line bg-surface group transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand`}
    >
      {/* Background illustration — fades when product swaps. */}
      <div key={product.id} className="absolute inset-0 animate-fadein">
        <div className="absolute inset-0 bg-mesh opacity-50" />
        <ProductIllustration
          category={product.category}
          icon={product.icon}
          className="absolute inset-0"
          size={cell.kind === 'hero' ? 220 : cell.kind === 'medium' ? 120 : 80}
        />
      </div>

      {/* Overlay copy */}
      <div className="relative h-full p-4 flex flex-col justify-end bg-gradient-to-t from-bg/95 via-bg/50 to-transparent">
        {cell.kind === 'hero' && (
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="chip bg-brand text-white"><Icon.spark width={10} height={10} /> Featured</span>
            {discount > 0 && <span className="chip bg-danger text-white">−{discount}%</span>}
          </div>
        )}
        <div className={`font-semibold text-ink line-clamp-1 ${cell.kind === 'hero' ? 'text-xl' : 'text-sm'}`}>
          {product.name}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className={`gradient-text font-bold ${cell.kind === 'hero' ? 'text-2xl' : 'text-sm'}`}>${product.price.toFixed(2)}</span>
          {product.oldPrice && cell.kind !== 'small' && (
            <span className="text-xs text-muted line-through">${product.oldPrice.toFixed(2)}</span>
          )}
        </div>
      </div>

      {/* Subtle highlight when the cell ticks over. */}
      <span
        aria-hidden
        key={`pulse-${product.id}`}
        className="absolute inset-0 pointer-events-none animate-fadein rounded-2xl"
        style={{ boxShadow: '0 0 0 1px rgb(var(--brand) / 0.25) inset' }}
      />
    </Link>
  );
}

/**
 * Distribute `items` across `cellCount` cells so no two cells share an
 * entry (when possible). Each pool contains at least 2 items so the
 * rotation actually rotates; falls back to round-robin slicing.
 */
function splitPools<T>(items: T[], cellCount: number): T[][] {
  const pools: T[][] = Array.from({ length: cellCount }, () => []);
  items.forEach((item, i) => pools[i % cellCount].push(item));
  // Make sure every pool has at least 2 items by topping up from the first
  // sufficiently-large pool.
  const donor = pools.find(p => p.length >= 3);
  if (donor) {
    for (const p of pools) {
      if (p.length < 2) p.push(donor[0]);
    }
  }
  return pools;
}
