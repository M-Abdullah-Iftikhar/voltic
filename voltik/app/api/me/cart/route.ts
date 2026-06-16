import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser, publicUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cap per-line quantity so a runaway client (or hand-crafted request)
// can't insert a 9-digit qty into Mongo.
const MAX_QTY_PER_LINE = 99;

/** PUT /api/me/cart — replace the user's cart with the supplied lines. */
export async function PUT(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!Array.isArray(body.cart)) {
    return NextResponse.json({ error: 'cart must be an array of { id, qty }' }, { status: 400 });
  }

  // Sanitise + de-dupe by id, drop non-positive quantities, clamp the
  // top end. The `Math.min` step keeps the request body honest even if
  // an attacker forges {qty: 1e9}.
  const cleaned = (body.cart as { id: string; qty: number }[])
    .filter(l => l && typeof l.id === 'string' && Number.isFinite(l.qty) && l.qty > 0)
    .reduce<Record<string, number>>((acc, l) => {
      const next = (acc[l.id] || 0) + l.qty;
      acc[l.id] = Math.min(MAX_QTY_PER_LINE, next);
      return acc;
    }, {});

  // Verify every id corresponds to a real product so a stale tab
  // doesn't quietly persist phantom references.
  const knownIds = await db.filterKnownProductIds(Object.keys(cleaned));
  const valid = knownIds.map(id => ({ id, qty: cleaned[id] }));

  const saved = await db.setUserCart(u.id, valid);
  return NextResponse.json({ user: publicUser(saved) });
}
