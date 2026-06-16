import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { CATEGORY_GRADIENTS } from '@/lib/categoryTree';
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

/** Public list. Cached at the edge for 5 minutes with stale-while-revalidate so
 *  the storefront's category sidebar doesn't hit Mongo on every browse. */
export async function GET() {
  const rows = await db.listCategories();
  return NextResponse.json(
    { categories: rows, count: rows.length },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    }
  );
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate) return gate;
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
    name:  clip(cleanLine(body.name), LIMITS.generic),
    icon:  body.icon || 'box',
    blurb: clip(cleanText(body.blurb || ''), LIMITS.generic),
    gradient: body.gradient || CATEGORY_GRADIENTS[0].value
  };

  await db.upsertCategory(category);
  bustCategories();
  await audit(req, 'category.create', { type: 'category', id: category.id }, { name: category.name });
  return NextResponse.json(category, { status: 201 });
}
