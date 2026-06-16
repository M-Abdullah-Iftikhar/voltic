'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import type { EnrichedProduct } from '@/lib/types';

/**
 * Hero ad carousel — one consistent neutral treatment for every slide.
 *  - 3-6 product ads
 *  - Auto-rotates every ~5s
 *  - Pause on hover + when offscreen (IntersectionObserver)
 *  - Crossfade transition
 *  - Touch-swipe + arrow + dot navigation
 *
 * Brand color is reserved for CTAs / accents only; the slide background
 * stays neutral so the catalogue doesn't feel like a children's party.
 */

const SLIDE_MS = 5200;

interface HeroCarouselProps {
  products: EnrichedProduct[];
}

export function HeroCarousel({ products }: HeroCarouselProps) {
  const slides = products.slice(0, 6);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => setIdx(i => (i + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setIdx(i => (i - 1 + slides.length) % slides.length), [slides.length]);
  const goto = useCallback((i: number) => setIdx(i), []);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setInterval(next, SLIDE_MS);
    return () => clearInterval(t);
  }, [paused, slides.length, next]);

  useEffect(() => {
    if (!containerRef.current) return;
    const io = new IntersectionObserver(([e]) => setPaused(p => !e.isIntersecting || p), { threshold: 0.2 });
    io.observe(containerRef.current);
    return () => io.disconnect();
  }, []);

  const touchX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) dx > 0 ? prev() : next();
  };

  if (slides.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="relative h-[420px] sm:h-[520px] lg:h-[600px] rounded-[32px] overflow-hidden ring-1 ring-line/60 shadow-card bg-surface"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured products"
    >
      {/* Slide stack */}
      {slides.map((p, i) => {
        const active = i === idx;
        const discount = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
        return (
          <article
            key={p.id}
            aria-hidden={!active}
            className={`absolute inset-0 transition-all duration-1000 ease-out ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04] pointer-events-none'}`}
            style={{ transformOrigin: 'center center' }}
          >
            {/* Neutral slide canvas */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, rgb(var(--illus-from)), rgb(var(--illus-to)))' }}
            />
            {/* Whisper of brand color in one corner — keeps identity without flashy */}
            <div
              className="absolute -bottom-24 -right-24 w-[60%] h-[60%] rounded-full blur-3xl opacity-25"
              style={{ background: 'radial-gradient(circle, rgb(var(--brand)), transparent 65%)' }}
            />

            {/* Floating product art */}
            <div
              className={`absolute right-[-6%] top-1/2 -translate-y-1/2 w-[56%] aspect-square ${active ? 'animate-floaty' : ''}`}
              style={{
                transform: active ? 'translateY(-50%) scale(1)' : 'translateY(-45%) scale(1.04)',
                transition: 'transform 6s ease-out'
              }}
            >
              <ProductIllustration
                category={p.category}
                icon={p.icon}
                size={240}
                className="w-full h-full rounded-[40px]"
              />
            </div>

            {/* Copy */}
            <div className="relative h-full flex flex-col justify-center p-8 sm:p-12 max-w-[60%]">
              {p.badge && (
                <span className="chip bg-ink/5 border border-line text-ink w-fit mb-3">
                  {p.badge}
                </span>
              )}
              <h2 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl leading-[1.05] text-balance text-ink">
                {p.name}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted max-w-md line-clamp-2">
                {p.description}
              </p>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-bold gradient-text">${p.price.toFixed(2)}</span>
                {p.oldPrice && (
                  <>
                    <span className="text-muted line-through">${p.oldPrice.toFixed(2)}</span>
                    <span className="chip bg-ink text-bg">−{discount}%</span>
                  </>
                )}
              </div>
              <div className="mt-6 flex gap-3">
                <Link href={`/product/${p.slug || p.id}`} className="btn-primary">
                  Shop this <Icon.arrow width={14} height={14} />
                </Link>
                <Link href="/shop" className="btn-ghost">
                  Browse all
                </Link>
              </div>
              {p.reviewsCount > 0 && (
                <div className="mt-5 flex items-center gap-2 text-xs text-muted">
                  <Icon.star className="text-warn" width={12} height={12} />
                  <span className="font-semibold text-ink">{p.rating.toFixed(1)}</span>
                  <span>· {p.reviewsCount.toLocaleString()} reviews</span>
                </div>
              )}
            </div>
          </article>
        );
      })}

      {/* Arrow controls */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 grid place-items-center h-10 w-10 rounded-full glass text-ink hover:scale-105 transition"
          >
            <Icon.arrow width={16} height={16} className="rotate-180" />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center h-10 w-10 rounded-full glass text-ink hover:scale-105 transition"
          >
            <Icon.arrow width={16} height={16} />
          </button>
        </>
      )}

      {/* Indicator dots + autoplay progress */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goto(i)}
            aria-label={`Show slide ${i + 1}`}
            className={`relative h-1.5 rounded-full transition-all overflow-hidden ${i === idx ? 'w-8 bg-ink/20' : 'w-1.5 bg-ink/15 hover:bg-ink/30'}`}
          >
            {i === idx && !paused && (
              <span
                key={idx}
                className="absolute inset-y-0 left-0 bg-ink rounded-full"
                style={{ animation: `progress ${SLIDE_MS}ms linear forwards`, width: 0 }}
              />
            )}
          </button>
        ))}
      </div>

      <style jsx>{`
        @keyframes progress { from { width: 0; } to { width: 100%; } }
      `}</style>
    </div>
  );
}
