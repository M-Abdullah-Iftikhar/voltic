import { db } from '@/lib/db';
import { AdsAdminClient } from './AdsAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminAdsPage() {
  const [ads, products] = await Promise.all([db.listAds(), db.listProducts()]);
  return <AdsAdminClient initialAds={ads} products={products} />;
}
