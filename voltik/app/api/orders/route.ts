import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import type { Order, OrderStatus } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as OrderStatus | null;
  let rows = await db.listOrders();
  if (status) rows = rows.filter(o => o.status === status);
  return NextResponse.json({ orders: rows, count: rows.length });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.customer || !body.email || typeof body.total !== 'number') {
    return NextResponse.json({ error: 'customer, email and total are required' }, { status: 400 });
  }

  // Auto-attach the logged-in user, if any.
  const me = await currentUser();

  const order: Order = {
    id: body.id || `#VLT-${Math.floor(10000 + Math.random() * 90000)}`,
    customer: body.customer,
    email: body.email,
    total: body.total,
    status: body.status || 'pending',
    date: body.date || new Date().toISOString().slice(0, 10),
    items: body.items || 1,
    payment: body.payment || 'Card',
    userId: me?.id,
    lines: Array.isArray(body.lines) ? body.lines : undefined,
    shipping: body.shipping
  };

  const saved = await db.upsertOrder(order);

  // Clear the user's server-side cart on successful order.
  if (me) await db.setUserCart(me.id, []);

  return NextResponse.json(saved, { status: 201 });
}
