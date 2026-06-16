'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icons';
import { useUser } from '@/components/UserContext';
import { Avatar } from '@/components/Avatar';
import { ReviewPhotos } from '@/components/ReviewPhotos';
import type { Review } from '@/lib/types';

export function ReviewsSection({
  productId, initialReviews, initialRating, initialCount, verifiedUserIds = [], verifiedEmails = []
}: {
  productId: string;
  initialReviews: Review[];
  initialRating: number;
  initialCount: number;
  /** Set of userIds that have actually ordered this product. */
  verifiedUserIds?: string[];
  /** Emails (lowercased) tied to non-cancelled orders containing this product. */
  verifiedEmails?: string[];
}) {
  const verifiedSet = useMemo(() => new Set(verifiedUserIds), [verifiedUserIds]);
  const emailSet    = useMemo(() => new Set(verifiedEmails), [verifiedEmails]);
  const { user } = useUser();
  const canReview = !!user && (verifiedSet.has(user.id) || emailSet.has(user.email.toLowerCase()));
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState(initialRating);
  const [count, setCount] = useState(initialCount);
  const [filterStar, setFilterStar] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);   // 0 = no filter

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

              {/* Interactive distribution: each row filters the list when
                  clicked. Positive/negative split copy beneath gives the
                  rating a quick narrative even before you read a word. */}
              <div className="mt-5 space-y-1.5" role="radiogroup" aria-label="Filter by star rating">
                {[5, 4, 3, 2, 1].map(stars => {
                  const c = distribution[stars - 1];
                  const pct = count ? (c / count) * 100 : 0;
                  const active = filterStar === stars;
                  const empty  = c === 0;
                  // Bar tone: 5/4 = success, 3 = warn, 1/2 = danger.
                  const tone = stars >= 4 ? 'bg-success' : stars === 3 ? 'bg-warn' : 'bg-danger';
                  return (
                    <button
                      key={stars}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setFilterStar(active ? 0 : stars as 1 | 2 | 3 | 4 | 5)}
                      disabled={empty}
                      className={`flex items-center gap-2 text-xs w-full text-left rounded-md px-1.5 py-1 -mx-1.5 transition ${
                        active ? 'bg-brand/5 ring-1 ring-brand/30' : empty ? 'opacity-50 cursor-not-allowed' : 'hover:bg-elev/60'
                      }`}
                    >
                      <span className={`w-7 font-mono font-semibold ${active ? 'text-brand' : 'text-muted'}`}>{stars}★</span>
                      <div className="flex-1 h-2 rounded-full bg-elev overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-[width] duration-700 ease-out ${tone}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`w-12 text-right tabular-nums ${active ? 'text-ink font-semibold' : 'text-muted'}`}>
                        {pct.toFixed(0)}%
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Narrative: % positive (4-5★) vs % negative (1-2★) */}
              {(() => {
                const positive = (distribution[3] + distribution[4]);
                const negative = (distribution[0] + distribution[1]);
                const positivePct = Math.round((positive / count) * 100);
                const negativePct = Math.round((negative / count) * 100);
                return (
                  <div className="mt-4 pt-4 border-t border-line/60 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-success">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                      {positivePct}% positive
                    </span>
                    {negative > 0 && (
                      <span className="flex items-center gap-1.5 text-danger">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-danger" />
                        {negativePct}% negative
                      </span>
                    )}
                  </div>
                );
              })()}
              {filterStar !== 0 && (
                <button
                  onClick={() => setFilterStar(0)}
                  className="mt-2 text-[11px] text-brand hover:underline"
                >
                  Show all ratings
                </button>
              )}
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
          ) : !canReview && !own ? (
            <div className="mt-3 rounded-2xl border border-warn/30 bg-warn/5 p-3 text-xs text-muted leading-relaxed flex items-start gap-2">
              <Icon.shield width={14} height={14} className="text-warn shrink-0 mt-0.5" />
              <div>
                <span className="text-ink font-semibold">Only verified buyers can review.</span>
                {' '}Order this product first and your review will publish with a verified-purchase badge.
              </div>
            </div>
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
          <ReviewsList
            reviews={reviews}
            onUpdateReview={(r) => setReviews(prev => prev.map(x => x.id === r.id ? r : x))}
            distribution={distribution}
            filterStar={filterStar}
            setFilterStar={setFilterStar}
            verifiedSet={verifiedSet}
            currentUserId={user?.id}
          />
        )}
      </div>
    </div>
  );
}

