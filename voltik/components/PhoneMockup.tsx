'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import type { EnrichedProduct } from '@/lib/types';

/**
 * Tilted phone mockup that auto-cycles through a small set of products,
 * each entrance is a slide-in plus a brief glow burst. Sits as a hero
 * accent — visual storytelling, not a primary CTA. Honours reduced-motion
 * (renders one static product) and pauses when offscreen.
 */
export function PhoneMockup({ products }: { products: EnrichedProduct[] }) {
  const items = products.slice(0, 5);
  const [idx, setIdx] = useState(0);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const t = setInterval(() => {
      setIdx(i => (i + 1) % items.length);
      setPulse(p => p + 1);
    }, 4200);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;
  const p = items[idx];
  const discount = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;

  return (
    <div
      className="relative w-[260px] sm:w-[300px] aspect-[10/19] mx-auto"
      style={{ transform: 'rotate(-7deg)', filter: 'drop-shadow(0 30px 60px rgb(0 0 0 / 0.35))' }}
      aria-label="Featured product on a phone screen"
    >
      {/* Glow burst on slide change */}
      <span
        key={pulse}
        aria-hidden
        className="absolute -inset-8 rounded-[60px] pointer-events-none animate-fadein"
        style={{ background: 'radial-gradient(circle, rgb(var(--brand) / 0.35), transparent 65%)' }}
      />

      {/* Phone bezel */}
      <div
        className="absolute inset-0 rounded-[36px] p-[10px]"
        style={{
          background: 'linear-gradient(160deg, #1f2535 0%, #0b0e18 60%, #1a2034 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 2px rgba(255,255,255,0.08)'
        }}
      >
        {/* Volume / power tabs */}
        <span aria-hidden className="absolute left-[-3px] top-[22%] h-[60px] w-[3px] rounded-l-full bg-black/40" />
        <span aria-hidden className="absolute left-[-3px] top-[36%] h-[36px] w-[3px] rounded-l-full bg-black/40" />
        <span aria-hidden className="absolute right-[-3px] top-[28%] h-[80px] w-[3px] rounded-r-full bg-black/40" />

        {/* Screen */}
        <div
          className="relative h-full w-full rounded-[28px] overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgb(var(--illus-from)), rgb(var(--illus-to)))' }}
        >
          {/* Status bar */}
          <div className="absolute inset-x-0 top-0 h-7 flex items-center justify-between px-5 text-[9px] font-semibold text-ink/70 z-10">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-1 w-3 rounded-full bg-ink/60" />
              <span className="inline-block h-1 w-1 rounded-full bg-ink/60" />
              <span className="inline-block h-1 w-2 rounded-full bg-ink/60" />
            </span>
          </div>

          {/* Notch — pure CSS pill */}
          <span
            aria-hidden
            className="absolute top-1.5 left-1/2 -translate-x-1/2 h-4 w-20 rounded-full bg-black/70 z-10"
          />

          {/* Slide content */}
          <div key={p.id} className="relative h-full flex flex-col p-5 pt-10 animate-fadein">
            {/* App chrome row */}
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-muted font-semibold">
              <span
                className="grid place-items-center h-5 w-5 rounded-md text-white"
                style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}
              >
                <Icon.bolt width={10} height={10} />
              </span>
              Voltik
            </div>

            {/* Product art */}
            <div className="flex-1 grid place-items-center mt-3">
              <ProductIllustration
                category={p.category}
                icon={p.icon}
                className="w-full max-w-[180px] aspect-square rounded-[22px]"
                size={88}
              />
            </div>

            {/* Product card */}
            <div className="mt-3 rounded-2xl bg-surface/95 border border-line/70 p-3">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted font-semibold">
                <span>{p.category}</span>
                {discount > 0 && <span className="chip bg-danger text-white !text-[9px] !px-2 !py-0.5">−{discount}%</span>}
              </div>
              <div className="text-[13px] font-semibold text-ink line-clamp-1 mt-1">{p.name}</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-base font-bold gradient-text">${p.price.toFixed(2)}</span>
                {p.oldPrice && <span className="text-[10px] text-muted line-through">${p.oldPrice.toFixed(2)}</span>}
              </div>
              <Link
                href={`/product/${p.slug || p.id}`}
                className="mt-2.5 block w-full text-center text-[11px] font-semibold text-white rounded-lg py-1.5 transition hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}
              >
                Add to cart
              </Link>
            </div>

            {/* Pagination dots */}
            <div className="mt-3 flex items-center justify-center gap-1">
              {items.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all ${i === idx ? 'w-4 bg-ink/60' : 'w-1 bg-ink/20'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
