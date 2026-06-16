'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import { useCart } from './CartContext';
import { useFavorites } from './FavoritesContext';
import { useFlyToCart } from './FlyToCartContext';
import type { EnrichedProduct } from '@/lib/types';

interface Props {
  catalog: EnrichedProduct[];
}

/**
 * One-click "add all my favourites to cart" — quickest path back to a
 * filled basket for returning shoppers. Hides itself when there are no
 * favourites. Renders nothing on first paint (favourites hydrate after
 * mount) to avoid SSR flash.
 */
export function ReorderFavorites({ catalog }: Props) {
  const { ids } = useFavorites();
  const { add } = useCart();
  const { flyToCart } = useFlyToCart();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (ids.length === 0) return null;

  const favs = ids
    .map(id => catalog.find(p => p.id === id))
    .filter((p): p is EnrichedProduct => !!p && p.stock > 0)
    .slice(0, 4);

  const remaining = ids.length - favs.length;
  const handleAddAll = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (busy) return;
    setBusy(true);
    favs.forEach((p, i) => setTimeout(() => add(p.id, 1), i * 80));   // stagger
    flyToCart(e.currentTarget);
    setTimeout(() => { setBusy(false); setDone(true); }, favs.length * 80 + 200);
    setTimeout(() => setDone(false), 2500);
  };

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <Icon.heart width={16} height={16} className="text-danger" />
            Pick up where you left off
          </h3>
          <p className="text-xs text-muted">{favs.length} of {ids.length} favourites in stock right now</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/account/favorites" className="text-xs text-muted hover:text-ink">See all</Link>
          <button
            onClick={handleAddAll}
            disabled={busy || favs.length === 0}
            className={`btn !px-3 !py-2 text-xs ${done ? 'bg-success text-white' : 'btn-primary'} disabled:opacity-60`}
          >
            {done ? <><Icon.check width={12} height={12} /> Added!</> : <><Icon.cart width={12} height={12} /> Add all to cart</>}
          </button>
        </div>
      </div>

      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {favs.map(p => (
          <li key={p.id}>
            <Link href={`/product/${p.slug || p.id}`} className="block group">
              <ProductIllustration category={p.category} icon={p.icon} className="aspect-square rounded-xl" size={42} />
              <div className="mt-2 text-xs font-semibold line-clamp-1 group-hover:text-brand transition">{p.name}</div>
              <div className="text-xs text-muted">${p.price.toFixed(2)}</div>
            </Link>
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <p className="text-[11px] text-muted mt-3">+{remaining} more favourites · some out of stock right now</p>
      )}
    </div>
  );
}
