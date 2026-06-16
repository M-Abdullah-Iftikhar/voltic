import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Quotes a CSV cell: doubles internal quotes and wraps if comma/quote/newline present. */
function csvCell(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * GET /api/admin/products/export
 *
 * Streams every product as CSV. Each row exactly mirrors the columns
 * a bulk-import endpoint would expect later, so this doubles as a
 * round-trip template.
 */
export async function GET() {
  const jar = await cookies();
  if (jar.get('voltik_admin')?.value !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const products = await db.listProducts();
  const header = [
    'id', 'slug', 'name', 'category', 'brand', 'sku',
    'price', 'oldPrice', 'stock', 'icon', 'badge', 'description', 'features'
  ];
  const rows = products.map(p => [
    p.id,
    p.slug || '',
    p.name,
    p.category,
    p.brand,
    p.sku,
    p.price.toFixed(2),
    p.oldPrice != null ? p.oldPrice.toFixed(2) : '',
    String(p.stock),
    p.icon,
    p.badge || '',
    p.description,
    (p.features || []).join(' | ')
  ].map(csvCell).join(','));

  const csv = [header.join(','), ...rows].join('\n');
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="voltik-products-${date}.csv"`,
      'Cache-Control': 'no-store'
    }
  });
}
