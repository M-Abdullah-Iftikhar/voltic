'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/Icons';
import { ProductIllustration } from '@/components/ProductIllustration';
import type { Product, Review } from '@/lib/types';

type Item = { review: Review; product: Product | null };

export function MyReviewsClient({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);

  const remove = async (item: Item) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    setBusyId(item.review.id);
    const res = await fetch(`/api/products/${item.review.productId}/reviews?reviewId=${item.review.id}`, { method: 'DELETE' });
    setBusyId(null);
    if (res.ok) setItems(prev => prev.filter(x => x.review.id !== item.review.id));
  };

  if (items.length === 0) {
    return (
      <div className="card p-14 text-center">
        <Icon.star width={32} height={32} className="mx-auto text-muted" />
        <h3 className="font-display font-bold text-xl mt-3">No reviews yet</h3>
        <p className="text-sm text-muted mt-1 max-w-md mx-auto">After you receive an order, share your experience to help other shoppers.</p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">Browse products <Icon.arrow width={14} height={14} /></Link>
      </div>
    );
  }

  // Aggregate stats
  const avg = items.reduce((s, it) => s + it.review.rating, 0) / items.length;
  const fiveStar = items.filter(it => it.review.rating === 5).length;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Reviews written" value={String(items.length)} />
        <Stat label="Avg. rating given" value={avg.toFixed(1)} />
        <Stat label="5-star reviews" value={String(fiveStar)} />
        <Stat label="Most recent" value={items[0]?.review.createdAt || '—'} />
      </div>

      <ul className="space-y-4 mt-4">
        {items.map(it => (
          <li key={it.review.id} className="card p-5">
            <div className="flex gap-4">
              {it.product ? (
                <ProductIllustration category={it.product.category} icon={it.product.icon} className="h-16 w-16 rounded-xl shrink-0" size={32} />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-elev grid place-items-center text-muted shrink-0"><Icon.box width={24} height={24} /></div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {it.product ? (
                    <Link href={`/product/${it.product.id}`} className="font-semibold hover:text-brand line-clamp-1">{it.product.name}</Link>
                  ) : (
                    <span className="font-semibold italic text-muted">Discontinued product</span>
                  )}
                  <div className="flex items-center gap-0.5 text-warn">
                    {[...Array(5)].map((_, i) => <Icon.star key={i} width={12} height={12} className={i < it.review.rating ? '' : 'opacity-30'} />)}
                  </div>
                  <span className="text-xs text-muted">· {it.review.createdAt}</span>
                </div>
                <h4 className="font-semibold mt-2">{it.review.title}</h4>
                <p className="text-sm text-muted mt-1 leading-relaxed">{it.review.body}</p>
              </div>

              <div className="flex flex-col gap-1 shrink-0">
                {it.product && (
                  <Link href={`/product/${it.product.id}#reviews`} className="btn-ghost text-xs !px-3">
                    <Icon.edit width={12} height={12} /> Edit
                  </Link>
                )}
                <button onClick={() => remove(it)} disabled={busyId === it.review.id}
                  className="btn-ghost text-xs !px-3 hover:!text-danger disabled:opacity-50">
                  <Icon.trash width={12} height={12} /> {busyId === it.review.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="font-display font-bold text-2xl">{value}</div>
      <div className="text-xs text-muted mt-0.5">{label}</div>
    </div>
  );
}
