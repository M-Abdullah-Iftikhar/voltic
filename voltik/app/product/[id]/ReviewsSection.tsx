'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icons';
import { useUser } from '@/components/UserContext';
import type { Review } from '@/lib/types';

export function ReviewsSection({
  productId, initialReviews, initialRating, initialCount
}: {
  productId: string;
  initialReviews: Review[];
  initialRating: number;
  initialCount: number;
}) {
  const { user } = useUser();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState(initialRating);
  const [count, setCount] = useState(initialCount);

  // Form state
  const own = user ? reviews.find(r => r.userId === user.id) : null;
  const [score, setScore] = useState(own?.rating || 5);
  const [title, setTitle] = useState(own?.title || '');
  const [body, setBody] = useState(own?.body || '');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  // Aggregate helpers (always recompute from current reviews list)
  const distribution = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];   // 1..5 → indices 0..4
    reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) buckets[r.rating - 1] += 1; });
    return buckets;
  }, [reviews]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErr(''); setSubmitting(true);
    const res = await fetch(`/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: score, title, body })
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setErr(data.error || 'Could not save your review.'); return; }

    // Update local list with the returned review.
    setReviews(prev => {
      const next = prev.filter(r => r.id !== data.review.id);
      return [data.review, ...next];
    });
  };

  // Recompute aggregates whenever local reviews change.
  useMemo(() => {
    if (reviews.length === 0) { setRating(0); setCount(0); return; }
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    setRating(Math.round((sum / reviews.length) * 10) / 10);
    setCount(reviews.length);
  }, [reviews]);

  const deleteOwn = async () => {
    if (!own) return;
    const res = await fetch(`/api/products/${productId}/reviews?reviewId=${own.id}`, { method: 'DELETE' });
    if (res.ok) {
      setReviews(prev => prev.filter(r => r.id !== own.id));
      setTitle(''); setBody(''); setScore(5);
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
      {/* Summary + write form */}
      <aside className="space-y-6 self-start lg:sticky lg:top-20">
        <div className="card p-6">
          <h2 className="font-display font-bold text-xl">Customer reviews</h2>
          {count > 0 ? (
            <>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-bold gradient-text">{rating.toFixed(1)}</span>
                <span className="text-muted text-sm">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1 text-warn mt-1">
                {[...Array(5)].map((_, i) => <Icon.star key={i} width={14} height={14} className={i < Math.round(rating) ? '' : 'opacity-30'} />)}
              </div>
              <div className="text-xs text-muted mt-1">{count} verified {count === 1 ? 'review' : 'reviews'}</div>

              <div className="mt-5 space-y-1.5">
                {[5, 4, 3, 2, 1].map(stars => {
                  const c = distribution[stars - 1];
                  const pct = count ? (c / count) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-2 text-xs">
                      <span className="w-6 text-muted">{stars}★</span>
                      <div className="flex-1 h-1.5 rounded-full bg-elev overflow-hidden">
                        <div className="h-full bg-warn rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-muted">{c}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-muted text-sm mt-3">No reviews yet. Yours could be the first.</p>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-display font-bold text-lg">{own ? 'Update your review' : 'Write a review'}</h3>
          {!user ? (
            <p className="text-sm text-muted mt-3">
              <Link href={`/login?next=/product/${productId}`} className="text-brand hover:underline font-semibold">Sign in</Link> to share your experience with this product.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-4">
              <div>
                <span className="text-xs uppercase tracking-wide text-muted font-semibold">Your rating</span>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      type="button" key={n}
                      onClick={() => setScore(n)}
                      aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                      className={`h-9 w-9 grid place-items-center rounded-lg ${n <= score ? 'text-warn' : 'text-muted hover:text-warn'}`}
                    >
                      <Icon.star width={20} height={20} />
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-xs uppercase tracking-wide text-muted font-semibold">Headline</span>
                <input className="input mt-1.5" required minLength={2} maxLength={80} value={title} onChange={e => setTitle(e.target.value)} placeholder="Sum up your experience in a few words" />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-wide text-muted font-semibold">Your review</span>
                <textarea className="input mt-1.5" rows={4} required minLength={4} value={body} onChange={e => setBody(e.target.value)} placeholder="What did you like? Anything to flag?" />
              </label>

              {err && <div className="text-sm text-danger flex items-center gap-2"><Icon.close width={14} height={14} /> {err}</div>}

              <div className="flex justify-between items-center">
                {own && (
                  <button type="button" onClick={deleteOwn} className="text-xs text-muted hover:text-danger flex items-center gap-1">
                    <Icon.trash width={12} height={12} /> Delete my review
                  </button>
                )}
                <button type="submit" disabled={submitting} className="btn-primary text-sm ml-auto disabled:opacity-60">
                  {submitting ? 'Saving…' : own ? 'Update review' : 'Post review'}
                </button>
              </div>
            </form>
          )}
        </div>
      </aside>

      {/* Reviews list */}
      <div>
        {reviews.length === 0 ? (
          <div className="card p-10 text-center">
            <Icon.spark className="mx-auto text-muted" width={32} height={32} />
            <h3 className="font-display font-bold text-xl mt-3">No reviews yet</h3>
            <p className="text-sm text-muted mt-1">Be the first person to share thoughts on this product.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {reviews.map(r => (
              <li key={r.id} className="card p-5">
                <header className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full grid place-items-center text-white font-bold text-sm shrink-0" style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}>
                    {(r.userName || '?')[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{r.userName}</div>
                    <div className="text-xs text-muted">{r.createdAt}</div>
                  </div>
                  <div className="flex items-center gap-0.5 text-warn">
                    {[...Array(5)].map((_, i) => <Icon.star key={i} width={12} height={12} className={i < r.rating ? '' : 'opacity-30'} />)}
                  </div>
                </header>
                <h4 className="font-semibold mt-3">{r.title}</h4>
                <p className="text-sm text-muted mt-1.5 leading-relaxed">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
