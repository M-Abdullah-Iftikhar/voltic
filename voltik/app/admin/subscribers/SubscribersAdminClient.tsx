'use client';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icons';
import { AdminPageHeader } from '@/components/AdminPageHeader';
import { Pagination } from '@/components/Pagination';
import { ExportCsvButton } from '@/components/ExportCsvButton';
import type { Subscriber } from '@/lib/types';

const EXPORT_COLUMNS = [
  { label: 'Email',     get: (s: Subscriber) => s.email },
  { label: 'Subscribed', get: (s: Subscriber) => s.createdAt },
  { label: 'Source',    get: (s: Subscriber) => s.source ?? '' }
];

export function SubscribersAdminClient({ initialSubscribers }: { initialSubscribers: Subscriber[] }) {
  const [subscribers] = useState<Subscriber[]>(initialSubscribers);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filtered = useMemo(() => {
    if (!query) return subscribers;
    const q = query.toLowerCase();
    return subscribers.filter(s => s.email.toLowerCase().includes(q));
  }, [subscribers, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Group subscribers by month to give the admin a sense of growth.
  const byMonth = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const s of subscribers) {
      const m = s.createdAt.slice(0, 7);
      buckets.set(m, (buckets.get(m) || 0) + 1);
    }
    return Array.from(buckets.entries()).sort((a, b) => a[0] < b[0] ? 1 : -1).slice(0, 6);
  }, [subscribers]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Newsletter subscribers"
        subtitle="Everyone who opted into product drops and promotions."
        crumbs={[{ label: 'Subscribers' }]}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Total subscribers" value={subscribers.length.toLocaleString()} />
        <StatCard label="This month" value={(byMonth[0]?.[1] || 0).toLocaleString()} accent="text-success" />
        <StatCard label="Last 6 months" value={byMonth.reduce((s, [, c]) => s + c, 0).toLocaleString()} />
      </div>

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-full border border-line bg-bg px-3 py-2 flex-1 min-w-[260px]">
          <Icon.search width={14} height={14} className="text-muted" />
          <input className="bg-transparent outline-none text-sm flex-1" placeholder="Search by email…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="text-xs text-muted">{filtered.length} of {subscribers.length}</div>
        <ExportCsvButton rows={filtered} filename="voltik-subscribers" columns={EXPORT_COLUMNS} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted bg-elev/40">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Email</th>
                <th className="text-left px-2 py-3 font-semibold">Subscribed</th>
                <th className="text-left px-2 py-3 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(s => (
                <tr key={s.id} className="admin-row">
                  <td className="px-5 py-3 font-mono text-xs">{s.email}</td>
                  <td className="px-2 py-3 text-xs">{s.createdAt}</td>
                  <td className="px-2 py-3 text-xs">
                    {s.source
                      ? <span className="chip bg-brand/10 text-brand">{s.source}</span>
                      : <span className="text-muted">—</span>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={3} className="text-center py-12 text-muted">No subscribers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          total={filtered.length}
          pageSize={pageSize}
          page={currentPage}
          onPage={setPage}
          onPageSize={setPageSize}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-muted font-semibold">{label}</div>
      <div className={`mt-2 text-2xl font-display font-bold ${accent || 'text-ink'}`}>{value}</div>
    </div>
  );
}
