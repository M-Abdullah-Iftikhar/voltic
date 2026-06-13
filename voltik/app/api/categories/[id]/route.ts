import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { descendantIds, wouldCreateCycle } from '@/lib/categoryTree';
import type { Category } from '@/lib/types';

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
  const { id } = await ctx.params;
  const existing = await db.getCategory(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const patch = (await req.json()) as Partial<Category>;
  const all = await db.listCategories();

  // Cycle protection: prevent setting a parent that is a descendant of this node.
  if (patch.parent && patch.parent !== existing.parent) {
    if (wouldCreateCycle(id, patch.parent, all)) {
      return NextResponse.json({ error: 'Cannot move a category under one of its own descendants' }, { status: 400 });
    }
    if (!all.some(c => c.id === patch.parent)) {
      return NextResponse.json({ error: 'parent category not found' }, { status: 400 });
    }
  }

  const merged: Category = { ...existing, ...patch, id: existing.id, parent: patch.parent === undefined ? existing.parent : patch.parent };
  await db.upsertCategory(merged);
  return NextResponse.json(merged);
}

export async function DELETE(req: Request, ctx: Ctx) {
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

  return NextResponse.json({ ok: true, removed: affectedIds, detachedProducts: productsInSubtree.length });
}
