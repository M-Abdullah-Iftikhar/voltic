import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { audit } from '@/lib/audit';
import type { Order } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** Admin gate — same cookie the admin login route plants. The middleware
 *  already covers the /admin UI; we re-check here because nothing in
 *  /api/* is auth-gated by middleware. */
async function requireAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  if (jar.get('voltik_admin')?.value !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await requireAdmin();
  if (gate) return gate;
  const { id: raw } = await ctx.params;
  const id = decodeURIComponent(raw);
  const existing = await db.getOrder(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const patch = (await req.json()) as Partial<Order>;
  const merged: Order = { ...existing, ...patch, id: existing.id };
  const saved = await db.upsertOrder(merged);
  await audit(req, 'order.update', { type: 'order', id: existing.id }, {
    fields: Object.keys(patch),
    status: saved.status
  });
  return NextResponse.json(saved);
}

export async function DELETE(req: Request, ctx: Ctx) {
  const gate = await requireAdmin();
  if (gate) return gate;
  const { id } = await ctx.params;
  const decoded = decodeURIComponent(id);
  await db.deleteOrder(decoded);
  await audit(req, 'order.delete', { type: 'order', id: decoded });
  return NextResponse.json({ ok: true });
}
