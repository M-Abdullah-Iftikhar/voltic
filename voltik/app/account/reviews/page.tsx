import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Icon } from '@/components/Icons';
import { MyReviewsClient } from './MyReviewsClient';

export const dynamic = 'force-dynamic';

export default async function AccountReviewsPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/account/reviews');

  const [reviews, products] = await Promise.all([
    db.listReviewsForUser(user.id),
    db.listProducts()
  ]);

  // Pair each review with its product (denormalised at render time).
  const enriched = reviews.map(r => ({ review: r, product: products.find(p => p.id === r.productId) || null }));

  // Stats roll-up: average stars given, most-helpful review, total upvotes
  // received across every review the user has written.
  const visible = reviews.filter(r => !r.hidden);
  const avg = visible.length === 0
    ? 0
    : Math.round((visible.reduce((s, r) => s + r.rating, 0) / visible.length) * 10) / 10;
  const totalHelpful = reviews.reduce((s, r) => s + (r.helpfulCount || 0), 0);
  const mostHelpful = reviews
    .slice()
    .sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0))[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl">My reviews</h2>
        <p className="text-muted text-sm mt-1">Edit or remove a review from the product page where you wrote it.</p>
      </div>

      {reviews.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3">
          <StatCard
            icon="star"
            iconTone="text-warn"
            label="Avg stars given"
            value={avg === 0 ? '—' : avg.toFixed(1)}
            sub={`${visible.length} live · ${reviews.length - visible.length} hidden`}
          />
          <StatCard
            icon="heart"
            iconTone="text-danger"
            label="Upvotes received"
            value={totalHelpful.toLocaleString()}
            sub={totalHelpful > 0 ? 'Shoppers found your reviews helpful' : 'Cast a few helpful votes to start trading'}
          />
          <StatCard
            icon="spark"
            iconTone="text-brand"
            label="Most-helpful review"
            value={mostHelpful?.title?.slice(0, 28) || '—'}
            sub={mostHelpful && (mostHelpful.helpfulCount || 0) > 0
              ? `${mostHelpful.helpfulCount} ${mostHelpful.helpfulCount === 1 ? 'shopper' : 'shoppers'} · ${mostHelpful.createdAt}`
              : 'No upvotes yet'}
          />
        </div>
      )}

      <MyReviewsClient initialItems={enriched} />
    </div>
  );
}

function StatCard({ icon, iconTone, label, value, sub }: {
  icon: 'star' | 'heart' | 'spark';
  iconTone: string;
  label: string;
  value: string;
  sub: string;
}) {
  const Glyph = (Icon as Record<string, React.FC<{ width?: number; height?: number; className?: string }>>)[icon];
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted font-semibold">{label}</span>
        <span className={`grid place-items-center h-8 w-8 rounded-xl bg-elev/60 ${iconTone}`}>
          <Glyph width={14} height={14} />
        </span>
      </div>
      <div className="mt-3 font-display font-bold text-2xl text-ink line-clamp-1">{value}</div>
      <div className="text-[11px] text-muted mt-1 line-clamp-2">{sub}</div>
    </div>
  );
}
