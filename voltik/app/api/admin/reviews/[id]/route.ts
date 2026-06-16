import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { captureError } from '@/lib/observability';
import type { Review } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  if (jar.get('voltik_admin')?.value !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/**
 * PATCH /api/admin/reviews/[id]
 * Body:
 *   { hidden: boolean }                              — show/hide
 *   { reply: { body, by } }                          — post or update brand reply
 *   { reply: null }                                  — remove brand reply
 *
 * DELETE — hard-remove the review entirely.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate) return gate;

  const { id } = await params;
  const body = await req.json() as { hidden?: boolean; reply?: { body: string; by: string } | null };

  try {
    const review = await db.getReview(id);
    if (!review) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });

    const next: Review = { ...review };
    if (typeof body.hidden === 'boolean') next.hidden = body.hidden;
    if (body.reply === null) {
      next.reply = undefined;
    } else if (body.reply && typeof body.reply.body === 'string' && body.reply.body.trim()) {
      next.reply = {
        body: body.reply.body.trim().slice(0, 4000),
        by: body.reply.by?.trim() || 'Voltik team',
        createdAt: review.reply?.createdAt || new Date().toISOString().slice(0, 10)
      };
    }

    await db.upsertReview(next);
    return NextResponse.json({ review: next });
  } catch (e) {
    captureError(e, { hint: 'admin-review-patch', reviewId: id });
    return NextResponse.json({ error: 'Could not save.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate) return gate;
  const { id } = await params;
  await db.deleteReview(id);
  return NextResponse.json({ ok: true });
}
