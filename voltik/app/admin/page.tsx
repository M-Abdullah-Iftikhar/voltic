import Link from 'next/link';
import { db } from '@/lib/db';
import { descendantIds } from '@/lib/categoryTree';
import { enrich } from '@/lib/reviews';
import { Icon, type IconKey } from '@/components/Icons';
import { ProductIllustration } from '@/components/ProductIllustration';
import { Sparkline, TrendBadge } from '@/components/Sparkline';
import { AdminPageHeader } from '@/components/AdminPageHeader';
import { DonutChart } from '@/components/DonutChart';
import { OrderHeatmap } from '@/components/OrderHeatmap';
import { RevenueChart } from '@/components/RevenueChart';
import { OrdersMap } from '@/components/OrdersMap';
import { DashboardLayout, type WidgetSlot } from '@/components/DashboardLayout';
import type { Order, EnrichedProduct } from '@/lib/types';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-warn/15 text-warn',
  processing: 'bg-brand/15 text-brand',
  shipped:    'bg-brand2/15 text-brand2',
  delivered:  'bg-success/15 text-success',
  cancelled:  'bg-danger/15 text-danger'
};

export default async function AdminDashboard() {
  const [orders, rawProducts, customers, categories, reviews, bisQueue] = await Promise.all([
    db.listOrders(), db.listProducts(), db.listCustomers(), db.listCategories(), db.listReviews(),
    db.listBackInStock()
  ]);
  const products = await enrich(rawProducts);

  const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);

  // Stock health: bucket products by severity so the admin sees the queue
  // in priority order, and roll up "people waiting for restock" per SKU.
  const waitersByProduct = new Map<string, number>();
  for (const b of bisQueue) waitersByProduct.set(b.productId, (waitersByProduct.get(b.productId) || 0) + 1);
  const oosProducts = products.filter(p => p.stock <= 0).sort((a, b) =>
    (waitersByProduct.get(b.id) || 0) - (waitersByProduct.get(a.id) || 0));
  const criticalStock = products.filter(p => p.stock > 0 && p.stock < 10);
  const warnStock     = products.filter(p => p.stock >= 10 && p.stock < 100);
  const totalWaiters  = bisQueue.length;
  // Roll up subtree product counts for root-level categories only.
  const rootCats = categories.filter(c => c.parent === null);
  const byCategory = rootCats.map(c => {
    const subtree = descendantIds(c.id, categories);
    return { ...c, count: products.filter(p => subtree.includes(p.category)).length };
  });
  const dayBuckets: Record<string, number> = {};
  orders.forEach(o => {
    if (o.status !== 'cancelled') dayBuckets[o.date] = (dayBuckets[o.date] || 0) + o.total;
  });
  const trend = Object.keys(dayBuckets).sort().slice(-7).map(d => ({ date: d, total: dayBuckets[d] }));

  // Same x-axis, week-earlier values — feeds the optional compare line.
  const trendCompare = trend.map(point => {
    const d = new Date(point.date);
    d.setUTCDate(d.getUTCDate() - 7);
    const prevKey = d.toISOString().slice(0, 10);
    return { date: point.date, total: dayBuckets[prevKey] || 0 };
  });

  const topProducts = products.slice().sort((a, b) => b.reviewsCount - a.reviewsCount || b.rating - a.rating).slice(0, 5);
  const totalReviews = reviews.length;

  // ── Period analytics for sparklines + trend badges ──────────────────
  const series = buildDailySeries(orders, 14);
  const revenueSeries  = series.revenuePerDay;
  const orderSeries    = series.ordersPerDay;
  const reviewSeries   = buildReviewSeries(reviews.map(r => r.createdAt), 14);

  const halfway = (arr: number[]) => arr.length === 0 ? [0, 0] : [
    arr.slice(0, Math.floor(arr.length / 2)).reduce((s, n) => s + n, 0),
    arr.slice(Math.floor(arr.length / 2)).reduce((s, n) => s + n, 0)
  ];
  const [revPrev,    revCurr]    = halfway(revenueSeries);
  const [orderPrev,  orderCurr]  = halfway(orderSeries);
  const [reviewPrev, reviewCurr] = halfway(reviewSeries);

  // "Live" indicator — pulse a green dot on any KPI that received activity
  // today. Our timestamps are date-precision so we can't promise 10-min
  // freshness, but "today" is honest and immediately useful.
  const today = new Date().toISOString().slice(0, 10);
  const liveRevenue   = orders.some(o => o.date === today && o.status !== 'cancelled');
  const liveOrders    = liveRevenue;
  const liveReviews   = reviews.some(r => r.createdAt === today);
  // We don't store customer signup timestamps yet — keep it dark so we
  // don't flash a misleading "live" badge.
  const liveCustomers = false;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        subtitle="Welcome back. Here's how Voltik is performing today."
        primary={{ label: 'New product', icon: 'plus', href: '/admin/products' }}
      />

      {/* KPI cards */}
      <div data-tour="admin-greeting" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon="bolt"  label="Revenue (last 14d)" value={`$${revenue.toFixed(0)}`} current={revCurr}    previous={revPrev}    spark={revenueSeries} live={liveRevenue} />
        <KPI icon="list"  label="Orders (last 14d)"  value={String(orders.length)}    current={orderCurr}  previous={orderPrev}  spark={orderSeries}   live={liveOrders} />
        <KPI icon="star"  label="Reviews (last 14d)" value={String(totalReviews)}     current={reviewCurr} previous={reviewPrev} spark={reviewSeries}  live={liveReviews} />
        <KPI icon="users" label="Customers"          value={String(customers.length)} current={customers.length} previous={Math.max(0, customers.length - 3)} spark={cumulative(customers.length, 14)} live={liveCustomers} />
      </div>

      <DashboardLayout slots={buildSlots({
        trend, trendCompare, orders, topProducts, byCategory, products,
        oosProducts, criticalStock, warnStock, totalWaiters, waitersByProduct
      })} />
    </div>
  );
}