/* ─── reviews list with star filter + featured pin ─────────────── */

function ReviewsList({
  reviews, distribution, filterStar, setFilterStar, verifiedSet, currentUserId, onUpdateReview
}: {
  reviews: Review[];
  distribution: number[];                  // counts for 1..5
  filterStar: 0 | 1 | 2 | 3 | 4 | 5;
  setFilterStar: (s: 0 | 1 | 2 | 3 | 4 | 5) => void;
  verifiedSet: Set<string>;
  currentUserId?: string;
  onUpdateReview: (r: Review) => void;
}) {
  // The featured review = longest body among 4★+ reviews. Stable per render.
  const featured = useMemo(() => {
    const candidates = reviews.filter(r => r.rating >= 4);
    if (candidates.length === 0) return null;
    return candidates.reduce((best, r) => r.body.length > best.body.length ? r : best, candidates[0]);
  }, [reviews]);

  const visible = useMemo(() => {
    const rest = reviews.filter(r => r.id !== featured?.id);
    return filterStar === 0 ? rest : rest.filter(r => r.rating === filterStar);
  }, [reviews, featured, filterStar]);

  return (
    <div>
      {/* Filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        <FilterChip label="All"  count={reviews.length} active={filterStar === 0} onClick={() => setFilterStar(0)} />
        {[5, 4, 3, 2, 1].map(s => (
          <FilterChip
            key={s}
            label={`${s}★`}
            count={distribution[s - 1]}
            active={filterStar === s}
            onClick={() => setFilterStar(s as 1 | 2 | 3 | 4 | 5)}
          />
        ))}
      </div>

      {/* Featured */}
      {featured && filterStar === 0 && (
        <FeaturedReview review={featured} verified={verifiedSet.has(featured.userId)} />
      )}

      {/* List */}
      <ul className="space-y-4">
        {visible.map(r => {
          const verified = verifiedSet.has(r.userId);
          return (
            <li key={r.id} className="card p-5">
              <header className="flex items-center gap-3 flex-wrap">
                <Avatar name={r.userName || '?'} seed={r.userId || r.userName || r.id} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold flex items-center gap-1.5 flex-wrap">
                    {r.userName}
                    {verified && <VerifiedBadge />}
                  </div>
                  <div className="text-xs text-muted">{r.createdAt}</div>
                </div>
                <div className="flex items-center gap-0.5 text-warn">
                  {[...Array(5)].map((_, i) => <Icon.star key={i} width={12} height={12} className={i < r.rating ? '' : 'opacity-30'} />)}
                </div>
              </header>
              <h4 className="font-semibold mt-3">{r.title}</h4>
              <p className="text-sm text-muted mt-1.5 leading-relaxed">{r.body}</p>

              {/* Optional UGC photo strip — opens a lightbox on click */}
              <ReviewPhotos review={r} />

              {r.reply && <BrandReply reply={r.reply} />}

              <HelpfulnessVote
                review={r}
                currentUserId={currentUserId}
                onUpdated={onUpdateReview}
              />
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="card p-8 text-center text-sm text-muted">
            No {filterStar}-star reviews yet.{' '}
            <button onClick={() => setFilterStar(0)} className="text-brand hover:underline">Show all</button>
          </li>
        )}
      </ul>
    </div>
  );
}

function HelpfulnessVote({
  review, currentUserId, onUpdated
}: {
  review: Review;
  currentUserId?: string;
  onUpdated: (r: Review) => void;
}) {
  const [busy, setBusy] = useState(false);
  const isOwn   = currentUserId && currentUserId === review.userId;
  const myVote  = currentUserId
    ? review.helpfulVoters?.includes(currentUserId)    ? 'helpful'
    : review.notHelpfulVoters?.includes(currentUserId) ? 'notHelpful'
    : null
    : null;
  const helpful    = review.helpfulCount    || 0;
  const notHelpful = review.notHelpfulCount || 0;

  const vote = async (kind: 'helpful' | 'notHelpful') => {
    if (!currentUserId || isOwn || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(review.id)}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind })
      });
      if (res.ok) {
        const data = await res.json();
        // Patch the local copy with the fresh counts + voter sets.
        const next: Review = {
          ...review,
          helpfulCount: data.counts.helpful,
          notHelpfulCount: data.counts.notHelpful,
          helpfulVoters: data.myVote === 'helpful'
            ? Array.from(new Set([...(review.helpfulVoters || []), currentUserId]))
            : (review.helpfulVoters || []).filter(v => v !== currentUserId),
          notHelpfulVoters: data.myVote === 'notHelpful'
            ? Array.from(new Set([...(review.notHelpfulVoters || []), currentUserId]))
            : (review.notHelpfulVoters || []).filter(v => v !== currentUserId)
        };
        onUpdated(next);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 pt-3 border-t border-line/60 flex items-center gap-3 text-xs">
      <span className="text-muted">Was this helpful?</span>
      <VoteButton
        kind="helpful" label="Yes" count={helpful} active={myVote === 'helpful'}
        disabled={!currentUserId || !!isOwn || busy} onClick={() => vote('helpful')}
      />
      <VoteButton
        kind="notHelpful" label="No" count={notHelpful} active={myVote === 'notHelpful'}
        disabled={!currentUserId || !!isOwn || busy} onClick={() => vote('notHelpful')}
      />
      {!currentUserId && <span className="text-muted">· <Link href="/login" className="text-brand hover:underline">sign in</Link> to vote</span>}
      {isOwn && <span className="text-muted italic">· your own review</span>}
    </div>
  );
}

