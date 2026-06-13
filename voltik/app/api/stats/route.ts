import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [orders, products, customers] = await Promise.all([
    db.listOrders(), db.listProducts(), db.listCustomers()
  ]);

  const revenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + o.total, 0);

  const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const byCategory = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const lowStock = products.filter(p => p.stock < 100).length;

  // Last 7 days of fake revenue trend (deterministic from order data)
  const dayBuckets: Record<string, number> = {};
  orders.forEach(o => {
    dayBuckets[o.date] = (dayBuckets[o.date] || 0) + (o.status === 'cancelled' ? 0 : o.total);
  });
  const days = Object.keys(dayBuckets).sort().slice(-7);
  const trend = days.map(d => ({ date: d, revenue: Math.round(dayBuckets[d] * 100) / 100 }));

  return NextResponse.json({
    revenue: Math.round(revenue * 100) / 100,
    orderCount: orders.length,
    productCount: products.length,
    customerCount: customers.length,
    lowStock,
    byStatus,
    byCategory,
    trend,
    recentOrders: orders.slice(0, 6)
  });
}
