import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public endpoint — validate a promo code against the live subtotal and
 * return either the strippable PromoCode (no usedCount churn yet) plus
 * the computed discount, or a human-friendly reason for rejection.
 *
 * Storefront-facing, so we never expose usage analytics or other promos.
 */
export async function POST(req: Request) {
  const { code, subtotal } = await req.json();
  if (typeof code !== 'string' || !code.trim()) {
    return NextResponse.json({ error: 'Enter a code.' }, { status: 400 });
  }
  const basket = typeof subtotal === 'number' && subtotal >= 0 ? subtotal : 0;

  const promo = await db.getActivePromo(code.trim());
  if (!promo) {
    return NextResponse.json({ error: 'That code is not valid.' }, { status: 404 });
  }
  if (promo.minBasket && basket < promo.minBasket) {
    return NextResponse.json({
      error: `Spend at least $${promo.minBasket.toFixed(2)} to use this code.`
    }, { status: 400 });
  }

  let discount = 0;
  let freeShipping = false;
  if (promo.type === 'percent') discount = +(basket * (promo.value / 100)).toFixed(2);
  else if (promo.type === 'flat') discount = Math.min(basket, promo.value);
  else if (promo.type === 'shipping') freeShipping = true;

  return NextResponse.json({
    promo: {
      code: promo.code,
      type: promo.type,
      value: promo.value,
      minBasket: promo.minBasket || 0
    },
    discount,
    freeShipping
  });
}
