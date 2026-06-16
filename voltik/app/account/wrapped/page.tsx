import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { WrappedClient } from './WrappedClient';

export const dynamic = 'force-dynamic';

export default async function WrappedPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/account/wrapped');

  const [orders, reviews, allProducts] = await Promise.all([
    db.listOrdersForUser(user.id, user.email),
    db.listReviewsForUser(user.id),
    db.listProducts()
  ]);

  // Slice down to the most recent 12 months so the recap stays a "year".
  const now = Date.now();
  const yearAgo = now - 365 * 86_400_000;
  const yearOrders = orders.filter(o => {
    const t = new Date(o.date).getTime();
    return Number.isFinite(t) && t >= yearAgo;
  });
  const yearReviews = reviews.filter(r => {
    const t = new Date(r.createdAt).getTime();
    return Number.isFinite(t) && t >= yearAgo;
  });

  // ── Compute the metrics that drive the slides ─────────────────────
  const nonCancelled = yearOrders.filter(o => o.status !== 'cancelled');
  const spent = nonCancelled.reduce((s, o) => s + o.total, 0);
  const itemsBought = nonCancelled.reduce((s, o) => s + (o.items || 0), 0);

  // Savings vs. oldPrice across delivered/processing/shipped lines.
  const productById = new Map(allProducts.map(p => [p.id, p]));
  let saved = 0;
  for (const o of nonCancelled) {
    for (const line of o.lines || []) {
      const p = productById.get(line.id);
      if (p?.oldPrice && p.oldPrice > p.price) saved += (p.oldPrice - p.price) * line.qty;
    }
  }

  // Favourite category — most-bought category across non-cancelled orders.
  const categoryTally = new Map<string, number>();
  for (const o of nonCancelled) {
    for (const line of o.lines || []) {
      const p = productById.get(line.id);
      if (!p) continue;
      categoryTally.set(p.category, (categoryTally.get(p.category) || 0) + line.qty);
    }
  }
  const topCategory = Array.from(categoryTally.entries()).sort((a, b) => b[1] - a[1])[0];

  // Day-of-week pattern — when do they shop most?
  const dowTally = [0, 0, 0, 0, 0, 0, 0];
  for (const o of nonCancelled) {
    const d = new Date(o.date);
    if (Number.isFinite(d.getTime())) dowTally[d.getDay()]++;
  }
  const topDowIdx = dowTally.indexOf(Math.max(...dowTally));
  const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Most-helpful review (single best).
  const topReview = yearReviews.slice().sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0))[0];
  const helpfulTotal = yearReviews.reduce((s, r) => s + (r.helpfulCount || 0), 0);

  return (
    <WrappedClient
      userName={user.name}
      metrics={{
        spent,
        itemsBought,
        saved,
        orderCount: nonCancelled.length,
        reviewCount: yearReviews.length,
        helpfulTotal,
        topCategory: topCategory ? { id: topCategory[0], count: topCategory[1] } : null,
        topDow: dowTally[topDowIdx] > 0 ? DOW[topDowIdx] : null,
        topReviewTitle: topReview?.title || null
      }}
    />
  );
}
