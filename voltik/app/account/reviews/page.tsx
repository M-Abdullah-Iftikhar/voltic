import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl">My reviews</h2>
        <p className="text-muted text-sm mt-1">Edit or remove a review from the product page where you wrote it.</p>
      </div>
      <MyReviewsClient initialItems={enriched} />
    </div>
  );
}
