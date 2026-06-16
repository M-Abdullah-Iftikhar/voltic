import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/search?q=...
 *
 * Lightweight autocomplete: top product + category matches for the query.
 * In-memory match is fine at our catalog size; if it ever blows past 5k
 * SKUs, swap the substring scan for a Mongo $text index.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  if (!q || q.length < 2) {
    return NextResponse.json({ products: [], categories: [] });
  }

  const [allProducts, allCategories] = await Promise.all([db.listProducts(), db.listCategories()]);

  // Rank: name prefix > name contains > sku/brand contains > description contains.
  const scored = allProducts
    .map(p => {
      const name = p.name.toLowerCase();
      let score = 0;
      if (name.startsWith(q))                                    score += 100;
      else if (name.includes(q))                                 score += 60;
      if (p.sku.toLowerCase().includes(q))                       score += 40;
      if (p.brand.toLowerCase().includes(q))                     score += 30;
      if (p.description.toLowerCase().includes(q))               score += 10;
      return { p, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ p }) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      icon: p.icon,
      price: p.price,
      stock: p.stock
    }));

  const categories = allCategories
    .filter(c => c.name.toLowerCase().includes(q))
    .slice(0, 4)
    .map(c => ({ id: c.id, name: c.name, icon: c.icon }));

  return NextResponse.json(
    { products: scored, categories },
    {
      // Short SWR window — the search box is request-deduped by the
      // debounce already; this just lets the same keystroke from two
      // tabs reuse the edge cache.
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120'
      }
    }
  );
}
