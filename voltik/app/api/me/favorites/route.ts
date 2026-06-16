import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser, publicUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** PUT /api/me/favorites — replace the user's favorite list. */
export async function PUT(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!Array.isArray(body.favorites)) {
    return NextResponse.json({ error: 'favorites must be an array of product ids' }, { status: 400 });
  }

  const candidates = (body.favorites as unknown[]).filter((x): x is string => typeof x === 'string');
  // Drop ids that no longer match a real product.
  const ids = await db.filterKnownProductIds(candidates);
  const saved = await db.setUserFavorites(u.id, ids);
  return NextResponse.json({ user: publicUser(saved) });
}

/**
 * POST /api/me/favorites — atomic toggle for a single product.
 * Body: `{ productId: string, action?: 'add' | 'remove' }`.
 * Solves the "two tabs racing on PUT" issue by routing through
 * `$addToSet` / `$pull`.
 */
export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as { productId?: string; action?: 'add' | 'remove' } | null;
  if (!body || typeof body.productId !== 'string') {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }
  const action = body.action === 'remove' ? 'remove' : 'add';

  // Validate the id corresponds to a real product before touching the
  // user record — keeps the favorites array clean.
  const [known] = await db.filterKnownProductIds([body.productId]);
  if (!known) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const saved = action === 'add'
    ? await db.addFavorite(u.id, known)
    : await db.removeFavorite(u.id, known);

  return NextResponse.json({ user: publicUser(saved), action });
}
