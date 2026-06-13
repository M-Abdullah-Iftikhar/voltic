import { db } from '@/lib/db';
import { OrdersAdminClient } from './OrdersAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const orders = await db.listOrders();
  return <OrdersAdminClient initialOrders={orders} />;
}