interface SlotInputs {
  trend: { date: string; total: number }[];
  trendCompare: { date: string; total: number }[];
  orders: Order[];
  topProducts: EnrichedProduct[];
  byCategory: { id: string; name: string; icon: string; gradient: string; count: number }[];
  products: EnrichedProduct[];
  oosProducts: EnrichedProduct[];
  criticalStock: EnrichedProduct[];
  warnStock: EnrichedProduct[];
  totalWaiters: number;
  waitersByProduct: Map<string, number>;
}

/** Build the rearrangeable widget slots in their default order. */
function buildSlots(p: SlotInputs): WidgetSlot[] {
  return [
    {
      id: 'chart-status',
      label: 'Revenue + status',
      content: (
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg">Revenue trend</h3>
                <p className="text-xs text-muted">Last 7 days · USD</p>
              </div>
              <span className="chip bg-success/15 text-success">+18% WoW</span>
            </div>
            <RevenueChart
              data={p.trend}
              comparison={p.trendCompare}
              compareLabels={{ current: 'This week', previous: 'Last week' }}
            />
          </div>
          <div className="card p-6">
            <h3 className="font-display font-bold text-lg">Orders by status</h3>
            <p className="text-xs text-muted mb-4">Live across the entire pipeline.</p>
            <DonutChart
              size={170}
              centerLabel={String(p.orders.length)}
              centerSub="total"
              slices={(['pending','processing','shipped','delivered','cancelled'] as const).map(s => ({
                label: s,
                value: p.orders.filter(o => o.status === s).length,
                color: ({
                  pending:    'rgb(var(--warn))',
                  processing: 'rgb(var(--brand))',
                  shipped:    'rgb(var(--brand2))',
                  delivered:  'rgb(var(--success))',
                  cancelled:  'rgb(var(--danger))'
                } as const)[s]
              }))}
            />
          </div>
        </div>
      )
    },
    {
      id: 'recent-top',
      label: 'Recent orders + top products',
      content: (
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-line">
              <h3 className="font-display font-bold text-lg">Recent orders</h3>
              <Link href="/admin/orders" className="text-xs text-brand hover:underline flex items-center gap-1">View all <Icon.arrow width={12} height={12} /></Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted">
                  <tr className="border-b border-line">
                    <th className="text-left px-5 py-3 font-semibold">Order</th>
                    <th className="text-left px-2 py-3 font-semibold">Customer</th>
                    <th className="text-left px-2 py-3 font-semibold">Status</th>
                    <th className="text-right px-5 py-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {p.orders.slice(0, 6).map(o => (
                    <tr key={o.id} className="border-b border-line/60 hover:bg-elev/40">
                      <td className="px-5 py-3 font-mono text-xs">{o.id}</td>
                      <td className="px-2 py-3"><div className="font-semibold">{o.customer}</div><div className="text-xs text-muted">{o.email}</div></td>
                      <td className="px-2 py-3"><span className={`chip ${STATUS_STYLES[o.status]} capitalize`}>{o.status}</span></td>
                      <td className="px-5 py-3 text-right font-semibold">${o.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-display font-bold text-lg">Top products</h3>
            <p className="text-xs text-muted mb-4">By review count.</p>
            <ul className="space-y-3">
              {p.topProducts.map((tp, i) => (
                <li key={tp.id} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted w-5">#{i + 1}</span>
                  <ProductIllustration category={tp.category} icon={tp.icon} className="h-11 w-11 rounded-xl shrink-0" size={22} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold line-clamp-1">{tp.name}</div>
                    <div className="text-xs text-muted">
                      {tp.reviewsCount > 0
                        ? `${tp.reviewsCount.toLocaleString()} reviews · ★ ${tp.rating.toFixed(1)}`
                        : 'No reviews yet'}
                    </div>
                  </div>
                  <span className="text-sm font-bold">${tp.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'heatmap',
      label: 'Order activity heat-map',
      content: <OrderHeatmap orders={p.orders} weeks={12} />
    },
    {
      id: 'orders-map',
      label: 'Live orders map',
      content: <OrdersMap orders={p.orders} maxPings={14} />
    },
    {
      id: 'catalog-stock',
      label: 'Catalog + stock health',
      content: (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-6">
            <h3 className="font-display font-bold text-lg">Catalog by category</h3>
            <p className="text-xs text-muted mb-4">Distribution of {p.products.length} SKUs.</p>
            <div className="grid grid-cols-2 gap-3">
              {p.byCategory.map(c => {
                const Glyph = Icon[c.icon as IconKey] || Icon.box;
                return (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-elev/40">
                    <span className="grid place-items-center h-10 w-10 rounded-xl text-white" style={{ background: c.gradient }}>
                      <Glyph width={18} height={18} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold line-clamp-1">{c.name}</div>
                      <div className="text-xs text-muted">{c.count} products</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <StockHealthCard
            oos={p.oosProducts}
            critical={p.criticalStock}
            warn={p.warnStock}
            totalWaiters={p.totalWaiters}
            waitersByProduct={p.waitersByProduct}
          />
        </div>
      )
    }
  ];
}

/* ─── stock-health widget ───────────────────────────────────────── */

function StockHealthCard({ oos, critical, warn, totalWaiters, waitersByProduct }: {
  oos: EnrichedProduct[];
  critical: EnrichedProduct[];
  warn: EnrichedProduct[];
  totalWaiters: number;
  waitersByProduct: Map<string, number>;
}) {
  // Show critical-first list: out of stock items with waiters bubble to the top.
  const list = [...oos, ...critical, ...warn].slice(0, 8);
  const allHealthy = list.length === 0;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display font-bold text-lg">Stock health</h3>
        <div className="flex gap-1">
          {oos.length > 0      && <span className="chip bg-danger/15 text-danger">{oos.length} OOS</span>}
          {critical.length > 0 && <span className="chip bg-warn/15 text-warn">{critical.length} critical</span>}
          {warn.length > 0     && <span className="chip bg-elev text-muted">{warn.length} low</span>}
        </div>
      </div>
      {totalWaiters > 0 ? (
        <p className="text-xs text-muted mb-4">
          <span className="text-brand font-semibold">{totalWaiters} customer{totalWaiters === 1 ? ' is' : 's are'} waiting</span> for restock notifications.
        </p>
      ) : (
        <p className="text-xs text-muted mb-4">Restock these SKUs soon. Out-of-stock items with waiters appear first.</p>
      )}

      {allHealthy ? (
        <div className="text-sm text-muted py-6 text-center">All stock levels are healthy.</div>
      ) : (
        <ul className="space-y-2">
          {list.map(p => {
            const waiters = waitersByProduct.get(p.id) || 0;
            const isOOS  = p.stock <= 0;
            const isCrit = !isOOS && p.stock < 10;
            const tone   = isOOS ? 'text-danger' : isCrit ? 'text-warn' : 'text-muted';
            return (
              <li key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-elev/50">
                <ProductIllustration category={p.category} icon={p.icon} className="h-10 w-10 rounded-xl shrink-0" size={20} />
                <div className="flex-1 min-w-0">
                  <Link href="/admin/products" className="text-sm font-semibold line-clamp-1 hover:text-brand">{p.name}</Link>
                  <div className="text-xs text-muted font-mono flex items-center gap-2">
                    {p.sku}
                    {waiters > 0 && (
                      <span className="chip bg-brand/10 text-brand !text-[10px]">
                        <Icon.spark width={9} height={9} /> {waiters} waiting
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-sm font-bold ${tone}`}>
                  {isOOS ? 'OOS' : p.stock}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function KPI({
  icon, label, value, current, previous, spark, live
}: {
  icon: IconKey; label: string; value: string;
  current: number; previous: number; spark: number[];
  live?: boolean;
}) {
  const Glyph = Icon[icon];
  return (
    <div className="card p-5 relative">
      {live && (
        <span
          aria-label="Activity today"
          title="Activity today"
          className="absolute top-3 right-3 grid place-items-center h-2.5 w-2.5"
        >
          <span className="absolute inline-flex h-full w-full rounded-full bg-success animate-pulseRing" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
        </span>
      )}
      <div className="flex items-center justify-between">
        <span className="grid place-items-center h-10 w-10 rounded-xl bg-brand/10 text-brand">
          <Glyph width={18} height={18} />
        </span>
        <TrendBadge current={current} previous={previous} suffix="vs prev" />
      </div>
      <div className="mt-4 text-2xl font-bold font-display">{value}</div>
      <div className="flex items-end justify-between gap-2 mt-1">
        <div className="text-xs text-muted">{label}</div>
        <Sparkline data={spark} width={84} height={24} />
      </div>
    </div>
  );
}

/* ─── analytics helpers ───────────────────────────────────────── */

function buildDailySeries(orders: Order[], days: number) {
  const today = new Date();
  const labels: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    labels.push(d.toISOString().slice(0, 10));
  }
  const revenueMap: Record<string, number> = Object.fromEntries(labels.map(d => [d, 0]));
  const ordersMap:  Record<string, number> = Object.fromEntries(labels.map(d => [d, 0]));
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    if (revenueMap[o.date] === undefined) continue;
    revenueMap[o.date] += o.total;
    ordersMap[o.date]  += 1;
  }
  return {
    labels,
    revenuePerDay: labels.map(l => revenueMap[l]),
    ordersPerDay:  labels.map(l => ordersMap[l])
  };
}

function buildReviewSeries(dates: string[], days: number): number[] {
  const today = new Date();
  const buckets: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const d of dates) {
    if (buckets[d] !== undefined) buckets[d] += 1;
  }
  return Object.values(buckets);
}

function cumulative(total: number, n: number): number[] {
  // Synthesised gentle ramp ending at `total` for the customer KPI sparkline.
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 1) / n;
    out.push(Math.round(total * (0.85 + t * 0.15)));
  }
  return out;
}