function VoteButton({ kind, label, count, active, disabled, onClick }: {
  kind: 'helpful' | 'notHelpful';
  label: string;
  count: number;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const cls = active
    ? 'border-brand bg-brand/10 text-brand'
    : 'border-line text-muted hover:text-ink hover:border-brand/40';
  // Rotate the arrow icon ↑ for helpful, ↓ for notHelpful.
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`chip border transition disabled:opacity-50 disabled:cursor-not-allowed ${cls}`}
      aria-pressed={active}
    >
      <Icon.arrow width={10} height={10} className={kind === 'helpful' ? '-rotate-90' : 'rotate-90'} />
      {label} <span className="opacity-70">({count})</span>
    </button>
  );
}

function BrandReply({ reply }: { reply: NonNullable<Review['reply']> }) {
  return (
    <div className="mt-3 rounded-2xl bg-brand/5 border border-brand/20 p-3.5 flex items-start gap-2.5">
      <span
        className="grid place-items-center h-7 w-7 rounded-lg text-white shrink-0"
        style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}
        aria-hidden
      >
        <Icon.bolt width={12} height={12} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-brand font-semibold flex items-center gap-1.5">
          Voltik response <span className="text-muted/60 normal-case">· {reply.createdAt}</span>
        </div>
        <p className="text-sm text-ink mt-1 leading-relaxed whitespace-pre-line">{reply.body}</p>
      </div>
    </div>
  );
}

function FilterChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={count === 0}
      className={`chip border transition disabled:opacity-40 disabled:cursor-not-allowed ${active ? 'bg-brand text-white border-brand' : 'border-line text-muted hover:text-ink'}`}
    >
      {label}
      <span className={`text-[10px] ml-1 ${active ? 'opacity-80' : 'opacity-60'}`}>{count}</span>
    </button>
  );
}

function FeaturedReview({ review, verified }: { review: Review; verified?: boolean }) {
  return (
    <article className="relative card p-5 mb-4 border-brand/40 overflow-hidden">
      <span
        aria-hidden
        className="absolute top-0 right-0 px-3 py-1 rounded-bl-2xl text-[10px] uppercase tracking-wider font-bold text-white"
        style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}
      >
        ★ Featured
      </span>
      <header className="flex items-center gap-3 pr-24 flex-wrap">
        <Avatar name={review.userName || '?'} seed={review.userId || review.userName || review.id} size={44} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold flex items-center gap-1.5 flex-wrap">
            {review.userName}
            {verified && <VerifiedBadge />}
          </div>
          <div className="text-xs text-muted">{review.createdAt}</div>
        </div>
      </header>
      <h4 className="font-display font-bold text-lg mt-3">{review.title}</h4>
      <p className="text-sm text-muted mt-2 leading-relaxed">{review.body}</p>
    </article>
  );
}

function VerifiedBadge() {
  return (
    <span
      className="chip bg-success/15 text-success"
      title="This reviewer has ordered this product"
    >
      <Icon.check width={10} height={10} /> Verified purchase
    </span>
  );
}
