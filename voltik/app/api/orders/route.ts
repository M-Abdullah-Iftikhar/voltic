import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { captureError } from '@/lib/observability';
import type { CartLine, Order, OrderStatus } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  if (jar.get('voltik_admin')?.value !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/** Admin-only list. Customers see their own orders via `/api/me/orders`. */
export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (gate) return gate;
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
  const lines: CartLine[] = Array.isArray(body.lines)
    ? body.lines.filter((l: unknown): l is CartLine =>
        !!l && typeof (l as CartLine).id === 'string' && typeof (l as CartLine).qty === 'number' && (l as CartLine).qty > 0)
    : [];

  const order: Order = {
    id: body.id || `#VLT-${Math.floor(10000 + Math.random() * 90000)}`,
    customer: body.customer,
    email: String(body.email).toLowerCase(),
    total: body.total,
    status: body.status || 'pending',
    date: body.date || new Date().toISOString().slice(0, 10),
    items: lines.length ? lines.reduce((s, l) => s + l.qty, 0) : (body.items || 1),
    payment: body.payment || 'Card',
    userId: me?.id,
    lines: lines.length ? lines : undefined,
    shipping: body.shipping
  };

  try {
    // Atomic: stock decrement + order write + cart clear in one Mongo
    // transaction (with a manual-rollback fallback for non-replica
    // standalones). Insufficient stock comes back as { ok: false }.
    const placed = await db.placeOrder({ order, userId: me?.id });
    if (!placed.ok) {
      return NextResponse.json({
        error: 'Insufficient stock',
        ...placed.reason
      }, { status: 409 });
    }

    // Bump promo usage counter (server-trusted — client-sent code is fine
    // because we just re-validate it). Outside the order transaction so
    // a stale promo doesn't poison the order itself.
    if (typeof body.promoCode === 'string' && body.promoCode.trim()) {
      const active = await db.getActivePromo(body.promoCode).catch(() => null);
      if (active) {
        await db.incPromoUsage(active.code).catch(e =>
          captureError(e, { hint: 'promo-inc-usage', code: active.code }));
      }
    }

    return NextResponse.json(placed.order, { status: 201 });
  } catch (e) {
    captureError(e, { hint: 'order-create' });
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
