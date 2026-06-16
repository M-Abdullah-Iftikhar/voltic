'use client';
import { Fragment, useMemo, useState } from 'react';
import { Icon } from '@/components/Icons';
import { AdminPageHeader } from '@/components/AdminPageHeader';
import { Pagination } from '@/components/Pagination';
import { SavedViews, type SavedView } from '@/components/SavedViews';
import { ExportCsvButton } from '@/components/ExportCsvButton';
import { recordEdit } from '@/lib/recentEdits';
import type { Order, OrderStatus } from '@/lib/types';

const STATUSES: OrderStatus[] = ['pending','processing','shipped','delivered','cancelled'];
const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    'bg-warn/15 text-warn',
  processing: 'bg-brand/15 text-brand',
  shipped:    'bg-brand2/15 text-brand2',
  delivered:  'bg-success/15 text-success',
  cancelled:  'bg-danger/15 text-danger'
};

type OrdersViewState = {
  statusFilter: 'all' | OrderStatus;
  query: string;
  sortKey: 'date' | 'total' | 'customer' | 'status';
  sortDir: 'asc' | 'desc';
};

// Built-in filter combos. Curated to map to the questions the team asks
// most often during a morning standup.
const ORDER_PRESETS: SavedView<OrdersViewState>[] = [
  { id: 'preset-needs-action', name: 'Needs action', state: { statusFilter: 'pending',    query: '', sortKey: 'date',  sortDir: 'asc' } },
  { id: 'preset-in-transit',   name: 'In transit',   state: { statusFilter: 'shipped',    query: '', sortKey: 'date',  sortDir: 'desc' } },
  { id: 'preset-big-tickets',  name: 'Big tickets',  state: { statusFilter: 'all',        query: '', sortKey: 'total', sortDir: 'desc' } }
];

