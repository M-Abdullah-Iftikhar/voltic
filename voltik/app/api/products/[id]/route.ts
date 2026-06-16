import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { enrichOne } from '@/lib/reviews';
import { captureError, log } from '@/lib/observability';
import { cleanLine, cleanText, LIMITS, clip } from '@/lib/sanitize';
import { containsEmoji } from '@/lib/auth';
import { bustProducts } from '@/lib/cache';
import { audit } from '@/lib/audit';
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

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const product = await db.getProduct(id);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(await enrichOne(product), {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
  });
}

export async function PUT(req: Request, ctx: Ctx) {
  const gate = await requireAdmin();
  if (gate) return gate;
  const { id } = await ctx.params;
  const existing = await db.getProduct(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const patch = (await req.json()) as Partial<Product>;
  // Drop fields that may have leaked from older clients.
  delete (patch as any).rating;
  delete (patch as any).reviews;
  delete (patch as any).reviewsCount;

  // Clean + validate any string / numeric field the patch is touching.
  // Untouched fields fall back to the existing row.
  if (patch.name != null)        patch.name        = clip(cleanLine(patch.name),        LIMITS.productName);
  if (patch.brand != null)       patch.brand       = clip(cleanLine(patch.brand),       LIMITS.generic);
  if (patch.sku != null) {
    if (containsEmoji(patch.sku)) {
      return NextResponse.json({ error: 'SKU can\'t contain emoji.' }, { status: 400 });
    }
    patch.sku = clip(cleanLine(patch.sku), LIMITS.productSku);
  }
  if (patch.description != null) patch.description = clip(cleanText(patch.description), LIMITS.productDesc);
  if (patch.badge != null)       patch.badge       = patch.badge ? clip(cleanLine(patch.badge), LIMITS.generic) : undefined;
  if (patch.features != null)    patch.features    = patch.features.filter(f => typeof f === 'string').map(f => clip(cleanLine(f), LIMITS.generic));

  if (patch.category != null) {
    const categories = await db.listCategories();
    if (!categories.some(c => c.id === patch.category)) {
      return NextResponse.json({ error: `category "${patch.category}" does not exist` }, { status: 400 });
    }
  }
  if (patch.price != null) {
    if (!Number.isFinite(patch.price) || patch.price < 0) {
      return NextResponse.json({ error: 'price must be a non-negative number' }, { status: 400 });
    }
    patch.price = Math.round(patch.price * 100) / 100;
  }
  if (patch.stock != null) {
    if (!Number.isFinite(patch.stock) || patch.stock < 0) {
      return NextResponse.json({ error: 'stock must be a non-negative integer' }, { status: 400 });
    }
    patch.stock = Math.max(0, Math.floor(patch.stock));
  }
  // Compare oldPrice to whatever price the merged row will land on.
  const effectivePrice = patch.price ?? existing.price;
  if (patch.oldPrice !== undefined) {
    if (patch.oldPrice === null) {
      patch.oldPrice = undefined;
    } else if (!Number.isFinite(patch.oldPrice) || patch.oldPrice < 0) {
      return NextResponse.json({ error: 'oldPrice must be a non-negative number' }, { status: 400 });
    } else if (patch.oldPrice <= effectivePrice) {
      return NextResponse.json({ error: 'oldPrice must be greater than price (no negative discounts)' }, { status: 400 });
    }
  }

  const merged: Product = { ...existing, ...patch, id: existing.id };
  await db.upsertProduct(merged);
  bustProducts();
  await audit(req, 'product.update', { type: 'product', id: merged.id }, { fields: Object.keys(patch) });

  // Drain back-in-stock subscribers if we just transitioned 0 → positive.
  // Email delivery itself is out of scope — we log the queue so the admin
  // can plug a sender in later without losing requests.
  if ((existing.stock ?? 0) <= 0 && (merged.stock ?? 0) > 0) {
    try {
      const drained = await db.drainBackInStock(merged.id);
      if (drained.length) {
        log('info', 'back-in-stock-drain', {
          productId: merged.id,
          name: merged.name,
          count: drained.length,
          emails: drained.map(d => d.email)
        });
      }
    } catch (e) {
      captureError(e, { hint: 'back-in-stock-drain', productId: merged.id });
    }
  }

  return NextResponse.json(merged);
}

export async function DELETE(req: Request, ctx: Ctx) {
  const gate = await requireAdmin();
  if (gate) return gate;
  const { id } = await ctx.params;
  await db.deleteProduct(id);
  bustProducts();
  await audit(req, 'product.delete', { type: 'product', id });
  return NextResponse.json({ ok: true });
}
