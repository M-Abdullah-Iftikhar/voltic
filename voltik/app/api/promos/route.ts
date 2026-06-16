import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { captureError } from '@/lib/observability';
import type { PromoCode } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  if (jar.get('voltik_admin')?.value !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const gate = await requireAdmin();
  if (gate) return gate;
  const promos = await db.listPromos();
  return NextResponse.json({ promos, count: promos.length });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate) return gate;

  const body = (await req.json()) as Partial<PromoCode>;
  if (!body.code || !body.type || typeof body.value !== 'number') {
    return NextResponse.json({ error: 'code, type and value are required' }, { status: 400 });
  }
  if (!['percent', 'flat', 'shipping'].includes(body.type)) {
    return NextResponse.json({ error: 'type must be percent, flat or shipping' }, { status: 400 });
  }

  const code = String(body.code).toUpperCase().trim();
  const promo: PromoCode = {
    id: code,
    code,
    type: body.type,
    value: body.value,
    minBasket: body.minBasket ?? 0,
    expiresAt: body.expiresAt || undefined,
    usageLimit: body.usageLimit ?? undefined,
    usedCount: body.usedCount ?? 0,
    active: body.active ?? true,
    createdAt: body.createdAt || new Date().toISOString().slice(0, 10)
  };

  try {
    const saved = await db.upsertPromo(promo);
    return NextResponse.json(saved, { status: 201 });
  } catch (e) {
    captureError(e, { hint: 'promo-upsert' });
    return NextResponse.json({ error: 'Failed to save promo' }, { status: 500 });
  }
}
