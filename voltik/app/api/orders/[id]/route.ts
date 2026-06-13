import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Order } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id: raw } = await ctx.params;
  const id = decodeURIComponent(raw);
  const existing = await db.getOrder(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const patch = (await req.json()) as Partial<Order>;
  const merged: Order = { ...existing, ...patch, id: existing.id };
  const saved = await db.upsertOrder(merged);
  return NextResponse.json(saved);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await db.deleteOrder(decodeURIComponent(id));
  return NextResponse.json({ ok: true });
}
