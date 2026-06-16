import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { bustProducts } from '@/lib/cache';
import { audit } from '@/lib/audit';
import { enrich } from '@/lib/reviews';
import { cleanLine, cleanText, LIMITS, clip } from '@/lib/sanitize';
import { containsEmoji } from '@/lib/auth';
import type { Product } from '@/lib/types';

async function requireAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  if (jar.get('voltik_admin')?.value !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Default page size when the caller doesn't specify. Hard ceiling at 200
// so a curious client can't grab the entire catalog with `?limit=99999`.
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 200;

/**
 * Public list. Supports filter (`category`, `q`), sort, and
 * cursor-based pagination via `cursor` + `limit`. The cursor is the
 * `id` of the last row from the previous page; we sort first so the
 * cursor is deterministic given the same query.
 *
 * Response shape:
 *   {
 *     products,           — current page
 *     count,              — page length (handy for the client meter)
 *     total,              — total matching rows (pre-pagination)
 *     nextCursor,         — null when there's no next page
 *   }
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const q = searchParams.get('q')?.toLowerCase();
  const sort = searchParams.get('sort') || 'featured';
  const cursor = searchParams.get('cursor');
  const limitRaw = parseInt(searchParams.get('limit') || '', 10);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : DEFAULT_LIMIT));

  let rows = await enrich(await db.listProducts());

  if (category && category !== 'all') rows = rows.filter(p => p.category === category);
  if (q) rows = rows.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));

  switch (sort) {
    case 'price-asc':  rows.sort((a, b) => a.price - b.price); break;
    case 'price-desc': rows.sort((a, b) => b.price - a.price); break;
    case 'rating':     rows.sort((a, b) => b.rating - a.rating); break;
    case 'newest':     rows.sort((a, b) => a.id < b.id ? 1 : -1); break;
    default:           rows.sort((a, b) => a.id < b.id ? 1 : -1); break;
  }

  const total = rows.length;

  // Cursor = id of the last item from the previous page. We resume
  // from the row immediately after, which keeps the iteration stable
  // even if the underlying list shifts between requests.
  let startIdx = 0;
  if (cursor) {
    const hit = rows.findIndex(p => p.id === cursor);
    startIdx = hit >= 0 ? hit + 1 : 0;
  }
  const page = rows.slice(startIdx, startIdx + limit);
  const nextCursor = (startIdx + limit) < rows.length ? page[page.length - 1]?.id ?? null : null;

  return NextResponse.json(
    { products: page, count: page.length, total, nextCursor },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    }
  );
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate) return gate;
  const body = (await req.json()) as Partial<Product>;

  if (!body.name || !body.category || typeof body.price !== 'number') {
    return NextResponse.json({ error: 'name, category and price are required' }, { status: 400 });
  }

  // Validate the category id refers to a real row — otherwise an admin
  // typo silently strands the product in a non-existent bucket.
  const categories = await db.listCategories();
  if (!categories.some(c => c.id === body.category)) {
    return NextResponse.json({ error: `category "${body.category}" does not exist` }, { status: 400 });
  }

  if (!Number.isFinite(body.price) || body.price < 0) {
    return NextResponse.json({ error: 'price must be a non-negative number' }, { status: 400 });
  }
  if (body.oldPrice != null) {
    if (!Number.isFinite(body.oldPrice) || body.oldPrice < 0) {
      return NextResponse.json({ error: 'oldPrice must be a non-negative number' }, { status: 400 });
    }
    if (body.oldPrice <= body.price) {
      return NextResponse.json({ error: 'oldPrice must be greater than price (no negative discounts)' }, { status: 400 });
    }
  }
  if (body.stock != null && (!Number.isFinite(body.stock) || body.stock < 0)) {
    return NextResponse.json({ error: 'stock must be a non-negative integer' }, { status: 400 });
  }

  // SKUs are an internal identifier — emoji + RTL marks here have caused
  // unicode-confusion bugs in inventory systems before, so block them.
  if (body.sku && containsEmoji(body.sku)) {
    return NextResponse.json({ error: 'SKU can\'t contain emoji.' }, { status: 400 });
  }

  // If the admin explicitly supplied an id, reject collisions with
  // existing rows so a typed-over id can't quietly overwrite an
  // unrelated SKU. (The unique index would catch this too, but the
  // pre-check returns a friendlier error message.)
  if (body.id) {
    const collision = await db.getProduct(body.id);
    if (collision) {
      return NextResponse.json({
        error: `A product with id "${body.id}" already exists (SKU ${collision.sku}). Choose a different id.`
      }, { status: 409 });
    }
  }

  // Auto-generate a fresh, collision-free id when the admin didn't
  // supply one. The 6-char timestamp slice can repeat across cold
  // starts, so we loop with an extra random suffix until the row
  // doesn't exist.
  let resolvedId = body.id;
  if (!resolvedId) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = `v-${Date.now().toString(36).slice(-6)}-${Math.random().toString(36).slice(2, 5)}`;
      const taken = await db.getProduct(candidate);
      if (!taken) { resolvedId = candidate; break; }
    }
    if (!resolvedId) {
      return NextResponse.json({ error: 'Could not generate a unique product id, try again.' }, { status: 500 });
    }
  }

  const product: Product = {
    id: resolvedId,
    name:        clip(cleanLine(body.name),               LIMITS.productName),
    category:    body.category,
    price:       Math.round(body.price * 100) / 100,
    oldPrice:    body.oldPrice,
    stock:       Math.max(0, Math.floor(body.stock ?? 0)),
    badge:       body.badge ? clip(cleanLine(body.badge), LIMITS.generic) : undefined,
    icon:        body.icon || 'box',
    brand:       clip(cleanLine(body.brand || 'Voltik'),  LIMITS.generic),
    sku:         clip(cleanLine(body.sku || `VLT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`), LIMITS.productSku),
    description: clip(cleanText(body.description || ''),  LIMITS.productDesc),
    features:    (body.features || []).filter(f => typeof f === 'string').map(f => clip(cleanLine(f), LIMITS.generic))
  };

  await db.upsertProduct(product);
  bustProducts();
  await audit(req, 'product.create', { type: 'product', id: product.id }, { name: product.name, price: product.price });
  return NextResponse.json(product, { status: 201 });
}
