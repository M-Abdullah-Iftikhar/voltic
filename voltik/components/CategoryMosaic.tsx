'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icon, type IconKey } from './Icons';
import { ProductIllustration } from './ProductIllustration';

interface Tile {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  /** Total products in this category for the badge. */
  count: number;
}

/**
 * Photo-wall style category grid. Each tile is slightly rotated and
 * overlaps its neighbours — hovering one snaps it upright and pushes it
 * to the front. Designed as an alternative-feeling browse beneath the
 * AnimatedCategoryShowcase so the landing has visual rhythm.
 *
 * Rotations are deterministic per index so the layout is the same on
 * every render (no SSR/CSR mismatch) and never resets when filters change.
 */
export function CategoryMosaic({ tiles }: { tiles: Tile[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  if (tiles.length === 0) return null;

  // Pre-baked rotation + offset table — gentle tilts that read as "scattered Polaroids".
  const decor = [
    { rot: -4,  y:  6 },
    { rot:  3,  y: -4 },
    { rot: -2,  y:  3 },
    { rot:  5,  y: -8 },
    { rot: -6,  y:  2 },
    { rot:  2,  y: -3 },
    { rot: -3,  y:  6 },
    { rot:  4,  y: -2 }
  ];

  return (
    <section className="container-x py-16">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
        <div>
          <span className="text-xs uppercase tracking-[0.18em] font-semibold text-brand">From the cutting room floor</span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl mt-2 leading-tight">The whole shelf, scattered.</h2>
          <p className="text-muted text-sm mt-1 max-w-xl">
            Same eight collections, less rigid. Hover or tap a tile to bring it to the front.
          </p>
        </div>
        <Link href="/shop" className="btn-ghost shrink-0">
          Open the catalogue <Icon.arrow width={14} height={14} />
        </Link>
      </div>

      <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-6 px-2 sm:px-6 py-8">
        {tiles.map((c, i) => {
          const Glyph = (Icon as Record<string, React.FC<{ width?: number; height?: number; className?: string }>>)[c.icon as IconKey] || Icon.box;
          const d = decor[i % decor.length];
          const isHovered = hovered === c.id;

          // When hovered: rotate to 0, lift up, push z-index above siblings.
          const rot = isHovered ? 0 : d.rot;
          const y   = isHovered ? -10 : d.y;
          const scale = isHovered ? 1.05 : 1;

          return (
            <Link
              key={c.id}
              href={`/shop?category=${c.id}`}
              onMouseEnter={() => setHovered(c.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(c.id)}
              onBlur={() => setHovered(null)}
              className="group relative block focus-visible:outline-none"
              style={{
                transform: `rotate(${rot}deg) translateY(${y}px) scale(${scale})`,
                transition: 'transform 360ms cubic-bezier(.34,1.56,.64,1)',
                zIndex: isHovered ? 30 : 10 + (i % 6)
              }}
            >
              {/* Polaroid frame */}
              <div
                className="bg-surface rounded-2xl border border-line/80 overflow-hidden"
                style={{
                  // Custom shadow that mimics a paper print sitting on others.
                  boxShadow: isHovered
                    ? '0 30px 60px -20px rgb(15 23 42 / 0.35), 0 0 0 1px rgb(var(--brand) / 0.25)'
                    : '0 12px 22px -12px rgb(15 23 42 / 0.35)'
                }}
              >
                <div className="relative">
                  <ProductIllustration category={c.id} icon={c.icon} className="aspect-square" size={68} />
                  <span
                    className="absolute top-3 left-3 chip bg-surface/95 backdrop-blur-sm border border-line/70 !text-[10px] text-ink font-semibold"
                    aria-hidden
                  >
                    <Glyph width={10} height={10} className="text-brand" />
                    {c.count} item{c.count === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="p-3.5">
                  <div className="font-semibold text-ink line-clamp-1 text-sm flex items-center gap-1.5">
                    {c.name}
                    <Icon.arrow
                      width={12}
                      height={12}
                      className={`text-brand transition-transform ${isHovered ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0'}`}
                    />
                  </div>
                  <p className="text-[11px] text-muted mt-1 line-clamp-2">{c.blurb}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
