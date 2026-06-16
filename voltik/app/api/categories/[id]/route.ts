import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { descendantIds, wouldCreateCycle } from '@/lib/categoryTree';
import { cleanLine, cleanText, clip, LIMITS } from '@/lib/sanitize';
import { bustCategories } from '@/lib/cache';
import { audit } from '@/lib/audit';
import type { Category } from '@/lib/types';

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
  const cat = await db.getCategory(id);
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(cat);
}

export async function PUT(req: Request, ctx: Ctx) {
  const gate = await requireAdmin();
  if (gate) return gate;
  const { id } = await ctx.params;
  const existing = await db.getCategory(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const patch = (await req.json()) as Partial<Category>;
  const all = await db.listCategories();

  // Cycle protection + referential validation: parent must exist and not
  // sit under the node we're editing.
  if (patch.parent && patch.parent !== existing.parent) {
    if (wouldCreateCycle(id, patch.parent, all)) {
      return NextResponse.json({ error: 'Cannot move a category under one of its own descendants' }, { status: 400 });
    }
    if (!all.some(c => c.id === patch.parent)) {
      return NextResponse.json({ error: 'parent category not found' }, { status: 400 });
    }
  }

  if (patch.name  != null) patch.name  = clip(cleanLine(patch.name),  LIMITS.generic);
  if (patch.blurb != null) patch.blurb = clip(cleanText(patch.blurb), LIMITS.generic);

  const merged: Category = { ...existing, ...patch, id: existing.id, parent: patch.parent === undefined ? existing.parent : patch.parent };
  await db.upsertCategory(merged);
  bustCategories();
  await audit(req, 'category.update', { type: 'category', id: merged.id }, { fields: Object.keys(patch) });
  return NextResponse.json(merged);
}

export async function DELETE(req: Request, ctx: Ctx) {
  const gate = await requireAdmin();
  if (gate) return gate;
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const cascade = url.searchParams.get('cascade') === '1';

  const all = await db.listCategories();
  if (!all.some(c => c.id === id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const products = await db.listProducts();
  const affectedIds = descendantIds(id, all);
  const productsInSubtree = products.filter(p => affectedIds.includes(p.category));

  if (!cascade && (affectedIds.length > 1 || productsInSubtree.length > 0)) {
    return NextResponse.json({
      error: 'Category has children or products',
      childCount: affectedIds.length - 1,
      productCount: productsInSubtree.length,
      hint: 'Re-send DELETE with ?cascade=1 to remove the entire subtree. Affected products will be detached (their category set to null).'
    }, { status: 409 });
  }

  // Cascade: delete all categories in the subtree; detach affected products.
  for (const cid of affectedIds) await db.deleteCategory(cid);
  for (const p of productsInSubtree) await db.upsertProduct({ ...p, category: '' });
  bustCategories();
  await audit(req, 'category.delete', { type: 'category', id }, {
    cascade,
    removed: affectedIds.length,
    detachedProducts: productsInSubtree.length
  });

  return NextResponse.json({ ok: true, removed: affectedIds, detachedProducts: productsInSubtree.length });
}
