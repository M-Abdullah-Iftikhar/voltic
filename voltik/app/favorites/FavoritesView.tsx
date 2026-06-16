'use client';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState } from '@/components/EmptyState';
import { useFavorites } from '@/components/FavoritesContext';
import { useUser } from '@/components/UserContext';
import type { EnrichedProduct } from '@/lib/types';

export function FavoritesView({ products }: { products: EnrichedProduct[] }) {
  const { ids } = useFavorites();
  const { user } = useUser();
  const saved = products.filter(p => ids.includes(p.id));

  if (saved.length === 0) {
    return (
      <EmptyState
        kind="favorites"
        title="No favourites yet"
        body={
          <>
            Tap the heart on any product to save it here.
            {!user && <> Sign in to keep favorites across devices.</>}
          </>
        }
        primary={{ href: '/shop',  label: 'Browse the catalog' }}
        secondary={!user ? { href: '/login', label: 'Sign in' } : undefined}
      />
    );
  }

  return (
    <>
      <div className="text-sm text-muted mb-5">{saved.length} saved {saved.length === 1 ? 'product' : 'products'}</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {saved.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </>
  );
}
