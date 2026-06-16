'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icons';
import { EmptyState } from '@/components/EmptyState';
import { useCart } from '@/components/CartContext';
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

type DateRange = 'all' | '30d' | '90d' | 'year';
const DATE_RANGES: { key: DateRange; label: string; days: number }[] = [
  { key: 'all',  label: 'All time',     days: 0 },
  { key: '30d',  label: 'Last 30 days', days: 30 },
  { key: '90d',  label: 'Last 90 days', days: 90 },
  { key: 'year', label: 'This year',    days: 365 }
];

export function OrdersListClient({ initialOrders }: { initialOrders: Order[] }) {
  const [tab, setTab] = useState<'all' | OrderStatus>('all');
  const [query, setQuery] = useState('');
  const [range, setRange] = useState<DateRange>('all');
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const filtered = useMemo(() => {
    const cutoff = range === 'all' ? 0 : Date.now() - (DATE_RANGES.find(r => r.key === range)!.days * 86_400_000);
    return initialOrders.filter(o => {
      if (tab !== 'all' && o.status !== tab) return false;
      if (range !== 'all') {
        const t = new Date(o.date).getTime();
        if (!Number.isFinite(t) || t < cutoff) return false;
      }
      if (query) {
        const q = query.toLowerCase();
        return o.id.toLowerCase().includes(q) || (o.payment || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [initialOrders, tab, query, range]);

  if (initialOrders.length === 0) {
    return (
      <EmptyState
        kind="orders"
        title="No orders yet"
        body="Once you place an order, it'll show up here so you can track and reorder."
        primary={{ href: '/shop', label: 'Browse products' }}
      />
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

      {/* Date-range chips + view toggle */}
      <div className="flex items-center gap-2 flex-wrap mt-3">
        <span className="text-xs uppercase tracking-wide text-muted font-semibold">Range</span>
        {DATE_RANGES.map(r => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`chip border transition ${range === r.key ? 'bg-brand/10 text-brand border-brand' : 'border-line text-muted hover:text-ink'}`}
          >
            {r.label}
          </button>
        ))}

        {/* List / Calendar pill — sits on the right, mirrors the shop grid/list toggle */}
        <div className="ml-auto inline-flex items-center gap-0.5 rounded-full border border-line bg-bg p-0.5">
          <button
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
            className={`grid place-items-center h-7 w-7 rounded-full transition ${view === 'list' ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}
            title="List view"
          >
            <Icon.list width={13} height={13} />
          </button>
          <button
            onClick={() => setView('calendar')}
            aria-pressed={view === 'calendar'}
            className={`grid place-items-center h-7 w-7 rounded-full transition ${view === 'calendar' ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}
            title="Calendar view"
          >
            <Icon.spark width={13} height={13} />
          </button>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-muted">No orders match this filter.</p>
        </div>
      ) : view === 'list' ? (
        <ul className="space-y-3 mt-4">
          {filtered.map(o => <OrderRow key={o.id} order={o} />)}
        </ul>
      ) : (
        <OrdersCalendar orders={filtered} />
      )}
    </>
  );
}

/* ─── Calendar view ─────────────────────────────────────────────── */

function OrdersCalendar({ orders }: { orders: Order[] }) {
  // Group orders by YYYY-MM-DD. Calendar walks the month containing the
  // most recent order so the grid always has rows worth showing.
  const grouped = new Map<string, Order[]>();
  for (const o of orders) {
    const list = grouped.get(o.date) || [];
    list.push(o);
    grouped.set(o.date, list);
  }

  const sortedDates = Array.from(grouped.keys()).sort((a, b) => a < b ? 1 : -1);
  const [cursor, setCursor] = useState(() => {
    const anchor = sortedDates[0] ? new Date(sortedDates[0]) : new Date();
    return { year: anchor.getUTCFullYear(), month: anchor.getUTCMonth() };
  });

  const monthLabel = new Date(Date.UTC(cursor.year, cursor.month, 1))
    .toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  // Build the grid: first day of the month + offset for Monday-start.
  const firstOfMonth = new Date(Date.UTC(cursor.year, cursor.month, 1));
  const daysInMonth = new Date(Date.UTC(cursor.year, cursor.month + 1, 0)).getUTCDate();
  // Monday-first weekday index (Mon = 0 .. Sun = 6).
  const leadBlanks = ((firstOfMonth.getUTCDay() + 6) % 7);

  const cells: ({ day: number; date: string } | null)[] = [];
  for (let i = 0; i < leadBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${cursor.year}-${pad(cursor.month + 1)}-${pad(d)}`;
    cells.push({ day: d, date: key });
  }
  while (cells.length % 7) cells.push(null);

  const shift = (delta: number) => {
    setCursor(c => {
      const total = c.year * 12 + c.month + delta;
      return { year: Math.floor(total / 12), month: total % 12 };
    });
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="card p-5 mt-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => shift(-1)} aria-label="Previous month"
          className="grid place-items-center h-8 w-8 rounded-full border border-line hover:bg-elev">
          <Icon.arrow width={12} height={12} className="rotate-180" />
        </button>
        <div className="font-display font-bold text-sm">{monthLabel}</div>
        <button onClick={() => shift(1)} aria-label="Next month"
          className="grid place-items-center h-8 w-8 rounded-full border border-line hover:bg-elev">
          <Icon.arrow width={12} height={12} />
        </button>
      </div>

      {/* Weekday header (Monday-first) */}
      <div className="grid grid-cols-7 gap-1.5 text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
          <div key={d} className="text-center">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`b-${i}`} className="aspect-square rounded-lg bg-elev/40" />;
          const dayOrders = grouped.get(cell.date) || [];
          const hasOrders = dayOrders.length > 0;
          const isToday = cell.date === today;
          return (
            <div
              key={cell.date}
              className={`relative aspect-square rounded-lg p-2 text-xs transition ${
                hasOrders
                  ? 'bg-brand/10 hover:bg-brand/15 border border-brand/30'
                  : 'bg-elev/30 hover:bg-elev/50'
              } ${isToday ? 'ring-2 ring-brand/50' : ''}`}
            >
              <div className={`font-mono font-semibold ${hasOrders ? 'text-ink' : 'text-muted'}`}>
                {cell.day}
              </div>
              {hasOrders && (
                <div className="mt-1 space-y-0.5">
                  {dayOrders.slice(0, 2).map(o => (
                    <Link
                      key={o.id}
                      href={`/account/orders/${encodeURIComponent(o.id)}`}
                      className="block text-[9px] font-semibold text-brand line-clamp-1 hover:underline"
                    >
                      ${o.total.toFixed(0)}
                    </Link>
                  ))}
                  {dayOrders.length > 2 && (
                    <div className="text-[9px] text-muted">+{dayOrders.length - 2} more</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-[10px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand/30 border border-brand/40" />
          Order day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm ring-2 ring-brand/50" />
          Today
        </span>
      </div>
    </div>
  );
}

function pad(n: number): string { return n.toString().padStart(2, '0'); }

function OrderRow({ order: o }: { order: Order }) {
  const { add } = useCart();
  const [reordered, setReordered] = useState(false);
  const canReorder = (o.status === 'delivered' || o.status === 'cancelled') && (o.lines?.length ?? 0) > 0;

  const reorder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (o.lines || []).forEach(l => add(l.id, l.qty));
    setReordered(true);
    setTimeout(() => setReordered(false), 1600);
  };

  return (
    <li className="card p-4 sm:p-5 flex flex-wrap items-center gap-4 group relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex-1 min-w-[180px]">
        <div className="font-mono text-xs text-muted">{o.id}</div>
        <div className="font-semibold mt-0.5">{o.items} item{o.items === 1 ? '' : 's'} · {o.payment}</div>
        <div className="text-xs text-muted">Placed on {o.date}</div>
      </div>

      <div className="text-right">
        <span className={`chip ${STATUS_STYLES[o.status]} capitalize`}>{o.status}</span>
        <div className="font-bold mt-1 text-lg">${o.total.toFixed(2)}</div>
      </div>

      {/* Default-visible Track action — keeps the row useful on mobile + a11y */}
      <div className="flex gap-2 w-full sm:w-auto">
        <Link href={`/account/orders/${encodeURIComponent(o.id)}`} className="btn-ghost text-xs flex-1 sm:flex-none">
          Track order <Icon.arrow width={12} height={12} />
        </Link>
      </div>

      {/* Hover quick-actions strip — desktop only, slides in from the right.
          Falls back to nothing on touch (the Track button above stays). */}
      <div
        className="hidden sm:flex absolute inset-y-0 right-4 items-center gap-1 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 transition-all duration-200 pointer-events-none"
        aria-hidden
      >
        <div className="pointer-events-auto flex items-center gap-1 bg-surface/95 backdrop-blur-sm border border-line rounded-full px-1.5 py-1 shadow-soft">
          <QuickAction
            href={`/account/orders/${encodeURIComponent(o.id)}`}
            icon="truck" label="Track"
          />
          {canReorder && (
            <QuickAction
              onClick={reorder}
              icon={reordered ? 'check' : 'refresh'}
              label={reordered ? 'Added' : 'Reorder'}
              tone={reordered ? 'success' : 'default'}
            />
          )}
          <QuickAction
            href={`/api/me/export`}
            icon="list" label="Invoice"
            download
          />
        </div>
      </div>
    </li>
  );
}

function QuickAction({
  href, onClick, icon, label, tone = 'default', download
}: {
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  icon: keyof typeof Icon;
  label: string;
  tone?: 'default' | 'success';
  download?: boolean;
}) {
  const Glyph = Icon[icon];
  const cls = `flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition ${
    tone === 'success'
      ? 'bg-success/15 text-success'
      : 'text-ink hover:bg-elev'
  }`;
  if (href) {
    return (
      <Link href={href} onClick={onClick} className={cls} {...(download ? { download: true } : {})}>
        <Glyph width={11} height={11} /> {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      <Glyph width={11} height={11} /> {label}
    </button>
  );
}
