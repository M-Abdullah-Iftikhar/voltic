import { db } from '@/lib/db';
import { ReviewsAdminClient } from './ReviewsAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const [reviews, products] = await Promise.all([db.listReviews(), db.listProducts()]);
  // Sort newest first so the moderation queue feels live.
  reviews.sort((a, b) => a.createdAt < b.createdAt ? 1 : -1);
  return <ReviewsAdminClient initialReviews={reviews} products={products} />;
}
