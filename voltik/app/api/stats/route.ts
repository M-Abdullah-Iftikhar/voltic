import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Admin-only dashboard rollup. Switched to `db.computeAdminStats`
 *  which runs a single `$facet` aggregation instead of loading every
 *  order into memory. */
export async function GET() {
  const jar = await cookies();
  if (jar.get('voltik_admin')?.value !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const stats = await db.computeAdminStats();
  return NextResponse.json(stats);
}
