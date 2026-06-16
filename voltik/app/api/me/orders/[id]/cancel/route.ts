import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { captureError } from '@/lib/observability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/me/orders/[id]/cancel
 *
 * User-initiated cancellation. Only allowed while the order is still
 * 'pending' (warehouse hasn't touched it). Marks the order cancelled and
 * restores stock for every line so the item is buyable again.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: encId } = await params;
  const id = decodeURIComponent(encId);

  const order = await db.getOrder(id);
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  // Ownership guard. Prefer strict `userId` match; email fallback only
  // when the order has no userId attached (guest checkouts) so a later
  // account with the same email can't grab orphan orders out from
  // under the original buyer.
  const owns = order.userId
    ? order.userId === u.id
    : order.email?.toLowerCase() === u.email.toLowerCase();
  if (!owns) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  if (order.status !== 'pending') {
    return NextResponse.json({
      error: 'This order can no longer be cancelled. Contact support if you need help.'
    }, { status: 409 });
  }

  try {
    // Restore stock first — if anything errors, we'd rather over-stock than
    // leave a phantom decrement.
    for (const line of order.lines || []) {
      await db.incrementStock(line.id, line.qty).catch(e =>
        captureError(e, { hint: 'cancel-restock', productId: line.id }));
    }
    const updated = await db.upsertOrder({ ...order, status: 'cancelled' });
    return NextResponse.json({ ok: true, order: updated });
  } catch (e) {
    captureError(e, { hint: 'order-cancel', orderId: id });
    return NextResponse.json({ error: 'Could not cancel — please try again.' }, { status: 500 });
  }
}
