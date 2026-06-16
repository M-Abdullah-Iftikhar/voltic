import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientIp, rateLimit, rateLimitHeaders } from '@/lib/rateLimit';
import { captureError } from '@/lib/observability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/products/[id]/back-in-stock
 * Body: { email }
 *
 * Public endpoint. Captures a notify-me request for an OOS product. We
 * de-dupe per (productId, email) at the DB layer, so re-submitting is a
 * no-op rather than an error.
 */
export async function POST(req: Request, ctx: Ctx) {
  const { id: productId } = await ctx.params;

  const ip = clientIp(req);
  const limit = rateLimit(`back-in-stock:${ip}`, 5, 5 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests — try again in a few minutes.' },
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  const { email } = await req.json();
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400, headers: rateLimitHeaders(limit) });
  }

  const product = await db.getProduct(productId);
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404, headers: rateLimitHeaders(limit) });

  try {
    const row = await db.addBackInStock(productId, email);
    return NextResponse.json({ ok: true, request: row }, { headers: rateLimitHeaders(limit) });
  } catch (e) {
    captureError(e, { hint: 'back-in-stock-add', productId });
    return NextResponse.json({ error: 'Could not save request — try again.' }, { status: 500, headers: rateLimitHeaders(limit) });
  }
}
