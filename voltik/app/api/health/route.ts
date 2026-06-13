import { NextResponse } from 'next/server';
import { checkHealth } from '@/lib/mongo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/health — diagnostic endpoint. Hit this from your browser
 *  on Vercel to see exactly which env var or network rule is wrong.
 *  Returns 200 when healthy, 503 otherwise. */
export async function GET() {
  const report = await checkHealth();
  return NextResponse.json(report, { status: report.ok ? 200 : 503 });
}
