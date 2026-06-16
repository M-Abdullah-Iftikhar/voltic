import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { aggregate } from '@/lib/reviews';
import { screen } from '@/lib/contentFilter';
import { cleanLine, cleanText, stripHtml, LIMITS } from '@/lib/sanitize';
import type { Review } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/products/[id]/reviews — list visible reviews + aggregate stats. */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const all = await db.listReviewsForProduct(id);
  const reviews = all.filter(r => !r.hidden);
  return NextResponse.json({ reviews, ...aggregate(all) });
}

/** POST /api/products/[id]/reviews — write a review (auth required). */
export async function POST(req: Request, ctx: Ctx) {
  const { id: productId } = await ctx.params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'You must be signed in to review.' }, { status: 401 });

  const product = await db.getProduct(productId);
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

  // Verified-purchase gate: only users with a non-cancelled order containing
  // this product may post a review. Closes the "anyone can review anything" hole.
  const purchased = await db.hasPurchased(user.id, user.email, productId);
  if (!purchased) {
    return NextResponse.json({
      error: 'Only customers who have ordered this product can review it.'
    }, { status: 403 });
  }

  const body = await req.json();
  const rating = Number(body.rating);
  // Strip HTML + control chars + collapse whitespace at the boundary
  // so review copy in the DB stays plain text. React's default
  // escaping is the live rendering shield; this is defence-in-depth
  // for any surface that later recycles the content (OG images, RSS,
  // JSON-LD), and it keeps the DB free of `<script>` strings entirely.
  const title = cleanLine(stripHtml((body.title ?? '').toString()));
  const text  = cleanText(stripHtml((body.body  ?? '').toString()));

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
  }
  if (title.length < 2)                 return NextResponse.json({ error: 'Title is too short.' }, { status: 400 });
  if (text.length  < 4)                 return NextResponse.json({ error: 'Review body is too short.' }, { status: 400 });
  if (title.length > LIMITS.reviewTitle) return NextResponse.json({ error: `Title is too long (max ${LIMITS.reviewTitle} chars).` }, { status: 400 });
  if (text.length  > LIMITS.reviewBody)  return NextResponse.json({ error: `Review body is too long (max ${LIMITS.reviewBody} chars).` }, { status: 400 });

  // Profanity / spam filter on both fields.
  const titleCheck = screen(title);
  if (!titleCheck.ok) return NextResponse.json({ error: titleCheck.reason }, { status: 400 });
  const bodyCheck = screen(text);
  if (!bodyCheck.ok) return NextResponse.json({ error: bodyCheck.reason }, { status: 400 });

  const all = await db.listReviewsForProduct(productId);
  const existing = all.find(r => r.userId === user.id);

  const review: Review = {
    id: existing?.id || `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    productId,
    userId: user.id,
    userName: user.name,
    rating: Math.round(rating),
    title,
    body: text,
    createdAt: new Date().toISOString().slice(0, 10)
  };

  await db.upsertReview(review);
  return NextResponse.json({ review, updated: !!existing }, { status: existing ? 200 : 201 });
}

/** DELETE /api/products/[id]/reviews?reviewId=... — remove own review. */
export async function DELETE(req: Request, ctx: Ctx) {
  await ctx.params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const reviewId = url.searchParams.get('reviewId');
  if (!reviewId) return NextResponse.json({ error: 'reviewId required' }, { status: 400 });

  const all = await db.listReviews();
  const target = all.find(r => r.id === reviewId);
  if (!target) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  if (target.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await db.deleteReview(reviewId);
  return NextResponse.json({ ok: true });
}
