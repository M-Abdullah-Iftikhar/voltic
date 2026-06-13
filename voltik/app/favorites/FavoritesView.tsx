'use client';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { Icon } from '@/components/Icons';
import { useFavorites } from '@/components/FavoritesContext';
import { useUser } from '@/components/UserContext';
import type { EnrichedProduct } from '@/lib/types';

export function FavoritesView({ products }: { products: EnrichedProduct[] }) {
  const { ids } = useFavorites();
  const { user } = useUser();
  const saved = products.filter(p => ids.includes(p.id));

  if (saved.length === 0) {
    return (
      <div className="card p-14 text-center">
        <div className="grid place-items-center h-20 w-20 mx-auto rounded-full bg-elev text-muted">
          <Icon.heart width={32} height={32} />
        </div>
        <h2 className="font-display font-bold text-2xl mt-5">No favourites yet</h2>
        <p className="text-muted text-sm mt-2 max-w-md mx-auto">
          Tap the heart on any product to save it here.
          {!user && <> <Link href="/login" className="text-brand hover:underline">Sign in</Link> to keep favorites across devices.</>}
        </p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">
          Browse the catalog <Icon.arrow width={14} height={14} />
        </Link>
      </div>
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