export function OrdersAdminClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [query, setQuery] = useState('');
  const [view, setView]   = useState<Order | null>(null);

  const [sortKey, setSortKey] = useState<'date' | 'total' | 'customer' | 'status'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleRow = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    const rows = orders.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.email.toLowerCase().includes(q);
      }
      return true;
    });
    const cmp = (a: Order, b: Order) => {
      let diff = 0;
      switch (sortKey) {
        case 'date':     diff = a.date.localeCompare(b.date); break;
        case 'total':    diff = a.total - b.total; break;
        case 'customer': diff = a.customer.localeCompare(b.customer); break;
        case 'status':   diff = a.status.localeCompare(b.status); break;
      }
      return sortDir === 'asc' ? diff : -diff;
    };
    return rows.sort(cmp);
  }, [orders, statusFilter, query, sortKey, sortDir]);

  // Reset to page 1 whenever filters change to avoid empty pages.
  useMemo(() => { setPage(1); }, [statusFilter, query, pageSize]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const setOrderStatus = async (id: string, status: OrderStatus) => {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      const updated = await res.json();
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      if (view?.id === updated.id) setView(updated);
      recordEdit({
        kind: 'order',
        title: updated.id,
        sub: `Status → ${status}`,
        href: '/admin/orders'
      });
    }
  };

  const patchOrder = async (id: string, patch: Partial<Order>) => {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
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
      <AdminPageHeader
        title="Orders"
        subtitle="Track every order from placement to delivery."
        crumbs={[{ label: 'Orders' }]}
      />

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
        <ExportCsvButton
          rows={filtered}
          filename="voltik-orders"
          columns={[
            { label: 'Order ID', get: o => o.id },
            { label: 'Customer', get: o => o.customer },
            { label: 'Email',    get: o => o.email },
            { label: 'Date',     get: o => o.date },
            { label: 'Status',   get: o => o.status },
            { label: 'Payment',  get: o => o.payment },
            { label: 'Total',    get: o => o.total.toFixed(2) },
            { label: 'Items',    get: o => o.lines?.map(l => `${l.qty}x ${l.id}`).join(' | ') ?? '' }
          ]}
        />
      </div>

      {/* Saved views — preset + user-defined filter combos */}
      <SavedViews
        storageKey="voltik:admin-orders-views"
        presets={ORDER_PRESETS}
        currentState={{ statusFilter, query, sortKey, sortDir }}
        onApply={(s) => {
          setStatusFilter(s.statusFilter);
          setQuery(s.query);
          setSortKey(s.sortKey);
          setSortDir(s.sortDir);
        }}
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted bg-elev/80 backdrop-blur sticky top-0 z-10">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Order</th>
                <SortableTh label="Customer" active={sortKey === 'customer'} dir={sortDir} onClick={() => toggleSort('customer')} className="text-left px-2 py-3" />
                <SortableTh label="Date"     active={sortKey === 'date'}     dir={sortDir} onClick={() => toggleSort('date')}     className="text-left px-2 py-3" />
                <th className="text-left px-2 py-3 font-semibold">Payment</th>
                <SortableTh label="Status"   active={sortKey === 'status'}   dir={sortDir} onClick={() => toggleSort('status')}   className="text-left px-2 py-3" />
                <SortableTh label="Total"    active={sortKey === 'total'}    dir={sortDir} onClick={() => toggleSort('total')}    className="text-right px-2 py-3" align="right" />
                <th className="text-right px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(o => {
                const isOpen = expanded.has(o.id);
                return (
                  <Fragment key={o.id}>
                    <tr
                      onClick={() => toggleRow(o.id)}
                      className={`admin-row cursor-pointer ${isOpen ? 'is-open' : ''}`}
                    >
                      <td className="px-5 py-3 font-mono text-xs">
                        <span className="inline-flex items-center gap-2">
                          <Icon.arrow width={10} height={10} className={`text-muted transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                          {o.id}
                        </span>
                      </td>
                      <td className="px-2 py-3"><div className="font-semibold">{o.customer}</div><div className="text-xs text-muted">{o.email}</div></td>
                      <td className="px-2 py-3 text-muted">{o.date}</td>
                      <td className="px-2 py-3">{o.payment}</td>
                      <td className="px-2 py-3"><span className={`chip ${STATUS_STYLES[o.status]} capitalize`}>{o.status}</span></td>
                      <td className="px-2 py-3 text-right font-semibold">${o.total.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setView(o); }}
                          className="text-xs text-brand hover:underline"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-elev/30 border-b border-line/60">
                        <td colSpan={7} className="px-5 py-4">
                          <ExpandedOrderRow order={o} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-muted">No orders match.</td></tr>
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

            <TrackingEditor order={view} onSave={patch => patchOrder(view.id, patch)} />
            <NotesEditor    order={view} onSave={patch => patchOrder(view.id, patch)} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── tracking + notes editors (admin-only) ─────────────────────── */

function TrackingEditor({ order, onSave }: { order: Order; onSave: (patch: Partial<Order>) => void }) {
  const [carrier, setCarrier] = useState(order.tracking?.carrier || '');
  const [number,  setNumber]  = useState(order.tracking?.number  || '');
  const [url,     setUrl]     = useState(order.tracking?.url     || '');
  const [dirty,   setDirty]   = useState(false);

  const save = () => {
    if (!number.trim()) {
      onSave({ tracking: undefined });
    } else {
      onSave({ tracking: { carrier: carrier.trim() || 'Carrier', number: number.trim(), url: url.trim() || undefined } });
    }
    setDirty(false);
  };

  return (
    <div className="mt-5 p-4 rounded-2xl border border-line/70">
      <div className="text-xs uppercase tracking-wide text-muted font-semibold mb-3">Tracking</div>
      <div className="grid grid-cols-2 gap-2">
        <input className="input" placeholder="Carrier (DHL, FedEx…)" value={carrier} onChange={e => { setCarrier(e.target.value); setDirty(true); }} />
        <input className="input font-mono" placeholder="Tracking #" value={number} onChange={e => { setNumber(e.target.value); setDirty(true); }} />
        <input className="input col-span-2" placeholder="Tracking URL (optional)" value={url} onChange={e => { setUrl(e.target.value); setDirty(true); }} />
      </div>
      <div className="mt-3 flex justify-end">
        <button onClick={save} disabled={!dirty} className="btn-primary text-xs disabled:opacity-40">
          {order.tracking && !number.trim() ? 'Clear tracking' : 'Save tracking'}
        </button>
      </div>
    </div>
  );
}

function NotesEditor({ order, onSave }: { order: Order; onSave: (patch: Partial<Order>) => void }) {
  const [internalNote, setInternal] = useState(order.internalNote || '');
  const [customerNote, setCustomer] = useState(order.customerNote || '');
  const [dirty, setDirty] = useState(false);

  const save = () => {
    onSave({
      internalNote: internalNote.trim() || undefined,
      customerNote: customerNote.trim() || undefined
    });
    setDirty(false);
  };

  return (
    <div className="mt-3 p-4 rounded-2xl border border-line/70 space-y-3">
      <div className="text-xs uppercase tracking-wide text-muted font-semibold">Notes</div>
      <label className="block">
        <span className="text-[11px] text-muted">Internal (admin-only)</span>
        <textarea
          rows={2}
          className="input mt-1"
          placeholder="Private note for the team…"
          value={internalNote}
          onChange={e => { setInternal(e.target.value); setDirty(true); }}
        />
      </label>
      <label className="block">
        <span className="text-[11px] text-muted">Customer-visible</span>
        <textarea
          rows={2}
          className="input mt-1"
          placeholder="Shown to the customer on their order detail page…"
          value={customerNote}
          onChange={e => { setCustomer(e.target.value); setDirty(true); }}
        />
      </label>
      <div className="flex justify-end">
        <button onClick={save} disabled={!dirty} className="btn-primary text-xs disabled:opacity-40">Save notes</button>
      </div>
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

/** Inline-expanded order row — items, shipping, totals; no modal needed. */
function ExpandedOrderRow({ order }: { order: Order }) {
  return (
    <div className="grid sm:grid-cols-[1fr_1fr] gap-4 animate-slidein">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted font-semibold mb-2">Items ({order.items})</div>
        {order.lines && order.lines.length > 0 ? (
          <ul className="space-y-1.5 text-sm">
            {order.lines.map(l => (
              <li key={l.id} className="flex items-center justify-between p-2 rounded-lg bg-bg">
                <span className="font-mono text-xs text-muted">{l.id}</span>
                <span>×{l.qty}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted italic">No per-line breakdown stored for this order.</p>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted font-semibold mb-2">Shipping</div>
          {order.shipping ? (
            <div className="text-sm text-muted leading-relaxed p-3 rounded-lg bg-bg">
              <div className="text-ink font-semibold">{order.customer}</div>
              {order.shipping.address}<br />
              {order.shipping.city}, {order.shipping.country}<br />
              <span className="font-mono text-xs">{order.shipping.phone}</span>
            </div>
          ) : (
            <p className="text-xs text-muted italic">No shipping address on file.</p>
          )}
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-bg">
          <span className="text-sm text-muted">Total</span>
          <span className="font-bold gradient-text text-lg">${order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function SortableTh({
  label, active, dir, onClick, className = '', align = 'left'
}: {
  label: string; active: boolean; dir: 'asc' | 'desc';
  onClick: () => void; className?: string; align?: 'left' | 'right';
}) {
  return (
    <th className={`font-semibold ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 group ${align === 'right' ? 'ml-auto' : ''} ${active ? 'text-brand' : 'hover:text-ink'}`}
      >
        <span>{label}</span>
        <span aria-hidden className={`text-[9px] transition-opacity ${active ? 'opacity-100' : 'opacity-40 group-hover:opacity-80'}`}>
          {active ? (dir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}
