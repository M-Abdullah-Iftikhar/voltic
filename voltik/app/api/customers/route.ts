import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Customer PII is admin-only. Customers see only their own profile via `/api/me`. */
export async function GET() {
  const jar = await cookies();
  if (jar.get('voltik_admin')?.value !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rows = await db.listCustomers();
  return NextResponse.json({ customers: rows, count: rows.length });
}
