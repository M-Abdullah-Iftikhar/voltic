'use client';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icons';
import type { Order, OrderStatus } from '@/lib/types';

const STATUSES: OrderStatus[] = ['pending','processing','shipped','delivered','cancelled'];
const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    'bg-warn/15 text-warn',
  processing: 'bg-brand/15 text-brand',
  shipped:    'bg-brand2/15 text-brand2',
  delivered:  'bg-success/15 text-success',
  cancelled:  'bg-danger/15 text-danger'
};

export function OrdersAdminClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [query, setQuery] = useState('');
  const [view, setView]   = useState<Order | null>(null);

  const filtered = useMemo(() => orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      return o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.email.toLowerCase().includes(q);
    }
    return true;
  }), [orders, statusFilter, query]);

  const setOrderStatus = async (id: string, status: OrderStatus) => {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      const updated = await res.json();
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      if (view?.id === updated.id) setView(updated);
    }
  };

  const totals = STATUSES.map(s => ({ status: s, count: orders.filter(o => o.status === s).length }));

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl">Orders</h1>
          <p className="text-muted text-sm mt-1">Track every order from placement to delivery.</p>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button onClick={() => setStatusFilter('all')} className={`card p-4 text-left transition ${statusFilter === 'all' ? 'ring-2 ring-brand' : ''}`}>
          <div className="text-xs text-muted">All</div>
          <div className="font-display font-bold text-2xl mt-1">{orders.length}</div>
        </button>
        {totals.map(t => (
          <button key={t.status} onClick={() => setStatusFilter(t.status)} className={`card p-4 text-left transition ${statusFilter === t.status ? 'ring-2 ring-brand' : ''}`}>
            <div className="text-xs text-muted capitalize">{t.status}</div>
            <div className="font-display font-bold text-2xl mt-1">{t.count}</div>
          </button>
        ))}
      </div>

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-full border border-line bg-bg px-3 py-2 flex-1 min-w-[260px]">
          <Icon.search width={14} height={14} className="text-muted" />
          <input className="bg-transparent outline-none text-sm flex-1" placeholder="Search by ID, customer or email…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="text-xs text-muted">{filtered.length} shown</div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted bg-elev/40">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Order</th>
                <th className="text-left px-2 py-3 font-semibold">Customer</th>
                <th className="text-left px-2 py-3 font-semibold">Date</th>
                <th className="text-left px-2 py-3 font-semibold">Payment</th>
                <th className="text-left px-2 py-3 font-semibold">Status</th>
                <th className="text-right px-2 py-3 font-semibold">Total</th>
                <th className="text-right px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-t border-line/60 hover:bg-elev/40">
                  <td className="px-5 py-3 font-mono text-xs">{o.id}</td>
                  <td className="px-2 py-3"><div className="font-semibold">{o.customer}</div><div className="text-xs text-muted">{o.email}</div></td>
                  <td className="px-2 py-3 text-muted">{o.date}</td>
                  <td className="px-2 py-3">{o.payment}</td>
                  <td className="px-2 py-3"><span className={`chip ${STATUS_STYLES[o.status]} capitalize`}>{o.status}</span></td>
                  <td className="px-2 py-3 text-right font-semibold">${o.total.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setView(o)} className="text-xs text-brand hover:underline">View</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-muted">No orders match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {view && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-bg/70 backdrop-blur-md animate-slidein" onClick={() => setView(null)}>
          <div className="card max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="font-mono text-xs text-muted">{view.id}</div>
                <h3 className="font-display font-bold text-xl mt-1">{view.customer}</h3>
                <div className="text-sm text-muted">{view.email}</div>
              </div>
              <button onClick={() => setView(null)} className="grid place-items-center h-9 w-9 rounded-full border border-line hover:bg-elev">
                <Icon.close width={16} height={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Order date" value={view.date} />
              <Info label="Payment" value={view.payment} />
              <Info label="Items" value={String(view.items)} />
              <Info label="Total" value={`$${view.total.toFixed(2)}`} accent="text-brand font-bold" />
            </div>

            <div className="mt-5">
              <div className="text-xs uppercase tracking-wide text-muted font-semibold mb-2">Update status</div>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => setOrderStatus(view.id, s)}
                    className={`chip border capitalize ${view.status === s ? 'bg-brand text-white border-brand' : 'border-line text-muted hover:text-ink'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="p-3 rounded-xl bg-elev/40">
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 ${accent || ''}`}>{value}</div>
    </div>
  );
}
