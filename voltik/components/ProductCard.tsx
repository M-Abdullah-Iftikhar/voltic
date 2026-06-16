'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import { useCart } from './CartContext';
import { useFavorites } from './FavoritesContext';
import { useFlyToCart } from './FlyToCartContext';
import { QuickViewModal } from './QuickViewModal';
import { categoryAccent } from '@/lib/categoryAccent';
import type { EnrichedProduct } from '@/lib/types';

const BADGE_COLORS: Record<string, string> = {
  'Bestseller': 'bg-warn/20 text-warn',
  'New':        'bg-success/20 text-success',
  'Hot Deal':   'bg-danger/20 text-danger'
};

export function ProductCard({ product }: { product: EnrichedProduct }) {
  const { add } = useCart();
  const { has, toggle } = useFavorites();
  const { flyToCart } = useFlyToCart();
  const [added, setAdded] = useState(false);
  const [favBursting, setFavBursting] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const isFav = has(product.id);

  const onAdd = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add(product.id, 1);
    flyToCart(imageRef.current);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }, [add, flyToCart, product.id]);

  const onFav = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
    // Burst when *adding* a favorite — pop-out particles for one second.
    if (!isFav) {
      setFavBursting(true);
      setTimeout(() => setFavBursting(false), 700);
    }
  }, [toggle, product.id, isFav]);

  const onQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickOpen(true);
  }, []);

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  // Stock bar — visual urgency. Capped at 50 for the visual scale.
  const stockPct = Math.min(100, Math.round((product.stock / 50) * 100));
  const lowStock = product.stock > 0 && product.stock < 30;
  const outOfStock = product.stock <= 0;

  return (
    <>
      <Link href={`/product/${product.slug || product.id}`} className="group card card-hover p-3 sm:p-4 flex flex-col relative overflow-hidden">
        {/* Category-derived accent — thin top strip that lights up on hover */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px] opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ background: categoryAccent(product.category) }}
        />
        <div className="relative" ref={imageRef}>
          <ProductIllustration category={product.category} icon={product.icon} className="aspect-square" size={88} />
          {product.badge && (
            <span className={`chip absolute top-3 left-3 ${BADGE_COLORS[product.badge] || 'bg-elev text-ink'}`}>
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="chip absolute top-3 right-3 bg-ink text-bg">-{discount}%</span>
          )}

          {/* Quick-view button — appears on hover */}
          <button
            onClick={onQuickView}
            aria-label="Quick view"
            className="absolute bottom-3 left-3 grid place-items-center h-9 w-9 rounded-full glass text-ink opacity-0 group-hover:opacity-100 transition hover:scale-105"
          >
            <Icon.search width={15} height={15} />
          </button>

          {/* Favorite with burst */}
          <button
            onClick={onFav}
            aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
            aria-pressed={isFav}
            className={`absolute bottom-3 right-3 grid place-items-center h-9 w-9 rounded-full glass transition ${isFav ? 'text-danger' : 'text-muted hover:text-danger'}`}
          >
            {isFav ? <FilledHeart /> : <Icon.heart width={16} height={16} />}
            {favBursting && <HeartBurst />}
          </button>
        </div>

        <div className="mt-4 flex-1 flex flex-col">
          {/* Rating row + mini-distribution */}
          <div className="flex items-center gap-2 text-xs text-muted mb-1.5">
            {product.reviewsCount > 0 ? (
              <>
                <Icon.star className="text-warn" width={12} height={12} />
                <span className="text-ink font-semibold">{product.rating.toFixed(1)}</span>
                <span>· {product.reviewsCount.toLocaleString()}</span>
                <span className="ml-auto"><RatingMini rating={product.rating} /></span>
              </>
            ) : (
              <span className="italic">No reviews yet</span>
            )}
          </div>
          <h3 className="font-semibold text-ink leading-snug line-clamp-2">{product.name}</h3>
          <p className="text-xs text-muted mt-1 line-clamp-1">{product.brand} · {product.sku}</p>

          {/* Stock indicator */}
          <div className="mt-2.5">
            {outOfStock ? (
              <div className="text-[11px] font-semibold text-danger">Out of stock</div>
            ) : lowStock ? (
              <>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-warn font-semibold">Only {product.stock} left</span>
                  <span className="text-muted">🔥</span>
                </div>
                <div className="h-1 rounded-full bg-elev overflow-hidden">
                  <div className="h-full bg-warn rounded-full" style={{ width: `${stockPct}%` }} />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                <span className="grid place-items-center h-1.5 w-1.5 rounded-full bg-success" />
                In stock
              </div>
            )}
          </div>

          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <div className="text-lg font-bold gradient-text">${product.price.toFixed(2)}</div>
              {product.oldPrice && (
                <div className="text-xs text-muted">
                  <span className="voltik-strike inline-block">${product.oldPrice.toFixed(2)}</span>
                </div>
              )}
            </div>
            <button
              onClick={onAdd}
              disabled={outOfStock}
              className={`btn !px-3 !py-2 text-xs transition-all ${added ? 'bg-success text-white' : 'btn-dark'} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {added ? <><Icon.check width={14} height={14} /> Added</> : <><Icon.plus width={14} height={14} /> Add</>}
            </button>
          </div>
        </div>
      </Link>

      <QuickViewModal product={quickOpen ? product : null} onClose={() => setQuickOpen(false)} />
    </>
  );
}

/* ─── small visual helpers ──────────────────────────────────────── */

function FilledHeart() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
      <path d="M12 21s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z"/>
    </svg>
  );
}

/** 5-bar mini histogram approximating rating distribution from the average. */
function RatingMini({ rating }: { rating: number }) {
  // Synthesise a distribution that averages near `rating`. Visual only.
  const bars = [1, 2, 3, 4, 5].map(stars => {
    const distance = Math.abs(stars - rating);
    const height = Math.max(0.15, 1 - distance * 0.45);
    return { stars, height };
  });
  return (
    <span className="inline-flex items-end gap-0.5 h-3" aria-hidden>
      {bars.map(b => (
        <span
          key={b.stars}
          className={`w-1 rounded-sm ${b.stars <= Math.round(rating) ? 'bg-warn' : 'bg-line'}`}
          style={{ height: `${b.height * 100}%` }}
        />
      ))}
    </span>
  );
}

/** Particle burst when a favourite is added. Pure CSS. */
function HeartBurst() {
  const particles = Array.from({ length: 6 }).map((_, i) => {
    const angle = (i / 6) * Math.PI * 2;
    const distance = 18 + Math.random() * 6;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      delay: i * 0.02
    };
  });
  return (
    <span aria-hidden className="absolute inset-0 pointer-events-none">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-danger"
          style={{
            transform: `translate(-50%, -50%)`,
            animation: `heartParticle 0.7s ease-out ${p.delay}s forwards`,
            // Use CSS custom properties to drive the destination in keyframes.
            ['--x' as any]: `${p.x}px`,
            ['--y' as any]: `${p.y}px`
          }}
        />
      ))}
      <style jsx>{`
        @keyframes heartParticle {
          0%   { transform: translate(-50%, -50%) scale(0.6); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(0.1); opacity: 0; }
        }
      `}</style>
    </span>
  );
}
