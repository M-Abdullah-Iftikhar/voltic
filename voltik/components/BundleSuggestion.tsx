'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import { useCart } from './CartContext';
import { useFlyToCart } from './FlyToCartContext';
import type { EnrichedProduct } from '@/lib/types';

interface BundleSuggestionProps {
  current: EnrichedProduct;
  companion: EnrichedProduct;
}

/** "Buy together and save" card. Two product thumbs joined by a +, a
 *  bundled price line with the % off, and a single add-to-cart that drops
 *  both lines + flies them to the cart. */
export function BundleSuggestion({ current, companion }: BundleSuggestionProps) {
  const { add } = useCart();
  const { flyToCart } = useFlyToCart();
  const [added, setAdded] = useState(false);

  const fullPrice = current.price + companion.price;
  const bundlePct = 10;                                       // demo: flat 10% off bundle
  const bundlePrice = fullPrice * (1 - bundlePct / 100);
  const savings = fullPrice - bundlePrice;

  const onAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    add(current.id, 1);
    add(companion.id, 1);
    flyToCart(e.currentTarget);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="card mt-6 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-brand">Bundle & save {bundlePct}%</div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <ProductIllustration category={current.category}   icon={current.icon}   className="h-16 w-16 rounded-xl shrink-0" size={28} />
        <Icon.plus width={14} height={14} className="text-muted shrink-0" />
        <Link href={`/product/${companion.slug || companion.id}`} className="flex items-center gap-3 flex-1 min-w-0 group">
          <ProductIllustration category={companion.category} icon={companion.icon} className="h-16 w-16 rounded-xl shrink-0" size={28} />
          <div className="min-w-0">
            <div className="text-[11px] text-muted">Often bought with</div>
            <div className="text-sm font-semibold line-clamp-1 group-hover:text-brand transition">{companion.name}</div>
            <div className="text-xs text-muted">${companion.price.toFixed(2)}</div>
          </div>
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs text-muted">Bundle price</div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold gradient-text">${bundlePrice.toFixed(2)}</span>
            <span className="text-xs text-muted line-through">${fullPrice.toFixed(2)}</span>
            <span className="chip bg-success/15 text-success">Save ${savings.toFixed(2)}</span>
          </div>
        </div>
        <button
          onClick={onAdd}
          className={`btn !px-4 !py-2 text-xs transition-all ${added ? 'bg-success text-white' : 'btn-dark'}`}
        >
          {added
            ? <><Icon.check width={14} height={14} /> Added both</>
            : <><Icon.cart width={14} height={14} /> Add bundle</>}
        </button>
      </div>
    </div>
  );
}
