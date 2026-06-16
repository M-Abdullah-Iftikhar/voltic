'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import { useCart } from './CartContext';
import { useFlyToCart } from './FlyToCartContext';
import type { EnrichedProduct } from '@/lib/types';

interface Props {
  /** Candidate products. Anything in `excludeIds` gets filtered. */
  catalog: EnrichedProduct[];
  excludeIds?: string[];
  title?: string;
  max?: number;
}

/** Compact "complete your set" carousel — used under the cart summary
 *  and anywhere we want a quick add-on prompt. */
export function YouMightLike({
  catalog, excludeIds = [], title = 'You might also like', max = 6
}: Props) {
  const excluded = new Set(excludeIds);
  const picks = catalog
    .filter(p => !excluded.has(p.id) && p.stock > 0)
    // Prefer high-rating + cheap = good upsell candidates
    .sort((a, b) => (b.rating - a.rating) || (a.price - b.price))
    .slice(0, max);

  if (picks.length === 0) return null;

  return (
    <section className="mt-6">
      <h3 className="font-display font-bold text-base mb-3">{title}</h3>
      <ul className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        {picks.map(p => <YouMightLikeItem key={p.id} product={p} />)}
      </ul>
    </section>
  );
}

function YouMightLikeItem({ product }: { product: EnrichedProduct }) {
  const { add } = useCart();
  const { flyToCart } = useFlyToCart();
  const imageRef = useRef<HTMLDivElement>(null);
  const [added, setAdded] = useState(false);

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add(product.id, 1);
    flyToCart(imageRef.current);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <li className="shrink-0 w-44">
      <Link href={`/product/${product.slug || product.id}`} className="card card-hover p-3 block">
        <div ref={imageRef}>
          <ProductIllustration category={product.category} icon={product.icon} className="aspect-square" size={52} />
        </div>
        <div className="mt-2.5">
          <div className="text-xs font-semibold text-ink line-clamp-1">{product.name}</div>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            <div className="text-sm font-bold gradient-text">${product.price.toFixed(2)}</div>
            <button
              onClick={onAdd}
              className={`grid place-items-center h-7 w-7 rounded-full transition ${added ? 'bg-success text-white' : 'bg-ink text-bg hover:opacity-90'}`}
              aria-label={`Add ${product.name} to cart`}
            >
              {added ? <Icon.check width={12} height={12} /> : <Icon.plus width={12} height={12} />}
            </button>
          </div>
        </div>
      </Link>
    </li>
  );
}
