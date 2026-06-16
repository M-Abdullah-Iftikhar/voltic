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

const PLACEMENTS: Ad['placement'][] = ['hero', 'rotator', 'bento', 'banner'];

/** Admin list — returns every ad regardless of active/date window so the
 *  console can show inactive + expired rows for editing. */
export async function GET() {
  const gate = await requireAdmin();
  if (gate) return gate;
  const ads = await db.listAds();
  return NextResponse.json({ ads, count: ads.length });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate) return gate;

  const body = (await req.json()) as Partial<Ad>;
  if (!body.headline || !body.ctaLabel || !body.ctaHref) {
    return NextResponse.json({ error: 'headline, ctaLabel and ctaHref are required' }, { status: 400 });
  }
  const placement = (body.placement && PLACEMENTS.includes(body.placement)) ? body.placement : 'rotator';

  const ad: Ad = {
    id: body.id || `ad-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    headline: body.headline,
    tagline: body.tagline ?? '',
    ctaLabel: body.ctaLabel,
    ctaHref: body.ctaHref,
    productId: body.productId || undefined,
    placement,
    gradient: body.gradient || 'from-brand to-brand2',
    startsAt: body.startsAt || undefined,
    endsAt: body.endsAt || undefined,
    priority: typeof body.priority === 'number' ? body.priority : 0,
    active: body.active ?? true,
    createdAt: body.createdAt || new Date().toISOString().slice(0, 10)
  };

  try {
    const saved = await db.upsertAd(ad);
    return NextResponse.json(saved, { status: 201 });
  } catch (e) {
    captureError(e, { hint: 'ad-upsert' });
    return NextResponse.json({ error: 'Failed to save ad' }, { status: 500 });
  }
}
