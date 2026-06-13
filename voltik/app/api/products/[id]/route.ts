import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enrichOne } from '@/lib/reviews';
import type { Product } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const product = await db.getProduct(id);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(await enrichOne(product));
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const existing = await db.getProduct(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const patch = (await req.json()) as Partial<Product>;
  // Drop fields that may have leaked from older clients.
  delete (patch as any).rating;
  delete (patch as any).reviews;
  delete (patch as any).reviewsCount;

  const merged: Product = { ...existing, ...patch, id: existing.id };
  await db.upsertProduct(merged);
  return NextResponse.json(merged);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await db.deleteProduct(id);
  return NextResponse.json({ ok: true });
}
