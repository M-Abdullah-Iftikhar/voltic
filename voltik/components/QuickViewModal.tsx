'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import { useCart } from './CartContext';
import { useFlyToCart } from './FlyToCartContext';
import { useFavorites } from './FavoritesContext';
import type { EnrichedProduct } from '@/lib/types';

interface QuickViewModalProps {
  product: EnrichedProduct | null;
  onClose: () => void;
}

/** Lightweight modal — see the essentials and add to cart without
 *  leaving the shop grid. */
export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { add } = useCart();
  const { flyToCart } = useFlyToCart();
  const { has, toggle } = useFavorites();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const sourceRef = useRef<HTMLDivElement>(null);

  // Reset state whenever a new product is opened.
  useEffect(() => {
    setQty(1);
    setAdded(false);
  }, [product?.id]);

  // Esc + body scroll lock while open.
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [product, onClose]);

  if (!product) return null;

  const isFav = has(product.id);
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
  const inStock = product.stock > 0;

  const onAdd = () => {
    add(product.id, qty);
    flyToCart(sourceRef.current);
    setAdded(true);
    setTimeout(() => { setAdded(false); onClose(); }, 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-bg/70 backdrop-blur-md animate-slidein"
      role="dialog" aria-modal="true" aria-label={`Quick view of ${product.name}`}
      onClick={onClose}
    >
      <div
        className="card max-w-3xl w-full overflow-hidden grid sm:grid-cols-[1fr_1.05fr]"
        onClick={e => e.stopPropagation()}
      >
        {/* Illustration */}
        <div ref={sourceRef} className="relative">
          <ProductIllustration
            category={product.category}
            icon={product.icon}
            className="aspect-square sm:aspect-auto sm:h-full sm:rounded-none rounded-t-2xl sm:rounded-l-2xl"
            size={160}
          />
          {product.badge && (
            <span className="chip absolute top-3 left-3 bg-ink text-bg">{product.badge}</span>
          )}
          {discount > 0 && (
            <span className="chip absolute top-3 right-3 bg-danger text-white">−{discount}%</span>
          )}
        </div>

        {/* Info */}
        <div className="p-5 sm:p-6 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-muted">{product.brand} · <span className="font-mono">{product.sku}</span></div>
              <h3 className="font-display font-bold text-xl mt-1 line-clamp-2">{product.name}</h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close quick view"
              className="grid place-items-center h-9 w-9 rounded-full border border-line hover:bg-elev shrink-0"
            >
              <Icon.close width={16} height={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs">
            {product.reviewsCount > 0 ? (
              <>
                <Icon.star className="text-warn" width={12} height={12} />
                <span className="text-ink font-semibold">{product.rating.toFixed(1)}</span>
                <span className="text-muted">· {product.reviewsCount.toLocaleString()} reviews</span>
              </>
            ) : <span className="text-muted italic">No reviews yet</span>}
          </div>

          <p className="text-sm text-muted mt-3 line-clamp-3">{product.description}</p>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold gradient-text">${product.price.toFixed(2)}</span>
            {product.oldPrice && <span className="text-sm text-muted line-through">${product.oldPrice.toFixed(2)}</span>}
          </div>

          <div className="mt-2 text-xs flex items-center gap-2">
            <span className={`grid place-items-center h-2 w-2 rounded-full ${inStock ? 'bg-success' : 'bg-danger'}`} />
            <span className={inStock ? 'text-success' : 'text-danger'}>
              {inStock ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          {/* Highlights — first 3 features */}
          {product.features.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {product.features.slice(0, 3).map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-muted">
                  <Icon.check width={12} height={12} className="text-success mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Actions */}
          <div className="mt-auto pt-5 flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-full border border-line bg-surface overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-2.5 py-1.5 hover:bg-elev" aria-label="Decrease">
                <Icon.minus width={12} height={12} />
              </button>
              <span className="px-3 text-xs font-semibold min-w-[24px] text-center">{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))} className="px-2.5 py-1.5 hover:bg-elev" aria-label="Increase">
                <Icon.plus width={12} height={12} />
              </button>
            </div>
            <button
              onClick={onAdd}
              disabled={!inStock}
              className={`btn-primary flex-1 justify-center text-sm transition-all ${added ? '!bg-success' : ''} disabled:opacity-50`}
            >
              {added ? <><Icon.check width={14} height={14} /> Added</> : <><Icon.cart width={14} height={14} /> Add to cart</>}
            </button>
            <button
              onClick={() => toggle(product.id)}
              aria-pressed={isFav}
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
              className={`grid place-items-center h-10 w-10 rounded-full border border-line ${isFav ? 'text-danger' : 'text-muted hover:text-danger'}`}
            >
              {isFav
                ? <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor"><path d="M12 21s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z"/></svg>
                : <Icon.heart width={16} height={16} />}
            </button>
            <Link href={`/product/${product.slug || product.id}`} className="text-xs text-brand hover:underline w-full text-center mt-1">
              See full details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
