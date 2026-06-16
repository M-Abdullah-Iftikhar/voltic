import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  if (jar.get('voltik_admin')?.value !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const gate = await requireAdmin();
  if (gate) return gate;
  const { code } = await params;
  await db.deletePromo(code);
  return NextResponse.json({ ok: true });
}
