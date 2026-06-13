import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enrich } from '@/lib/reviews';
import type { Product } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const q = searchParams.get('q')?.toLowerCase();
  const sort = searchParams.get('sort') || 'featured';

  let rows = await enrich(await db.listProducts());

  if (category && category !== 'all') rows = rows.filter(p => p.category === category);
  if (q) rows = rows.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));

  switch (sort) {
    case 'price-asc':  rows.sort((a, b) => a.price - b.price); break;
    case 'price-desc': rows.sort((a, b) => b.price - a.price); break;
    case 'rating':     rows.sort((a, b) => b.rating - a.rating); break;
    case 'newest':     rows.sort((a, b) => a.id < b.id ? 1 : -1); break;
  }
  return NextResponse.json({ products: rows, count: rows.length });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Product>;

  if (!body.name || !body.category || typeof body.price !== 'number') {
    return NextResponse.json({ error: 'name, category and price are required' }, { status: 400 });
  }

  const product: Product = {
    id: body.id || `v-${Date.now().toString().slice(-6)}`,
    name: body.name,
    category: body.category,
    price: body.price,
    oldPrice: body.oldPrice,
    stock: body.stock ?? 0,
    badge: body.badge,
    icon: body.icon || 'box',
    brand: body.brand || 'Voltik',
    sku: body.sku || `VLT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    description: body.description || '',
    features: body.features || []
  };

  await db.upsertProduct(product);
  return NextResponse.json(product, { status: 201 });
}
