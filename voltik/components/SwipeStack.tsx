'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import { useCart } from './CartContext';
import { useFavorites } from './FavoritesContext';
import { haptic } from '@/lib/haptics';
import type { EnrichedProduct } from '@/lib/types';

interface Props {
  /** Pool of products to discover through. We shuffle once on mount. */
  products: EnrichedProduct[];
  /** Cap so the stack stays focused. Defaults to 18. */
  limit?: number;
}

type Direction = 'left' | 'right' | 'up' | null;

/**
 * Tinder-style product discovery deck. Up to 3 cards stacked at any
 * moment; the top card responds to drag (mouse + touch). Past a
 * threshold on release we commit: left=skip, right=favourite,
 * up=add-to-cart. Past the bottom of the deck we render a friendly
 * "you're all caught up" panel.
 *
 * Cards beneath the top one are scaled + offset so the stack reads as
 * depth. Reduced-motion users get a flat list of buttons instead of the
 * swipe gestures.
 */
export function SwipeStack({ products, limit = 18 }: Props) {
  const [topIdx, setTopIdx] = useState(0);
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const [exiting, setExiting] = useState<{ dir: Direction; id: string } | null>(null);
  const [reduced, setReduced] = useState(false);
  const { add } = useCart();
  const { toggle, has } = useFavorites();
  const startRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);

  // Stable per-mount shuffle so reloads feel fresh but rerenders don't reorder.
  const deck = useMemo(() => shuffle(products).slice(0, limit), [products, limit]);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const commit = (dir: Direction) => {
    const card = deck[topIdx];
    if (!card) return;
    setExiting({ dir, id: card.id });
    haptic(dir === 'left' ? 'tap' : 'success');
    if (dir === 'right') toggle(card.id);
    if (dir === 'up')    add(card.id, 1);
    // Wait for the exit animation to play before swapping in the next card.
    setTimeout(() => {
      setExiting(null);
      setDrag(null);
      setTopIdx(i => i + 1);
    }, 280);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (exiting) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    setDrag({ dx: 0, dy: 0 });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = startRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    setDrag({ dx: e.clientX - s.x, dy: e.clientY - s.y });
  };
  const onPointerUp = () => {
    const d = drag;
    startRef.current = null;
    if (!d) return;
    const { dx, dy } = d;
    // Commit thresholds — horizontal beats vertical unless the upward
    // motion is huge (intent is clearly "add to cart").
    if (dy < -160 && Math.abs(dy) > Math.abs(dx)) commit('up');
    else if (dx >  120) commit('right');
    else if (dx < -120) commit('left');
    else setDrag(null);
  };

  if (deck.length === 0) return null;

  if (topIdx >= deck.length) {
    return (
      <div className="card p-8 text-center">
        <Icon.spark className="mx-auto text-brand" width={28} height={28} />
        <h3 className="font-display font-bold text-xl mt-3">All caught up.</h3>
        <p className="text-sm text-muted mt-2">You've seen everything in the deck. Refresh for a new shuffle.</p>
        <button
          onClick={() => setTopIdx(0)}
          className="btn-primary mt-5 text-sm inline-flex"
        >
          Reshuffle <Icon.refresh width={12} height={12} />
        </button>
      </div>
    );
  }

  // Reduced-motion fallback: flat list with the same three actions.
  if (reduced) {
    return (
      <div className="space-y-3">
        {deck.slice(topIdx, topIdx + 5).map((p) => (
          <FlatCard key={p.id} product={p} onSkip={() => setTopIdx(i => i + 1)} />
        ))}
      </div>
    );
  }

  // Render up to 3 cards deep so the stack hints at "more coming".
  const visible = deck.slice(topIdx, topIdx + 3);

  return (
    <div className="relative">
      <div className="relative h-[460px] sm:h-[520px]" aria-roledescription="card stack" aria-label="Product discovery deck">
        {visible.map((p, i) => {
          const isTop = i === 0;
          const isExitingThis = exiting?.id === p.id;
          const rot = isTop && drag ? drag.dx * 0.06 : 0;
          const tx  = isTop && drag ? drag.dx : 0;
          const ty  = isTop && drag ? drag.dy : 0;
          // Cards beneath the top peek out via Y offset + scale-down.
          const stackOffsetY = i * 12;
          const stackScale   = 1 - i * 0.04;

          const exitTransform =
            isExitingThis
              ? exiting!.dir === 'right' ? 'translate( 130vw,  60px) rotate(22deg)'
              : exiting!.dir === 'left'  ? 'translate(-130vw,  60px) rotate(-22deg)'
              : exiting!.dir === 'up'    ? 'translate(0, -120vh) rotate(0)'
              : ''
              : '';

          const direction: Direction =
            tx >  80 ? 'right' :
            tx < -80 ? 'left'  :
            ty < -100 ? 'up'   :
            null;

          return (
            <div
              key={p.id}
              onPointerDown={isTop ? onPointerDown : undefined}
              onPointerMove={isTop ? onPointerMove : undefined}
              onPointerUp={isTop ? onPointerUp : undefined}
              onPointerCancel={isTop ? onPointerUp : undefined}
              className={`absolute inset-0 card overflow-hidden ${isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
              style={{
                transform: isExitingThis
                  ? exitTransform
                  : `translate(${tx}px, ${ty + stackOffsetY}px) rotate(${rot}deg) scale(${stackScale})`,
                transition: isExitingThis
                  ? 'transform 280ms ease-in'
                  : drag && isTop
                    ? 'none'
                    : 'transform 240ms cubic-bezier(.22,1.36,.36,1)',
                zIndex: 10 - i,
                touchAction: isTop ? 'none' : 'auto'
              }}
            >
              <CardBody product={p} direction={isTop ? direction : null} />
            </div>
          );
        })}
      </div>

      {/* Action buttons — accessible alternative to the gesture */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <ActionButton
          label="Skip"
          aria="Skip product"
          glyph={<Icon.close width={18} height={18} />}
          tone="muted"
          onClick={() => commit('left')}
        />
        <ActionButton
          label="Add"
          aria="Add to cart"
          glyph={<Icon.cart width={18} height={18} />}
          tone="brand"
          onClick={() => commit('up')}
          big
        />
        <ActionButton
          label={has(deck[topIdx].id) ? 'Saved' : 'Favourite'}
          aria="Favourite product"
          glyph={<Icon.heart width={18} height={18} />}
          tone="danger"
          onClick={() => commit('right')}
        />
      </div>

      <p className="text-[11px] text-muted text-center mt-3 italic">
        Drag → favourite · ← skip · ↑ add to cart
      </p>
    </div>
  );
}

function CardBody({ product, direction }: { product: EnrichedProduct; direction: Direction }) {
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;
  return (
    <div className="relative h-full w-full flex flex-col select-none">
      {/* Verdict ribbon — appears on top of the card as the user drags */}
      {direction && (
        <span
          className={`absolute top-6 z-10 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
            direction === 'right' ? 'right-6 text-danger border-2 border-danger bg-danger/10' :
            direction === 'left'  ? 'left-6 text-muted border-2 border-muted bg-elev rotate-[-8deg]' :
                                    'left-1/2 -translate-x-1/2 text-brand border-2 border-brand bg-brand/10 -rotate-2'
          }`}
        >
          {direction === 'right' ? 'Favourite' : direction === 'left' ? 'Skip' : 'Add to cart'}
        </span>
      )}

      <ProductIllustration
        category={product.category}
        icon={product.icon}
        className="aspect-square"
        size={120}
      />
      <div className="p-5 flex-1 flex flex-col">
        <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">
          {product.brand} · {product.sku}
        </div>
        <h3 className="font-display font-bold text-xl mt-1 leading-snug line-clamp-2">{product.name}</h3>
        <p className="text-sm text-muted mt-2 line-clamp-3">{product.description}</p>

        <div className="mt-auto pt-4 flex items-baseline justify-between gap-3">
          <div>
            <span className="text-2xl font-bold gradient-text">${product.price.toFixed(2)}</span>
            {product.oldPrice && (
              <span className="text-xs text-muted line-through ml-2">${product.oldPrice.toFixed(2)}</span>
            )}
          </div>
          {discount > 0 && <span className="chip bg-danger text-white">−{discount}%</span>}
        </div>

        <Link
          href={`/product/${product.slug || product.id}`}
          onClick={e => e.stopPropagation()}
          className="text-xs text-brand hover:underline mt-3 inline-flex items-center gap-1"
        >
          Full details <Icon.arrow width={11} height={11} />
        </Link>
      </div>
    </div>
  );
}

function ActionButton({
  label, aria, glyph, tone, onClick, big
}: {
  label: string; aria: string; glyph: React.ReactNode;
  tone: 'brand' | 'danger' | 'muted';
  onClick: () => void;
  big?: boolean;
}) {
  const cls =
    tone === 'brand'  ? 'bg-brand text-white shadow-glow'
  : tone === 'danger' ? 'bg-surface text-danger border border-danger/30'
  :                     'bg-surface text-muted border border-line';
  return (
    <button
      onClick={onClick}
      aria-label={aria}
      className={`grid place-items-center rounded-full transition-transform hover:-translate-y-0.5 ${cls} ${big ? 'h-14 w-14' : 'h-11 w-11'}`}
    >
      {glyph}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function FlatCard({ product, onSkip }: { product: EnrichedProduct; onSkip: () => void }) {
  const { add } = useCart();
  const { toggle, has } = useFavorites();
  const isFav = has(product.id);
  return (
    <div className="card p-4 flex gap-4 items-center">
      <ProductIllustration category={product.category} icon={product.icon} className="h-16 w-16 rounded-2xl shrink-0" size={32} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold line-clamp-1">{product.name}</div>
        <div className="text-xs text-muted line-clamp-1">{product.brand}</div>
        <div className="mt-1 text-sm font-bold gradient-text">${product.price.toFixed(2)}</div>
      </div>
      <div className="flex flex-col gap-1.5">
        <button onClick={() => { add(product.id, 1); onSkip(); }} className="btn-primary text-xs">
          Add
        </button>
        <button onClick={() => { toggle(product.id); onSkip(); }} className="btn-ghost text-xs">
          {isFav ? 'Unsave' : 'Save'}
        </button>
        <button onClick={onSkip} className="text-xs text-muted hover:text-ink">
          Skip
        </button>
      </div>
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
