import Link from 'next/link';
import { db } from '@/lib/db';
import { descendantIds } from '@/lib/categoryTree';
import { enrich } from '@/lib/reviews';
import { Icon, type IconKey } from '@/components/Icons';
import { ProductIllustration } from '@/components/ProductIllustration';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-warn/15 text-warn',
  processing: 'bg-brand/15 text-brand',
  shipped:    'bg-brand2/15 text-brand2',
  delivered:  'bg-success/15 text-success',
  cancelled:  'bg-danger/15 text-danger'
};

export default async function AdminDashboard() {
  const [orders, rawProducts, customers, categories, reviews] = await Promise.all([
    db.listOrders(), db.listProducts(), db.listCustomers(), db.listCategories(), db.listReviews()
  ]);
  const products = await enrich(rawProducts);

  const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const lowStock = products.filter(p => p.stock < 100);
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

  const topProducts = products.slice().sort((a, b) => b.reviewsCount - a.reviewsCount || b.rating - a.rating).slice(0, 5);
  const totalReviews = reviews.length;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl">Dashboard</h1>
          <p className="text-muted text-sm mt-1">Welcome back. Here's how Voltik is performing today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-xs"><Icon.refresh width={14} height={14} /> Refresh</button>
          <Link href="/admin/products" className="btn-primary text-xs"><Icon.plus width={14} height={14} /> New product</Link>
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon="bolt"     label="Revenue (30d)"  value={`$${revenue.toFixed(2)}`}     trend="+12.4%" positive />
        <KPI icon="list"     label="Total orders"   value={String(orders.length)}        trend="+8.1%"  positive />
        <KPI icon="box"      label="Products"       value={String(products.length)}      trend={`${lowStock.length} low`} negative={lowStock.length > 0} />
        <KPI icon="users"    label="Customers"      value={String(customers.length)}     trend="+3 new" positive />
      </div>

      {/* Chart + status breakdown */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg">Revenue trend</h3>
              <p className="text-xs text-muted">Last 7 days · USD</p>
            </div>
            <span className="chip bg-success/15 text-success">+18% WoW</span>
          </div>
          <RevenueChart data={trend} />
        </div>

        <div className="card p-6">
          <h3 className="font-display font-bold text-lg">Orders by status</h3>
          <p className="text-xs text-muted mb-4">Live across the entire pipeline.</p>
          <div className="space-y-3">
            {(['pending','processing','shipped','delivered','cancelled'] as const).map(s => {
              const count = orders.filter(o => o.status === s).length;
              const pct = orders.length ? (count / orders.length) * 100 : 0;
              return (
                <div key={s}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className={`chip ${STATUS_STYLES[s]} capitalize`}>{s}</span>
                    <span className="text-muted">{count} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-elev overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,rgb(var(--brand)),rgb(var(--brand2)))' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent + top products */}
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
                {orders.slice(0, 6).map(o => (
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
            {topProducts.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted w-5">#{i + 1}</span>
                <ProductIllustration category={p.category} icon={p.icon} className="h-11 w-11 rounded-xl shrink-0" size={22} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold line-clamp-1">{p.name}</div>
                  <div className="text-xs text-muted">
                    {p.reviewsCount > 0
                      ? `${p.reviewsCount.toLocaleString()} reviews · ★ ${p.rating.toFixed(1)}`
                      : 'No reviews yet'}
                  </div>
                </div>
                <span className="text-sm font-bold">${p.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Categories breakdown + low stock */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="font-display font-bold text-lg">Catalog by category</h3>
          <p className="text-xs text-muted mb-4">Distribution of {products.length} SKUs.</p>
          <div className="grid grid-cols-2 gap-3">
            {byCategory.map(c => {
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

        <div className="card p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display font-bold text-lg">Low stock</h3>
            <span className="chip bg-warn/15 text-warn">{lowStock.length} items</span>
          </div>
          <p className="text-xs text-muted mb-4">Restock these SKUs soon.</p>
          {lowStock.length === 0 ? (
            <div className="text-sm text-muted py-6 text-center">All stock levels are healthy.</div>
          ) : (
            <ul className="space-y-2">
              {lowStock.slice(0, 6).map(p => (
                <li key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-elev/50">
                  <ProductIllustration category={p.category} icon={p.icon} className="h-10 w-10 rounded-xl shrink-0" size={20} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold line-clamp-1">{p.name}</div>
                    <div className="text-xs text-muted font-mono">{p.sku}</div>
                  </div>
                  <span className="text-sm font-bold text-warn">{p.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function KPI({ icon, label, value, trend, positive, negative }: { icon: IconKey; label: string; value: string; trend: string; positive?: boolean; negative?: boolean }) {
  const Glyph = Icon[icon];
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="grid place-items-center h-10 w-10 rounded-xl bg-brand/10 text-brand">
          <Glyph width={18} height={18} />
        </span>
        <span className={`text-xs font-semibold ${positive ? 'text-success' : negative ? 'text-warn' : 'text-muted'}`}>{trend}</span>
      </div>
      <div className="mt-4 text-2xl font-bold font-display">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function RevenueChart({ data }: { data: { date: string; total: number }[] }) {
  if (data.length === 0) {
    return <div className="text-sm text-muted py-12 text-center">No orders yet.</div>;
  }
  const max = Math.max(...data.map(d => d.total), 1);
  const min = Math.min(...data.map(d => d.total));
  const W = 600, H = 200, pad = 24;
  const sx = (i: number) => pad + (i * (W - pad * 2)) / Math.max(1, data.length - 1);
  const sy = (v: number) => H - pad - ((v - 0) / max) * (H - pad * 2);
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${sy(d.total)}`).join(' ');
  const area = `${path} L ${sx(data.length - 1)} ${H - pad} L ${sx(0)} ${H - pad} Z`;

  return (
    <div className="mt-5">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48 overflow-visible">
        <defs>
          <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"  stopColor="rgb(var(--brand))"  stopOpacity="0.55" />
            <stop offset="100%" stopColor="rgb(var(--brand))" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgb(var(--brand))" />
            <stop offset="100%" stopColor="rgb(var(--brand2))" />
          </linearGradient>
        </defs>
        {/* grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line key={t} x1={pad} x2={W - pad} y1={H - pad - t * (H - pad * 2)} y2={H - pad - t * (H - pad * 2)}
                stroke="rgb(var(--line))" strokeDasharray="3 3" opacity="0.6" />
        ))}
        <path d={area} fill="url(#g)" />
        <path d={path} fill="none" stroke="url(#line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={d.date}>
            <circle cx={sx(i)} cy={sy(d.total)} r="4" fill="rgb(var(--surface))" stroke="rgb(var(--brand))" strokeWidth="2" />
            <text x={sx(i)} y={H - 4} textAnchor="middle" fontSize="10" fill="rgb(var(--muted))">{d.date.slice(5)}</text>
          </g>
        ))}
      </svg>
      <div className="flex justify-between text-xs text-muted mt-2 px-2">
        <span>Min ${min.toFixed(0)}</span>
        <span>Max ${max.toFixed(0)}</span>
      </div>
    </div>
  );
}
