'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import { useCart } from './CartContext';
import { useFavorites } from './FavoritesContext';
import { useFlyToCart } from './FlyToCartContext';
import type { EnrichedProduct } from '@/lib/types';

/** Horizontal list-view variant of ProductCard — same data, denser layout. */
export function ProductListRow({ product }: { product: EnrichedProduct }) {
  const { add } = useCart();
  const { has, toggle } = useFavorites();
  const { flyToCart } = useFlyToCart();
  const imageRef = useRef<HTMLDivElement>(null);
  const [added, setAdded] = useState(false);
  const isFav = has(product.id);

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add(product.id, 1);
    flyToCart(imageRef.current);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  const onFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
  };

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock < 30;

  return (
    <Link href={`/product/${product.slug || product.id}`} className="card card-hover p-3 sm:p-4 flex gap-4 items-center group">
      <div ref={imageRef} className="shrink-0">
        <ProductIllustration category={product.category} icon={product.icon} className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl" size={48} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {product.badge && <span className="chip bg-brand/10 text-brand">{product.badge}</span>}
          <span className="text-xs text-muted">{product.brand} · {product.sku}</span>
          {product.reviewsCount > 0 && (
            <span className="text-xs text-muted ml-auto flex items-center gap-1">
              <Icon.star className="text-warn" width={11} height={11} />
              <span className="text-ink font-semibold">{product.rating.toFixed(1)}</span>
              <span>({product.reviewsCount.toLocaleString()})</span>
            </span>
          )}
        </div>
        <h3 className="font-semibold mt-1.5 line-clamp-1 group-hover:text-brand transition">{product.name}</h3>
        <p className="text-xs text-muted mt-1 line-clamp-2 max-w-xl">{product.description}</p>

        <div className="mt-2 flex items-center gap-3 text-[11px]">
          {outOfStock ? (
            <span className="text-danger font-semibold">Out of stock</span>
          ) : lowStock ? (
            <span className="text-warn font-semibold">Only {product.stock} left 🔥</span>
          ) : (
            <span className="text-muted flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> In stock
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-2">
        <div className="text-right">
          <div className="text-lg font-bold gradient-text">${product.price.toFixed(2)}</div>
          {product.oldPrice && (
            <div className="text-xs text-muted flex items-center gap-2 justify-end">
              <span className="line-through">${product.oldPrice.toFixed(2)}</span>
              <span className="chip bg-danger/10 text-danger">-{discount}%</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onFav}
            aria-pressed={isFav}
            aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
            className={`grid place-items-center h-9 w-9 rounded-full border border-line transition ${isFav ? 'text-danger' : 'text-muted hover:text-danger'}`}
          >
            {isFav
              ? <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor"><path d="M12 21s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z"/></svg>
              : <Icon.heart width={14} height={14} />}
          </button>
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
  );
}
