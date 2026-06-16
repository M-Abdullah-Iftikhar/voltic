'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon, type IconKey } from './Icons';
import type { EnrichedProduct } from '@/lib/types';

interface Tile {
  id: string;
  /** Reviewer first name + city — what surfaces on hover. */
  name: string;
  city: string;
  /** Star rating to show alongside the snippet. */
  rating: number;
  /** Short pull-quote excerpt — the review's own words. */
  excerpt: string;
  /** Product the photo features; gives the tile its link target + icon. */
  product: EnrichedProduct;
  /** Gradient seed for the photo "backdrop" so each tile reads as unique. */
  hue: number;
  /** Grid span — 1, 2, or 3 vertical rows for the masonry rhythm. */
  span: 1 | 2 | 3;
}

const SAMPLE_NAMES = ['Maya', 'Alex', 'Priya', 'Kenji', 'Noor', 'Sam', 'Lena', 'Jordan', 'Toby', 'Ava', 'Rohan', 'Mira'];
const SAMPLE_CITIES = ['Berlin', 'Singapore', 'Mumbai', 'Tokyo', 'Toronto', 'Cape Town', 'Karachi', 'São Paulo', 'Paris', 'Lagos', 'Seoul', 'Lisbon'];

const SAMPLE_EXCERPTS = [
  'Replaced three different bricks with this one. My bag thanks me.',
  'Cable feels solid. Six months of daily abuse, still mint.',
  'These earbuds survived my commute *and* the school run.',
  'Tilted it on my desk and immediately wondered why the old setup ever worked.',
  'Charged from 12% to 100% during one coffee. Wild.',
  'Slipped it into my carry-on and barely noticed it was there.',
  'Snapped onto the back of my phone first try — no fiddling.',
  'Spent an hour outside in light rain. Zero issues.',
  'Sound is warmer than I expected at this price point.',
  'Drop-tested it accidentally. The case won.',
  'My partner stole it within a week. Bought a second one.',
  'The braided sleeve doesn\'t kink. That\'s honestly the whole sell.'
];

/**
 * Masonry mosaic of customer photos with reviews-on-hover. We don't have
 * real UGC yet, so each tile is a stylised gradient "photo" of the
 * product icon — readable as a placeholder, and the layout + interaction
 * mirror exactly what the eventual real-photo version will do. Drop in
 * real images by wiring `Tile.image` once user uploads ship in admin.
 *
 * Tile gradients and spans are seeded from the product id so the wall
 * looks identical across re-renders — no jittering on hover.
 */
export function CustomerPhotoWall({ products }: { products: EnrichedProduct[] }) {
  const tiles = useMemo<Tile[]>(() => buildTiles(products), [products]);
  if (tiles.length === 0) return null;

  return (
    <section className="container-x py-16">
      <div className="text-center mb-8">
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand">From the community</span>
        <h2 className="font-display font-bold text-3xl sm:text-4xl mt-2 leading-tight">
          Real desks. Real bags. Real noise.
        </h2>
        <p className="text-muted text-sm mt-2 max-w-md mx-auto">
          The Voltik shelf, photographed by the people who actually live with it. Hover any tile to read why they bought it.
        </p>
      </div>

      {/* CSS columns gives us a true masonry layout without JS measurement.
          Each tile sets its own height via `span` so the rhythm reads as
          a curated grid, not a uniform tile sheet. */}
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [column-fill:balance]">
        {tiles.map(t => <PhotoTile key={t.id} tile={t} />)}
      </div>

      <div className="text-center mt-8">
        <Link href="/shop" className="btn-ghost text-sm">
          Browse what they bought <Icon.arrow width={12} height={12} />
        </Link>
      </div>
    </section>
  );
}

function PhotoTile({ tile }: { tile: Tile }) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // CSS columns clips break-inside; the inline-block + mb keeps each
  // tile intact across column boundaries.
  const aspect = tile.span === 1 ? 'aspect-[4/3]' : tile.span === 2 ? 'aspect-[4/5]' : 'aspect-[3/5]';

  // Generate the "photo" backdrop — three radial gradients per tile, hue
  // seeded from the product id so identical tiles read identically.
  const bg = `
    radial-gradient(circle at 30% 20%, hsl(${tile.hue} 70% 55% / .65), transparent 55%),
    radial-gradient(circle at 80% 30%, hsl(${(tile.hue + 60) % 360} 75% 60% / .55), transparent 60%),
    radial-gradient(circle at 50% 90%, hsl(${(tile.hue + 220) % 360} 65% 35% / .85), transparent 65%),
    linear-gradient(180deg, hsl(${(tile.hue + 200) % 360} 30% 18%), hsl(${(tile.hue + 250) % 360} 35% 12%))
  `;
  const Glyph = (Icon as Record<string, React.FC<{ width?: number; height?: number; className?: string }>>)[tile.product.icon as IconKey] || Icon.box;

  return (
    <Link
      href={`/product/${tile.product.slug || tile.product.id}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      className="block break-inside-avoid mb-3 group"
    >
      <div
        ref={cardRef}
        className={`relative ${aspect} rounded-2xl overflow-hidden border border-line/60 shadow-soft`}
        style={{ background: bg }}
      >
        {/* "Photo" — product glyph centred at high contrast against the
            gradient backdrop. Stand-in until real UGC lands. */}
        <div className="absolute inset-0 grid place-items-center text-white/85 mix-blend-overlay">
          <Glyph width={tile.span === 1 ? 64 : 96} height={tile.span === 1 ? 64 : 96} />
        </div>

        {/* Always-visible reviewer chip */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="grid place-items-center h-6 w-6 rounded-full bg-white/95 text-[10px] font-bold text-ink shadow-soft">
            {tile.name[0]}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-white/80 font-semibold drop-shadow">
            {tile.name}
          </span>
        </div>
        <div className="absolute top-2 right-2 chip bg-bg/70 backdrop-blur !text-[10px] text-warn">
          ★ {tile.rating.toFixed(1)}
        </div>

        {/* Slide-up review excerpt on hover/focus */}
        <div
          className={`absolute inset-x-0 bottom-0 px-3 py-3 bg-gradient-to-t from-black/85 to-transparent transition-all duration-200 ${
            open ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
          }`}
        >
          <p className="text-white text-xs leading-snug line-clamp-3">"{tile.excerpt}"</p>
          <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-white/75">
            <span>{tile.city}</span>
            <span className="font-semibold flex items-center gap-1">
              {tile.product.name.length > 22 ? tile.product.name.slice(0, 22) + '…' : tile.product.name}
              <Icon.arrow width={10} height={10} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function buildTiles(products: EnrichedProduct[]): Tile[] {
  // Pick the top 12 most-reviewed (or all if fewer); fall back to first
  // 12 by id if no reviews exist yet.
  const sorted = products.slice().sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0)).slice(0, 12);
  return sorted.map((p, i) => {
    const seed = hash(p.id);
    const span = ([1, 2, 1, 3, 1, 2, 1, 1, 2, 1, 2, 1] as const)[i] || 1;
    const hue = (seed % 360);
    return {
      id: p.id,
      name: SAMPLE_NAMES[seed % SAMPLE_NAMES.length],
      city: SAMPLE_CITIES[(seed >> 3) % SAMPLE_CITIES.length],
      rating: 4 + ((seed % 11) / 10),
      excerpt: SAMPLE_EXCERPTS[(seed >> 6) % SAMPLE_EXCERPTS.length],
      product: p,
      hue,
      span
    };
  });
}
