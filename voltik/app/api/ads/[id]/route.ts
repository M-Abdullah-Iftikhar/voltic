import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { captureError } from '@/lib/observability';
import type { Ad } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  if (jar.get('voltik_admin')?.value !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate) return gate;
  const { id } = await params;
  const patch = (await req.json()) as Partial<Ad>;
  const existing = await db.getAd(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const saved = await db.upsertAd({ ...existing, ...patch, id });
    return NextResponse.json(saved);
  } catch (e) {
    captureError(e, { hint: 'ad-patch' });
    return NextResponse.json({ error: 'Failed to update ad' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate) return gate;
  const { id } = await params;
  await db.deleteAd(id);
  return NextResponse.json({ ok: true });
}
