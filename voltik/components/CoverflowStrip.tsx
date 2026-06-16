'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import type { EnrichedProduct } from '@/lib/types';

/**
 * 3D Coverflow product strip. The active card sits front-and-centre at
 * 100% scale; its neighbours tilt away and shrink so the eye reads depth
 * not just a row. Keyboard / arrow-button / touch navigation; reduced-
 * motion users get a flat horizontal row (still functional, no parallax).
 *
 * Renders nothing under 3 products so the depth illusion holds.
 */
interface Props {
  products: EnrichedProduct[];
  /** Section title shown above the strip. */
  title?: string;
  /** Optional kicker rendered above the title. */
  kicker?: string;
}

export function CoverflowStrip({ products, title = 'Editor\'s picks', kicker = 'In rotation' }: Props) {
  const items = products.slice(0, 10);
  const [idx, setIdx] = useState(0);
  const [reduced, setReduced] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Touch swipe.
  const touchX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) < 40) return;
    dx > 0 ? prev() : next();
  };

  const next = () => setIdx(i => Math.min(items.length - 1, i + 1));
  const prev = () => setIdx(i => Math.max(0, i - 1));

  // Keyboard nav.
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
  };

  if (items.length < 3) return null;

  return (
    <section className="container-x py-16">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
        <div>
          <span className="text-xs uppercase tracking-[0.18em] font-semibold text-brand">{kicker}</span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl mt-2 leading-tight">{title}</h2>
          <p className="text-muted text-sm mt-1">Swipe or tap the arrows — the centre card is up for grabs.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={prev} disabled={idx === 0} aria-label="Previous"
            className="grid place-items-center h-10 w-10 rounded-full border border-line text-ink hover:bg-elev transition disabled:opacity-40">
            <Icon.arrow width={14} height={14} className="rotate-180" />
          </button>
          <button onClick={next} disabled={idx === items.length - 1} aria-label="Next"
            className="grid place-items-center h-10 w-10 rounded-full border border-line text-ink hover:bg-elev transition disabled:opacity-40">
            <Icon.arrow width={14} height={14} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={onKey}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        role="region"
        aria-roledescription="carousel"
        aria-label={title}
        className="relative h-[380px] sm:h-[440px] flex items-center justify-center focus:outline-none"
        style={{ perspective: reduced ? 'none' : '1200px' }}
      >
        <div className="relative h-full w-full">
          {items.map((p, i) => {
            const offset = i - idx;
            const abs = Math.abs(offset);
            // Cards more than 3 away are off-screen and hidden from a11y.
            if (abs > 3) return null;

            // 3D placement: x slides, scale shrinks with distance, rotation
            // tilts cards into the page. Reduced-motion = pure horizontal row.
            const x = reduced ? offset * 220 : offset * 180;
            const scale = reduced ? 1 : Math.max(0.6, 1 - abs * 0.12);
            const rotY = reduced ? 0 : Math.max(-45, Math.min(45, -offset * 18));
            const z = -abs * 80;
            const isActive = offset === 0;

            return (
              <article
                key={p.id}
                aria-hidden={!isActive}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => !isActive && setIdx(i)}
                className={`absolute top-1/2 left-1/2 w-[230px] sm:w-[260px] transition-all duration-500 ease-out ${isActive ? 'z-30' : 'cursor-pointer'}`}
                style={{
                  transform: `translate(-50%, -50%) translate3d(${x}px, 0, ${z}px) rotateY(${rotY}deg) scale(${scale})`,
                  opacity: abs > 2 ? 0.25 : abs > 1 ? 0.55 : 1,
                  transformStyle: reduced ? 'flat' : 'preserve-3d',
                  filter: abs > 0 ? `blur(${abs * 0.7}px)` : 'none'
                }}
              >
                <Card product={p} active={isActive} />
              </article>
            );
          })}
        </div>
      </div>

      {/* Pagination dots */}
      <div className="flex items-center justify-center gap-1.5 mt-6">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Show ${items[i].name}`}
            aria-current={i === idx ? 'true' : undefined}
            className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-8 bg-brand' : 'w-1.5 bg-line hover:bg-muted'}`}
          />
        ))}
      </div>
    </section>
  );
}

function Card({ product, active }: { product: EnrichedProduct; active: boolean }) {
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;
  return (
    <Link
      href={`/product/${product.slug || product.id}`}
      tabIndex={active ? 0 : -1}
      className={`block card overflow-hidden transition-all ${active ? 'shadow-card ring-2 ring-brand/30' : ''}`}
    >
      <div className="relative">
        {product.badge && (
          <span className="absolute top-3 left-3 chip bg-brand text-white !text-[10px] z-10">{product.badge}</span>
        )}
        {discount > 0 && (
          <span className="absolute top-3 right-3 chip bg-danger text-white !text-[10px] z-10">−{discount}%</span>
        )}
        <ProductIllustration
          category={product.category}
          icon={product.icon}
          className="aspect-square"
          size={88}
        />
      </div>
      <div className="p-4">
        <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{product.brand}</div>
        <div className="text-sm font-semibold text-ink line-clamp-1 mt-1">{product.name}</div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-base font-bold gradient-text">${product.price.toFixed(2)}</span>
          {product.oldPrice && <span className="text-[11px] text-muted line-through">${product.oldPrice.toFixed(2)}</span>}
        </div>
        {active && (
          <div className="mt-3 inline-flex items-center gap-1 text-xs text-brand font-semibold">
            View product <Icon.arrow width={11} height={11} />
          </div>
        )}
      </div>
    </Link>
  );
}
