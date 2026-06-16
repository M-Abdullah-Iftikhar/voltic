'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import { FlashSaleCountdown } from './FlashSaleCountdown';
import type { EnrichedProduct } from '@/lib/types';

/**
 * Side-scrolling deal strip — horizontal carousel of discounted products
 * with a synchronised countdown header. Auto-advances every 4 seconds,
 * supports manual swipe / arrow keys / pause-on-hover. Cards are full
 * snapping units so swipe lands cleanly on mobile.
 *
 * Honours prefers-reduced-motion (no auto-advance) and pauses offscreen.
 */
export function DealStrip({ products }: { products: EnrichedProduct[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sectionRef  = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [offscreen, setOffscreen] = useState(false);

  // Auto-advance one card every 4s.
  useEffect(() => {
    if (hovered || offscreen) return;
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const id = setInterval(() => advance(1), 4000);
    return () => clearInterval(id);
  }, [hovered, offscreen]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting), { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const advance = (dir: 1 | -1) => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const card = sc.querySelector('[data-deal-card]') as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 : 320;     // card width + gap-4
    const max  = sc.scrollWidth - sc.clientWidth;
    const next = sc.scrollLeft + dir * step;
    // Wrap-around so the strip feels infinite.
    if (next > max + 8)      sc.scrollTo({ left: 0,   behavior: 'smooth' });
    else if (next < -8)      sc.scrollTo({ left: max, behavior: 'smooth' });
    else                     sc.scrollTo({ left: next, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <section className="container-x py-16" ref={sectionRef}>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="grid place-items-center h-9 w-9 rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg,rgb(var(--danger)),rgb(var(--brand2)))' }}
            >
              <Icon.bolt width={16} height={16} />
            </span>
            <span className="text-xs uppercase tracking-[0.18em] font-semibold text-danger">Flash deals</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl mt-2 leading-tight">
            Today's drops — get them before they're gone.
          </h2>
          <div className="mt-3"><FlashSaleCountdown label="Ends in" tone="accent" /></div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => advance(-1)}
            aria-label="Previous deal"
            className="grid place-items-center h-10 w-10 rounded-full border border-line text-ink hover:bg-elev transition"
          >
            <Icon.arrow width={14} height={14} className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => advance(1)}
            aria-label="Next deal"
            className="grid place-items-center h-10 w-10 rounded-full border border-line text-ink hover:bg-elev transition"
          >
            <Icon.arrow width={14} height={14} />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 mask-fade-r"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); advance(1); }
          if (e.key === 'ArrowLeft')  { e.preventDefault(); advance(-1); }
        }}
        aria-roledescription="carousel"
        aria-label="Flash deals"
      >
        {products.map((p) => {
          const discount = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
          return (
            <Link
              data-deal-card
              key={p.id}
              href={`/product/${p.slug || p.id}`}
              className="snap-start shrink-0 w-[260px] sm:w-[300px] card card-hover p-4 flex flex-col relative overflow-hidden"
            >
              {/* Chips need an explicit z-index — the illustration below
                  uses `.illus` with `isolation: isolate`, which can
                  otherwise let its border/background visually clip them. */}
              {discount > 0 && (
                <span className="absolute top-3 left-3 z-10 chip bg-danger text-white shadow-soft">
                  −{discount}%
                </span>
              )}
              <span className="absolute top-3 right-3 z-10 chip bg-warn text-bg shadow-soft">
                <Icon.spark width={10} height={10} /> Limited
              </span>
              {/* Extra top margin so the illustration starts BELOW the chip row */}
              <ProductIllustration
                category={p.category}
                icon={p.icon}
                className="aspect-square rounded-xl mt-8"
                size={88}
              />
              <div className="mt-3 flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink line-clamp-1">{p.name}</div>
                <div className="text-xs text-muted">{p.brand} · {p.sku}</div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xl font-bold gradient-text">${p.price.toFixed(2)}</span>
                {p.oldPrice && <span className="text-xs text-muted line-through">${p.oldPrice.toFixed(2)}</span>}
              </div>
              {p.stock > 0 && p.stock < 30 && (
                <div className="mt-3 h-1 rounded-full bg-elev overflow-hidden">
                  <div className="h-full bg-danger" style={{ width: `${Math.max(15, (p.stock / 30) * 100)}%` }} />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
