'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import { useCart } from './CartContext';
import { useFavorites } from './FavoritesContext';
import type { EnrichedProduct } from '@/lib/types';

const BADGE_COLORS: Record<string, string> = {
  'Bestseller': 'bg-warn/20 text-warn',
  'New':        'bg-success/20 text-success',
  'Hot Deal':   'bg-danger/20 text-danger'
};

export function ProductCard({ product }: { product: EnrichedProduct }) {
  const { add } = useCart();
  const { has, toggle } = useFavorites();
  const [added, setAdded] = useState(false);
  const isFav = has(product.id);

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add(product.id, 1);
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

  return (
    <Link href={`/product/${product.id}`} className="group card card-hover p-3 sm:p-4 flex flex-col">
      <div className="relative">
        <ProductIllustration category={product.category} icon={product.icon} className="aspect-square" size={88} />
        {product.badge && (
          <span className={`chip absolute top-3 left-3 ${BADGE_COLORS[product.badge] || 'bg-elev text-ink'}`}>
            {product.badge}
          </span>
        )}
        {discount > 0 && (
          <span className="chip absolute top-3 right-3 bg-ink text-bg">-{discount}%</span>
        )}
        <button
          onClick={onFav}
          aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
          aria-pressed={isFav}
          className={`absolute bottom-3 right-3 grid place-items-center h-9 w-9 rounded-full glass transition ${isFav ? 'text-danger' : 'text-muted hover:text-danger'}`}
        >
          {isFav ? <FilledHeart /> : <Icon.heart width={16} height={16} />}
        </button>
      </div>

      <div className="mt-4 flex-1 flex flex-col">
        <div className="flex items-center gap-1 text-xs text-muted mb-1.5">
          {product.reviewsCount > 0 ? (
            <>
              <Icon.star className="text-warn" width={12} height={12} />
              <span className="text-ink font-semibold">{product.rating.toFixed(1)}</span>
              <span>· {product.reviewsCount.toLocaleString()} {product.reviewsCount === 1 ? 'review' : 'reviews'}</span>
            </>
          ) : (
            <span className="italic">No reviews yet</span>
          )}
        </div>
        <h3 className="font-semibold text-ink leading-snug line-clamp-2">{product.name}</h3>
        <p className="text-xs text-muted mt-1 line-clamp-1">{product.brand} · {product.sku}</p>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <div className="text-lg font-bold gradient-text">${product.price.toFixed(2)}</div>
            {product.oldPrice && <div className="text-xs text-muted line-through">${product.oldPrice.toFixed(2)}</div>}
          </div>
          <button
            onClick={onAdd}
            className={`btn !px-3 !py-2 text-xs transition-all ${added ? 'bg-success text-white' : 'btn-dark'}`}
          >
            {added ? <><Icon.check width={14} height={14} /> Added</> : <><Icon.plus width={14} height={14} /> Add</>}
          </button>
        </div>
      </div>
    </Link>
  );
}

function FilledHeart() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
      <path d="M12 21s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z"/>
    </svg>
  );
}
