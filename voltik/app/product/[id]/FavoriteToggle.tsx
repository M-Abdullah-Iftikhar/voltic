'use client';
import { Icon } from '@/components/Icons';
import { useFavorites } from '@/components/FavoritesContext';

export function FavoriteToggle({ productId }: { productId: string }) {
  const { has, toggle } = useFavorites();
  const isFav = has(productId);
  return (
    <button
      onClick={() => toggle(productId)}
      aria-pressed={isFav}
      className={`chip border ${isFav ? 'bg-danger/10 border-danger text-danger' : 'border-line text-muted hover:text-danger'} ml-auto`}
    >
      {isFav ? <FilledHeart /> : <Icon.heart width={12} height={12} />}
      {isFav ? 'Saved' : 'Save'}
    </button>
  );
}

function FilledHeart() {
  return (
    <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
      <path d="M12 21s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z"/>
    </svg>
  );
}
