import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser, publicUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** PUT /api/me/favorites — replace the user's favorite list. */
export async function PUT(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!Array.isArray(body.favorites)) {
    return NextResponse.json({ error: 'favorites must be an array of product ids' }, { status: 400 });
  }

  const ids = (body.favorites as unknown[]).filter((x): x is string => typeof x === 'string');
  const saved = await db.setUserFavorites(u.id, ids);
  return NextResponse.json({ user: publicUser(saved) });
}
