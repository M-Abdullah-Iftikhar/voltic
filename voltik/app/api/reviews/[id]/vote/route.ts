import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { captureError } from '@/lib/observability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/reviews/[id]/vote { kind: 'helpful' | 'notHelpful' }
 *
 * Toggle a helpfulness vote on a review. Auth required so the count can't
 * be juiced by anonymous mashing. Tapping the same bucket twice removes
 * the vote; switching buckets moves it.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Sign in to vote.' }, { status: 401 });

  const { id } = await params;
  const { kind } = await req.json();
  if (kind !== 'helpful' && kind !== 'notHelpful') {
    return NextResponse.json({ error: 'kind must be helpful or notHelpful.' }, { status: 400 });
  }

  try {
    const review = await db.getReview(id);
    if (!review) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    if (review.userId === u.id) {
      return NextResponse.json({ error: 'You can\'t vote on your own review.' }, { status: 400 });
    }
    const updated = await db.voteOnReview(id, u.id, kind);
    return NextResponse.json({
      ok: true,
      counts: {
        helpful: updated?.helpfulCount    || 0,
        notHelpful: updated?.notHelpfulCount || 0
      },
      myVote:
        updated?.helpfulVoters?.includes(u.id)    ? 'helpful'
      : updated?.notHelpfulVoters?.includes(u.id) ? 'notHelpful'
      : null
    });
  } catch (e) {
    captureError(e, { hint: 'review-vote', reviewId: id });
    return NextResponse.json({ error: 'Could not record vote.' }, { status: 500 });
  }
}
