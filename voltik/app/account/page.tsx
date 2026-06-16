import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser, publicUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Icon, type IconKey } from '@/components/Icons';
import { ProductIllustration } from '@/components/ProductIllustration';
import { AccountGreeting } from '@/components/AccountGreeting';
import { Achievements } from '@/components/Achievements';
import { ReorderFavorites } from '@/components/ReorderFavorites';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { TotalImpactWidget } from '@/components/TotalImpactWidget';
import { enrich } from '@/lib/reviews';
import type { OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    'bg-warn/15 text-warn',
  processing: 'bg-brand/15 text-brand',
  shipped:    'bg-brand2/15 text-brand2',
  delivered:  'bg-success/15 text-success',
  cancelled:  'bg-danger/15 text-danger'
};

export default async function AccountOverview() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/account');

  const [orders, reviews, rawProducts] = await Promise.all([
    db.listOrdersForUser(user.id, user.email),
    db.listReviewsForUser(user.id),
    db.listProducts()
  ]);
  const products = await enrich(rawProducts);

  const totalSpent = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const itemsBought = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.items || 0), 0);
  const lastOrder = orders[0];

  // Impact roll-up — savings from discounted lines on non-cancelled orders,
  // and helpful-vote signal from the user's reviews.
  const productById = new Map(products.map(p => [p.id, p]));
  let savedFromDeals = 0;
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    for (const line of o.lines || []) {
      const p = productById.get(line.id);
      if (p?.oldPrice && p.oldPrice > p.price) {
        savedFromDeals += (p.oldPrice - p.price) * line.qty;
      }
    }
  }
  const helpfulVotes = reviews.reduce((s, r) => s + (r.helpfulCount || 0), 0);
  const reviewedProducts = new Set(reviews.map(r => r.productId)).size;

  const pUser = publicUser(user)!;

  return (
    <div className="space-y-6">
      <AccountGreeting
        user={pUser}
        orderCount={orders.length}
        reviewCount={reviews.length}
        favoriteCount={user.favorites.length}
      />

      {/* Wrapped teaser — only when there's actually something to recap */}
      {orders.length > 0 && (
        <Link
          href="/account/wrapped"
          className="relative block overflow-hidden rounded-3xl p-5 sm:p-6 group"
          style={{ background: 'linear-gradient(135deg,#0ea5e9 0%, #7c3aed 60%, #f97316 100%)' }}
        >
          <div className="absolute inset-0 bg-mesh opacity-30" aria-hidden />
          <div className="relative flex items-center gap-4 text-white">
            <span className="grid place-items-center h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm shrink-0">
              <Icon.spark width={22} height={22} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.3em] opacity-80">Voltik Wrapped · 12 months</div>
              <div className="font-display font-bold text-xl mt-1">Your year, plugged in.</div>
              <p className="text-xs opacity-90 mt-1">A Stories-style recap of everything you bought, saved, and said.</p>
            </div>
            <Icon.arrow width={18} height={18} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon="list"     label="Total orders"  value={String(orders.length)} sub={lastOrder ? `Last on ${lastOrder.date}` : 'No orders yet'} />
        <Stat icon="box"      label="Items bought"  value={String(itemsBought)}    sub={`Across ${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`} />
        <Stat icon="bolt"     label="Total spent"   value={`$${totalSpent.toFixed(2)}`} sub="Excluding cancelled" />
        <Stat icon="star"     label="Reviews written" value={String(reviews.length)} sub={user.favorites.length + ' favorites saved'} />
      </div>

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h3 className="font-display font-bold text-lg">Recent orders</h3>
          <Link href="/account/orders" className="text-xs text-brand hover:underline flex items-center gap-1">View all <Icon.arrow width={12} height={12} /></Link>
        </div>
        {orders.length === 0 ? (
          <div className="p-10 text-center">
            <Icon.list width={28} height={28} className="mx-auto text-muted" />
            <p className="text-sm text-muted mt-3">You haven't placed an order yet.</p>
            <Link href="/shop" className="btn-primary mt-5 inline-flex">Start shopping <Icon.arrow width={14} height={14} /></Link>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {orders.slice(0, 4).map(o => (
              <li key={o.id} className="flex items-center gap-4 p-5">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-muted">{o.id}</div>
                  <div className="font-semibold mt-0.5 line-clamp-1">{o.items} item{o.items === 1 ? '' : 's'} · {o.payment}</div>
                  <div className="text-xs text-muted">Placed on {o.date}</div>
                </div>
                <span className={`chip ${STATUS_STYLES[o.status]} capitalize`}>{o.status}</span>
                <span className="font-bold w-20 text-right">${o.total.toFixed(2)}</span>
                <Link href={`/account/orders/${encodeURIComponent(o.id)}`} className="btn-ghost text-xs !px-3 !py-1.5">View</Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Your impact — savings + community contribution */}
      <TotalImpactWidget
        saved={savedFromDeals}
        helpfulVotes={helpfulVotes}
        reviewedProducts={reviewedProducts}
        memberSince={user.createdAt}
      />

      {/* Pick up where you left off — favourites quick-add */}
      <ReorderFavorites catalog={products} />

      {/* Achievements / loyalty badges */}
      <Achievements
        orders={orders.length}
        reviews={reviews.length}
        favorites={user.favorites.length}
        spent={totalSpent}
        since={user.createdAt}
      />

      {/* Activity timeline */}
      <ActivityTimeline orders={orders} reviews={reviews} joinedAt={user.createdAt} />

      {/* Bought-it widget — products from delivered orders. */}
      {orders.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">Recently delivered</h3>
            <Link href="/account/reviews" className="text-xs text-brand hover:underline">Write a review</Link>
          </div>
          <PurchasedGrid orders={orders} products={products} />
        </div>
      )}
    </div>
  );
}

/* ---------- subcomponents ---------- */

function Stat({ icon, label, value, sub }: { icon: IconKey; label: string; value: string; sub: string }) {
  const Glyph = Icon[icon];
  return (
    <div className="card p-5">
      <span className="grid place-items-center h-10 w-10 rounded-xl bg-brand/10 text-brand">
        <Glyph width={18} height={18} />
      </span>
      <div className="mt-4 font-display font-bold text-2xl">{value}</div>
      <div className="text-xs text-muted">{label}</div>
      <div className="text-[11px] text-muted mt-1">{sub}</div>
    </div>
  );
}

function PurchasedGrid({ orders, products }: { orders: any[]; products: any[] }) {
  // Collect unique product ids from delivered + shipped order lines.
  const lineIds: string[] = [];
  for (const o of orders) {
    if (o.status === 'cancelled' || !o.lines) continue;
    for (const l of o.lines) if (!lineIds.includes(l.id)) lineIds.push(l.id);
  }
  const items = lineIds.map(id => products.find(p => p.id === id)).filter(Boolean).slice(0, 6);
  if (items.length === 0) {
    return <p className="text-sm text-muted">Once your orders are delivered, the items will show up here.</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map(p => (
        <Link key={p.id} href={`/product/${p.slug || p.id}`} className="group block">
          <ProductIllustration category={p.category} icon={p.icon} className="aspect-square rounded-xl" size={48} />
          <div className="mt-2 text-xs font-semibold line-clamp-2">{p.name}</div>
          <div className="text-[11px] text-muted">${p.price.toFixed(2)}</div>
        </Link>
      ))}
    </div>
  );
}
