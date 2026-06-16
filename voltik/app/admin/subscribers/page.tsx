import { db } from '@/lib/db';
import { SubscribersAdminClient } from './SubscribersAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminSubscribersPage() {
  const subscribers = await db.listSubscribers();
  return <SubscribersAdminClient initialSubscribers={subscribers} />;
}
