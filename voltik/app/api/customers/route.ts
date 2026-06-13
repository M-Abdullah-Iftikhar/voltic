import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await db.listCustomers();
  return NextResponse.json({ customers: rows, count: rows.length });
}
