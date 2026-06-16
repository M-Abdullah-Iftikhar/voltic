'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon, type IconKey } from './Icons';
import type { EnrichedProduct } from '@/lib/types';

interface ShelfProduct {
  product: EnrichedProduct;
  /** 0-1 horizontal position on the shelf. */
  x: number;
  /** Scale modifier so foreground items pop and background items recede. */
  scale: number;
}

interface Shelf {
  /** Display label for the shelf strip. */
  label: string;
  /** Brand colour key for the lamp glow. */
  hue: number;
  /** Products lined up on the shelf. */
  items: ShelfProduct[];
}

/**
 * "Virtual showroom" — a scrollable 3D-ish room with five floating
 * shelves of products. We don't load a real 3D engine; everything is
 * stacked CSS perspective + transform-translateZ, which keeps the
 * landing surface fast and the experience honest about what it is: a
 * stylised browsing layout, not a Unity scene.
 *
 * Hover (or focus) any product to spotlight it; click jumps straight to
 * the detail page. A drag on the room canvas tilts the perspective so
 * users can "look around" without needing a real WebGL camera.
 */
export function VirtualShowroom({ products }: { products: EnrichedProduct[] }) {
  const shelves = useMemo<Shelf[]>(() => buildShelves(products), [products]);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [focused, setFocused] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);
  const dragRef = useRef<{ x: number; y: number; sx: number; sy: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, sx: tilt.x, sy: tilt.y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setTilt({
      // Clamp so we don't tip the room over.
      x: clamp(dragRef.current.sx + dy * -0.05, -12, 12),
      y: clamp(dragRef.current.sy + dx *  0.08, -25, 25)
    });
  };
  const onPointerUp = () => { dragRef.current = null; };

  if (shelves.length === 0) return null;

  return (
    <section className="relative overflow-hidden">
      <header className="container-x pt-12 text-center">
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand">Virtual showroom</span>
        <h1 className="font-display font-bold text-4xl sm:text-5xl mt-2 leading-tight">
          Take a wander.
        </h1>
        <p className="text-muted text-sm mt-2 max-w-md mx-auto">
          A whole room of Voltik, laid out like a showroom. Drag to look around, hover any product to spotlight it, click to pick it up.
        </p>
      </header>

      <div
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative mt-8 h-[700px] sm:h-[760px] overflow-hidden bg-gradient-to-b from-elev via-bg to-bg ${reduced ? '' : 'cursor-grab active:cursor-grabbing'} touch-none`}
        style={{ perspective: '1400px' }}
      >
        {/* Floor — receding parallelogram with a subtle tile pattern. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[55%] origin-top"
          style={{
            transform: `rotateX(70deg) translateZ(-100px) rotateZ(${tilt.y * 0.4}deg)`,
            background:
              'linear-gradient(to bottom, transparent, rgb(var(--bg))), ' +
              'repeating-linear-gradient(0deg, transparent 0 79px, rgb(var(--line) / .35) 79px 80px), ' +
              'repeating-linear-gradient(90deg, transparent 0 79px, rgb(var(--line) / .35) 79px 80px)',
            transformStyle: 'preserve-3d'
          }}
        />
        {/* Back wall — soft brand wash. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[55%]"
          style={{
            background:
              'radial-gradient(60% 80% at 50% 0%, rgb(var(--brand) / 0.15), transparent 70%),' +
              'radial-gradient(50% 70% at 20% 30%, rgb(var(--accent2) / 0.12), transparent 70%),' +
              'radial-gradient(60% 70% at 80% 30%, rgb(var(--brand2) / 0.13), transparent 70%)'
          }}
        />

        {/* Shelves stage — a perspective layer with each shelf placed
            at a different translateZ so the room reads as deep. */}
        <div
          className="absolute inset-0 flex flex-col justify-end gap-7 pb-12"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: dragRef.current || reduced ? 'none' : 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {shelves.map((shelf, i) => {
            // Deeper shelves are further back along Z and a touch smaller.
            const depth = (shelves.length - 1 - i) * 80;
            return (
              <ShelfStrip
                key={shelf.label}
                shelf={shelf}
                depth={depth}
                index={i}
                focused={focused}
                onFocus={setFocused}
              />
            );
          })}
        </div>

        {/* Spotlight overlay when a product is focused */}
        {focused && (
          <div
            aria-hidden
            className="absolute inset-0 bg-black/30 pointer-events-none transition-opacity"
            style={{ animation: 'fadeIn 180ms ease-out' }}
          />
        )}

        {/* Instructions / reset chip */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <span className="chip bg-bg/80 backdrop-blur text-muted !text-[10px]">
            <Icon.arrow width={9} height={9} className="rotate-180" /> Drag to look around <Icon.arrow width={9} height={9} />
          </span>
          {(tilt.x !== 0 || tilt.y !== 0) && (
            <button
              onClick={() => setTilt({ x: 0, y: 0 })}
              className="chip bg-bg/80 backdrop-blur text-brand hover:text-ink !text-[10px]"
            >
              Reset view
            </button>
          )}
        </div>
      </div>

      <div className="container-x py-10 text-center">
        <Link href="/shop" className="btn-ghost text-sm">
          Or browse the catalog flat <Icon.arrow width={12} height={12} />
        </Link>
      </div>
    </section>
  );
}

function ShelfStrip({
  shelf, depth, index, focused, onFocus
}: {
  shelf: Shelf;
  depth: number;
  index: number;
  focused: string | null;
  onFocus: (id: string | null) => void;
}) {
  return (
    <div
      className="relative h-32 sm:h-36"
      style={{ transform: `translateZ(-${depth}px)`, transformStyle: 'preserve-3d' }}
    >
      {/* Shelf plank — a thin, slightly inset slab so products feel grounded. */}
      <div
        aria-hidden
        className="absolute inset-x-6 sm:inset-x-12 bottom-0 h-2 rounded-sm shadow-lg"
        style={{ background: 'linear-gradient(180deg, rgb(var(--surface)) 0%, rgb(var(--elev)) 100%)' }}
      />
      {/* Soft lamp glow above the plank, hued per shelf. */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 -top-4 w-3/4 h-12 rounded-full blur-2xl"
        style={{ background: `radial-gradient(ellipse, hsl(${shelf.hue} 90% 60% / .35), transparent 70%)` }}
      />
      <div className="absolute left-3 top-0 text-[9px] uppercase tracking-[0.18em] font-semibold text-muted/80">
        {String(index + 1).padStart(2, '0')} · {shelf.label}
      </div>

      {/* Products lined up on the plank */}
      <div className="absolute inset-x-0 bottom-2 h-full">
        {shelf.items.map(item => {
          const isFocused = focused === item.product.id;
          const isDimmed = focused && !isFocused;
          const Glyph = (Icon as Record<string, React.FC<{ width?: number; height?: number; className?: string }>>)[item.product.icon as IconKey] || Icon.box;
          const size = Math.round(46 * item.scale);
          return (
            <Link
              key={item.product.id}
              href={`/product/${item.product.slug || item.product.id}`}
              onMouseEnter={() => onFocus(item.product.id)}
              onMouseLeave={() => onFocus(null)}
              onFocus={() => onFocus(item.product.id)}
              onBlur={() => onFocus(null)}
              aria-label={item.product.name}
              className="absolute bottom-2 group"
              style={{
                left: `${item.x * 100}%`,
                transform: `translateX(-50%) translateZ(${item.scale * 6}px)`,
                transition: 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease-out',
                opacity: isDimmed ? 0.35 : 1,
                zIndex: isFocused ? 20 : 1
              }}
            >
              <div
                className={`relative grid place-items-center rounded-xl border ${isFocused ? 'border-brand shadow-glow' : 'border-line/60 bg-surface/80'} backdrop-blur transition-all`}
                style={{ width: size + 18, height: size + 18, transform: isFocused ? 'translateY(-10px) scale(1.15)' : 'translateY(0) scale(1)' }}
              >
                <Glyph width={size} height={size} />
                {item.product.badge && (
                  <span className="absolute -top-2 -right-2 chip bg-accent2 text-bg !text-[9px] !px-1.5">{item.product.badge}</span>
                )}
              </div>
              {/* Reflection — a flipped, faded copy to sell the shelf */}
              <div
                aria-hidden
                className="mt-px h-3 rounded-b-xl opacity-30"
                style={{
                  width: size + 18,
                  background: 'linear-gradient(180deg, rgb(var(--brand) / .25), transparent)',
                  transform: 'scaleY(-1)'
                }}
              />
              {/* Floating label on hover */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 -top-8 whitespace-nowrap text-[10px] font-semibold text-ink bg-surface px-2 py-0.5 rounded-md border border-line shadow-soft transition ${isFocused ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'}`}
              >
                {item.product.name} · ${item.product.price.toFixed(2)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

function buildShelves(products: EnrichedProduct[]): Shelf[] {
  // Group by category and keep the top 5 shelves with 4-6 products each.
  const byCat = new Map<string, EnrichedProduct[]>();
  for (const p of products) {
    const arr = byCat.get(p.category) || [];
    arr.push(p);
    byCat.set(p.category, arr);
  }
  // Sort categories by inventory richness so the most stocked shelves
  // land at the front of the room.
  const entries = Array.from(byCat.entries())
    .filter(([, arr]) => arr.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5);

  const hues = [200, 270, 28, 150, 320];
  return entries.map(([cat, arr], i) => {
    const items = arr.slice(0, 6).map((product, j, all) => {
      const ratio = all.length === 1 ? 0.5 : j / (all.length - 1);
      // Lay out across 12% → 88% horizontal so the strip has breathing room.
      const x = 0.12 + ratio * 0.76;
      // Items at the edges read smaller, centre items larger — gives a
      // shallow camera-focus feel without a real depth pass.
      const distFromCenter = Math.abs(0.5 - ratio);
      const scale = 1.05 - distFromCenter * 0.4;
      return { product, x, scale };
    });
    return {
      label: prettify(cat),
      hue: hues[i % hues.length],
      items
    };
  });
}

function prettify(slug: string): string {
  return slug.split(/[-_/]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}
