'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icons';
import type { Order, OrderStatus } from '@/lib/types';

const TABS: { key: 'all' | OrderStatus; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'pending',    label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped',    label: 'Shipped' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'cancelled',  label: 'Cancelled' }
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    'bg-warn/15 text-warn',
  processing: 'bg-brand/15 text-brand',
  shipped:    'bg-brand2/15 text-brand2',
  delivered:  'bg-success/15 text-success',
  cancelled:  'bg-danger/15 text-danger'
};

export function OrdersListClient({ initialOrders }: { initialOrders: Order[] }) {
  const [tab, setTab] = useState<'all' | OrderStatus>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => initialOrders.filter(o => {
    if (tab !== 'all' && o.status !== tab) return false;
    if (query) {
      const q = query.toLowerCase();
      return o.id.toLowerCase().includes(q) || (o.payment || '').toLowerCase().includes(q);
    }
    return true;
  }), [initialOrders, tab, query]);

  if (initialOrders.length === 0) {
    return (
      <div className="card p-14 text-center">
        <Icon.list width={32} height={32} className="mx-auto text-muted" />
        <h3 className="font-display font-bold text-xl mt-3">No orders yet</h3>
        <p className="text-sm text-muted mt-1 max-w-md mx-auto">Once you place an order, it'll show up here so you can track and reorder.</p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">Browse products <Icon.arrow width={14} height={14} /></Link>
      </div>
    );
  }

  return (
    <>
      {/* Tabs + search */}
      <div className="card p-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          {TABS.map(t => {
            const count = t.key === 'all' ? initialOrders.length : initialOrders.filter(o => o.status === t.key).length;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`chip border transition ${tab === t.key ? 'bg-brand text-white border-brand' : 'border-line text-muted hover:text-ink'}`}>
                {t.label}<span className="opacity-70 ml-1">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-line bg-bg px-3 py-1.5 ml-auto flex-1 sm:flex-none sm:w-56">
          <Icon.search width={12} height={12} className="text-muted" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search order or payment…" className="bg-transparent outline-none text-xs flex-1 placeholder:text-muted" />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-muted">No orders match this filter.</p>
        </div>
      ) : (
        <ul className="space-y-3 mt-4">
          {filtered.map(o => (
            <li key={o.id} className="card p-4 sm:p-5 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[180px]">
                <div className="font-mono text-xs text-muted">{o.id}</div>
                <div className="font-semibold mt-0.5">{o.items} item{o.items === 1 ? '' : 's'} · {o.payment}</div>
                <div className="text-xs text-muted">Placed on {o.date}</div>
              </div>

              <div className="text-right">
                <span className={`chip ${STATUS_STYLES[o.status]} capitalize`}>{o.status}</span>
                <div className="font-bold mt-1 text-lg">${o.total.toFixed(2)}</div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <Link href={`/account/orders/${encodeURIComponent(o.id)}`} className="btn-ghost text-xs flex-1 sm:flex-none">
                  Track order <Icon.arrow width={12} height={12} />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
