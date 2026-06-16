'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import type { Ad, Product } from '@/lib/types';

interface Props {
  ads: Ad[];
  /** Lookup table for resolving linked products. */
  productsById: Record<string, Product>;
  /** Auto-rotate cadence; honoured only when there are 2+ ads. */
  rotationMs?: number;
}

/**
 * Storefront-facing slot that rotates the active "rotator" or "banner"
 * ads created in `/admin/ads`. The component is purely presentational —
 * the server passes a pre-filtered list (active + within date window)
 * via the prop so we don't re-run the gate on every paint.
 *
 * Honours `prefers-reduced-motion` by freezing on the first slide.
 */
export function PromoSlot({ ads, productsById, rotationMs = 7000 }: Props) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (paused || reduced || ads.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % ads.length), rotationMs);
    return () => clearInterval(t);
  }, [paused, reduced, ads.length, rotationMs]);

  if (ads.length === 0) return null;
  const ad = ads[idx];
  const product = ad.productId ? productsById[ad.productId] : undefined;

  return (
    <section
      className="container-x pt-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Link
        key={ad.id}
        href={ad.ctaHref}
        className={`group relative block rounded-3xl overflow-hidden bg-gradient-to-br ${ad.gradient} text-white p-6 sm:p-10 shadow-card animate-fadein`}
      >
        <div aria-hidden className="absolute inset-0 bg-black/15" />
        <div className="relative grid sm:grid-cols-[1.4fr_1fr] gap-6 items-center">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold opacity-80">
              {ad.placement === 'banner' ? 'Featured drop' : 'Sponsored slot'}
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl mt-2 leading-tight">{ad.headline}</h2>
            {ad.tagline && <p className="text-sm sm:text-base opacity-90 mt-2 max-w-md">{ad.tagline}</p>}
            <span className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-ink text-sm font-semibold group-hover:gap-2 transition-all">
              {ad.ctaLabel} <Icon.arrow width={12} height={12} />
            </span>
          </div>
          {product && (
            <div className="hidden sm:flex justify-end">
              <div className="relative h-40 w-40 rounded-2xl bg-white/15 backdrop-blur grid place-items-center">
                <ProductIllustration category={product.category} icon={product.icon} className="h-32 w-32" size={84} />
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 chip bg-white text-ink !text-[11px] font-bold">
                  ${product.price.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Dot pager when there's more than one ad */}
        {ads.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setIdx(i); }}
                aria-label={`Show ad ${i + 1}`}
                aria-current={i === idx}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        )}
      </Link>
    </section>
  );
}
