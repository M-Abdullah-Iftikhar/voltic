'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon, type IconKey } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import type { EnrichedProduct } from '@/lib/types';

type Tile = {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  /** Highest-rated product in this category, if any. */
  topProduct?: { id: string; slug?: string; name: string; icon: string; price: number };
};

/**
 * Auto-pulsing category grid: every ~2s one tile crossfades from its
 * category illustration into the top product, holds 1.5s, then fades
 * back. Sequential, never two at once — the page feels alive without
 * looking glitchy.
 *
 * Respects prefers-reduced-motion (kills the cycling, shows static tiles)
 * and pauses when the section is offscreen.
 */
export function AnimatedCategoryShowcase({ tiles }: { tiles: Tile[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Pause when scrolled offscreen so we don't burn CPU on tabs left open.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(([entry]) => setPaused(!entry.isIntersecting), { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Pulse loop — 2s per tile, hold 1.5s on the product, then fall back.
  useEffect(() => {
    if (paused || tiles.length === 0) return;
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let i = 0;
    const tick = () => {
      // Only pulse tiles that actually have a top product to fade into.
      const candidate = tiles[i % tiles.length];
      if (candidate.topProduct) {
        setActive(i % tiles.length);
        // Hold the product for 1.5s, then drop back to "no tile active".
        setTimeout(() => setActive(null), 1500);
      }
      i = (i + 1) % tiles.length;
    };
    tick();
    const interval = setInterval(tick, 2200);
    return () => clearInterval(interval);
  }, [tiles, paused]);

  return (
    <div ref={sectionRef} className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {tiles.map((c, i) => {
        const Glyph = (Icon as Record<string, React.FC<{ width?: number; height?: number; className?: string }>>)[c.icon as IconKey] || Icon.box;
        const isActive = active === i && !!c.topProduct;
        const product = c.topProduct;

        // When pulsing, navigate to the product (extra hint). Otherwise to category.
        const href = isActive && product
          ? `/product/${product.slug || product.id}`
          : `/shop?category=${c.id}`;

        return (
          <Link
            key={c.id}
            href={href}
            className="group card card-hover relative overflow-hidden focus-visible:ring-2 focus-visible:ring-brand"
          >
            {/* CATEGORY LAYER — fades out when the product takes over. */}
            <div
              className={`p-5 transition-opacity duration-500 ${isActive ? 'opacity-0' : 'opacity-100'}`}
              aria-hidden={isActive}
            >
              <ProductIllustration category={c.id} icon={c.icon} className="aspect-[5/3] rounded-xl" size={72} />
              <div className="mt-4">
                <h3 className="font-semibold text-ink flex items-center gap-2">
                  {c.name}
                  <Icon.arrow width={14} height={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition text-brand" />
                </h3>
                <p className="text-xs text-muted mt-1 line-clamp-1">{c.blurb}</p>
              </div>
            </div>

            {/* PRODUCT LAYER — fades in only when this tile is active. */}
            {product && (
              <div
                className={`absolute inset-0 p-5 transition-opacity duration-500 pointer-events-none ${isActive ? 'opacity-100' : 'opacity-0'}`}
                aria-hidden={!isActive}
              >
                <div className="relative h-full flex flex-col">
                  <span className="chip bg-brand text-white absolute top-0 right-0 !text-[10px]">
                    <Icon.spark width={10} height={10} /> Top pick
                  </span>
                  <ProductIllustration
                    category={c.id}
                    icon={product.icon}
                    className="aspect-[5/3] rounded-xl"
                    size={84}
                  />
                  <div className="mt-4">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-brand font-semibold">
                      <Glyph width={11} height={11} />
                      {c.name}
                    </div>
                    <div className="mt-1 font-semibold text-ink line-clamp-1">{product.name}</div>
                    <div className="text-xs gradient-text font-bold mt-1">${product.price.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Subtle pulse halo when active — pure CSS, no JS animation churn. */}
            {isActive && (
              <span
                aria-hidden
                className="absolute inset-0 rounded-2xl pointer-events-none animate-fadein"
                style={{ boxShadow: '0 0 0 1px rgb(var(--brand) / 0.35), 0 18px 60px -20px rgb(var(--brand) / 0.45)' }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
