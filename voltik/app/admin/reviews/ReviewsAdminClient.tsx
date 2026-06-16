'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icons';
import { AdminPageHeader } from '@/components/AdminPageHeader';
import { Avatar } from '@/components/Avatar';
import { Pagination } from '@/components/Pagination';
import type { Product, Review } from '@/lib/types';

type FilterKind = 'all' | 'visible' | 'hidden' | 'lowstar' | 'noreply';

export function ReviewsAdminClient({ initialReviews, products }: { initialReviews: Review[]; products: Product[] }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKind>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [replyTarget, setReplyTarget] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [busy, setBusy] = useState(false);

  const productById = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const filtered = useMemo(() => {
    let rows = reviews.slice();
    switch (filter) {
      case 'visible':  rows = rows.filter(r => !r.hidden); break;
      case 'hidden':   rows = rows.filter(r =>  r.hidden); break;
      case 'lowstar':  rows = rows.filter(r => r.rating <= 2); break;
      case 'noreply':  rows = rows.filter(r => !r.reply); break;
    }
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter(r =>
        r.title.toLowerCase().includes(q)
        || r.body.toLowerCase().includes(q)
        || r.userName.toLowerCase().includes(q)
        || productById.get(r.productId)?.name.toLowerCase().includes(q));
    }
    return rows;
  }, [reviews, filter, query, productById]);

  useMemo(() => { setPage(1); }, [filter, query, pageSize]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const patch = async (id: string, body: Record<string, unknown>): Promise<Review | null> => {
    setBusy(true);
    const res = await fetch(`/api/admin/reviews/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    setBusy(false);
    if (!res.ok) return null;
    const data = await res.json();
    setReviews(prev => prev.map(r => r.id === data.review.id ? data.review : r));
    return data.review as Review;
  };

  const toggleHidden = (r: Review) => patch(r.id, { hidden: !r.hidden });

  const remove = async (r: Review) => {
    if (!confirm(`Permanently delete review "${r.title}"?`)) return;
    const res = await fetch(`/api/admin/reviews/${encodeURIComponent(r.id)}`, { method: 'DELETE' });
    if (res.ok) setReviews(prev => prev.filter(x => x.id !== r.id));
  };

  const openReply = (r: Review) => {
    setReplyTarget(r);
    setReplyText(r.reply?.body || '');
  };

  const submitReply = async () => {
    if (!replyTarget) return;
    if (!replyText.trim()) {
      await patch(replyTarget.id, { reply: null });
    } else {
      await patch(replyTarget.id, { reply: { body: replyText, by: 'Voltik team' } });
    }
    setReplyTarget(null);
    setReplyText('');
  };

  const stats = useMemo(() => ({
    total: reviews.length,
    hidden: reviews.filter(r => r.hidden).length,
    lowStar: reviews.filter(r => r.rating <= 2).length,
    replied: reviews.filter(r => !!r.reply).length
  }), [reviews]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Reviews"
        subtitle="Moderate user-submitted reviews. Hidden reviews stay in the DB but never render publicly."
        crumbs={[{ label: 'Reviews' }]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatChip label="Total"     value={stats.total}    onClick={() => setFilter('all')}     active={filter === 'all'} />
        <StatChip label="Hidden"    value={stats.hidden}   onClick={() => setFilter('hidden')}  active={filter === 'hidden'}  accent="text-danger" />
        <StatChip label="Low star"  value={stats.lowStar}  onClick={() => setFilter('lowstar')} active={filter === 'lowstar'} accent="text-warn" />
        <StatChip label="No reply"  value={reviews.length - stats.replied} onClick={() => setFilter('noreply')} active={filter === 'noreply'} accent="text-muted" />
      </div>

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-full border border-line bg-bg px-3 py-2 flex-1 min-w-[260px]">
          <Icon.search width={14} height={14} className="text-muted" />
          <input className="bg-transparent outline-none text-sm flex-1" placeholder="Search reviews, customers, products…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="text-xs text-muted">{filtered.length} of {reviews.length}</div>
      </div>

      <div className="card overflow-hidden divide-y divide-line/60">
        {paged.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">No reviews match.</div>
        )}
        {paged.map(r => {
          const product = productById.get(r.productId);
          return (
            <div key={r.id} className="p-5 flex gap-4">
              <Avatar name={r.userName || '?'} seed={r.userId || r.id} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{r.userName}</span>
                  <span className="flex items-center gap-0.5 text-warn">
                    {[...Array(5)].map((_, i) => <Icon.star key={i} width={11} height={11} className={i < r.rating ? '' : 'opacity-30'} />)}
                  </span>
                  <span className="text-xs text-muted">· {r.createdAt}</span>
                  {r.hidden && <span className="chip bg-danger/15 text-danger">Hidden</span>}
                  {(r.helpfulCount || r.notHelpfulCount) ? (
                    <span className="chip bg-elev text-muted">
                      <Icon.arrow width={9} height={9} className="-rotate-90" /> {r.helpfulCount || 0}
                      <span className="ml-1.5"><Icon.arrow width={9} height={9} className="inline rotate-90" /> {r.notHelpfulCount || 0}</span>
                    </span>
                  ) : null}
                </div>
                <h4 className="font-display font-semibold mt-1.5">{r.title}</h4>
                <p className="text-sm text-muted mt-1 leading-relaxed line-clamp-4">{r.body}</p>
                <div className="mt-2 text-xs text-muted">
                  on{' '}
                  {product
                    ? <Link href={`/product/${product.slug || product.id}`} className="text-brand hover:underline">{product.name}</Link>
                    : <span className="italic">Discontinued product</span>}
                </div>
                {r.reply && (
                  <div className="mt-3 rounded-xl bg-brand/5 border border-brand/20 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-brand font-semibold">Brand reply · {r.reply.createdAt}</div>
                    <p className="text-sm mt-1 whitespace-pre-line">{r.reply.body}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => toggleHidden(r)} disabled={busy} className="btn-ghost text-xs disabled:opacity-50">
                  {r.hidden ? <><Icon.check width={11} height={11} /> Restore</> : <><Icon.close width={11} height={11} /> Hide</>}
                </button>
                <button onClick={() => openReply(r)} className="btn-ghost text-xs">
                  <Icon.edit width={11} height={11} /> {r.reply ? 'Edit reply' : 'Reply'}
                </button>
                <button onClick={() => remove(r)} className="btn-ghost text-xs !text-danger border-danger/40 hover:bg-danger/10">
                  <Icon.trash width={11} height={11} /> Delete
                </button>
              </div>
            </div>
          );
        })}
        <Pagination
          total={filtered.length}
          pageSize={pageSize}
          page={currentPage}
          onPage={setPage}
          onPageSize={setPageSize}
        />
      </div>

      {replyTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-bg/70 backdrop-blur-md animate-slidein" onClick={() => setReplyTarget(null)}>
          <div className="card max-w-xl w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-xl">{replyTarget.reply ? 'Edit reply' : 'Reply to review'}</h3>
              <button onClick={() => setReplyTarget(null)} className="grid place-items-center h-9 w-9 rounded-full border border-line hover:bg-elev">
                <Icon.close width={16} height={16} />
              </button>
            </div>
            <p className="text-xs text-muted mb-3">Visible to everyone on the product page, signed as <span className="font-semibold text-ink">Voltik team</span>.</p>
            <textarea
              rows={5}
              className="input"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Thank you for the feedback…"
              autoFocus
            />
            <div className="mt-4 flex justify-between">
              {replyTarget.reply && (
                <button onClick={() => { setReplyText(''); submitReply(); }} disabled={busy} className="btn-ghost text-xs !text-danger">
                  <Icon.trash width={11} height={11} /> Remove reply
                </button>
              )}
              <div className="ml-auto flex gap-2">
                <button onClick={() => setReplyTarget(null)} className="btn-ghost text-xs">Cancel</button>
                <button onClick={submitReply} disabled={busy} className="btn-primary text-xs disabled:opacity-60">
                  {busy ? 'Saving…' : 'Post reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value, onClick, active, accent }: { label: string; value: number; onClick: () => void; active: boolean; accent?: string }) {
  return (
    <button onClick={onClick} className={`card p-4 text-left transition ${active ? 'ring-2 ring-brand' : ''}`}>
      <div className="text-xs text-muted">{label}</div>
      <div className={`font-display font-bold text-2xl mt-1 ${accent || ''}`}>{value}</div>
    </button>
  );
}
