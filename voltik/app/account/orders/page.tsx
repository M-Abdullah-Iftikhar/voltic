import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Icon } from '@/components/Icons';
import { PullToRefresh } from '@/components/PullToRefresh';
import { OrdersListClient } from './OrdersListClient';

export const dynamic = 'force-dynamic';

export default async function AccountOrdersPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/account/orders');

  const orders = await db.listOrdersForUser(user.id, user.email);

  return (
    <div className="space-y-6">
      <PullToRefresh />
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display font-bold text-2xl">My orders</h2>
          <p className="text-muted text-sm mt-1">All purchases tied to {user.email}.</p>
        </div>
        <Link href="/shop" className="btn-ghost text-xs">
          <Icon.box width={14} height={14} /> Shop again
        </Link>
      </div>
      <OrdersListClient initialOrders={orders} />
    </div>
  );
}
