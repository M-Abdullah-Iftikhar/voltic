import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser, publicUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** PUT /api/me/cart — replace the user's cart with the supplied lines. */
export async function PUT(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!Array.isArray(body.cart)) {
    return NextResponse.json({ error: 'cart must be an array of { id, qty }' }, { status: 400 });
  }

  // Sanitise + de-dupe by id, drop non-positive quantities.
  const cleaned = (body.cart as { id: string; qty: number }[])
    .filter(l => l && typeof l.id === 'string' && Number.isFinite(l.qty) && l.qty > 0)
    .reduce<Record<string, number>>((acc, l) => {
      acc[l.id] = (acc[l.id] || 0) + l.qty;
      return acc;
    }, {});

  const saved = await db.setUserCart(u.id, Object.entries(cleaned).map(([id, qty]) => ({ id, qty })));
  return NextResponse.json({ user: publicUser(saved) });
}
