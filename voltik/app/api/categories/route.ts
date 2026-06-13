import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CATEGORY_GRADIENTS } from '@/lib/categoryTree';
import type { Category } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await db.listCategories();
  return NextResponse.json({ categories: rows, count: rows.length });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Category>;
  if (!body.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const all = await db.listCategories();

  // Auto-generate slug-ish id if missing or already taken.
  const baseId = (body.id || body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `cat-${Date.now().toString(36)}`;
  let id = baseId;
  let n = 1;
  while (all.some(c => c.id === id)) { id = `${baseId}-${n++}`; }

  const parent = body.parent || null;
  if (parent && !all.some(c => c.id === parent)) {
    return NextResponse.json({ error: 'parent category not found' }, { status: 400 });
  }

  const category: Category = {
    id,
    parent,
    name: body.name,
    icon: body.icon || 'box',
    blurb: body.blurb || '',
    gradient: body.gradient || CATEGORY_GRADIENTS[0].value
  };

  await db.upsertCategory(category);
  return NextResponse.json(category, { status: 201 });
}
