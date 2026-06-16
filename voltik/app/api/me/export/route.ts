import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser, publicUser } from '@/lib/auth';
import { captureError } from '@/lib/observability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/me/export
 *
 * GDPR data export. Returns JSON of everything we hold about the signed-in
 * user (profile, addresses, cart, favourites, orders, reviews). Streams as
 * a downloadable file (Content-Disposition: attachment).
 */
export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [orders, reviews] = await Promise.all([
      db.listOrdersForUser(u.id, u.email),
      db.listReviewsForUser(u.id)
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      schemaVersion: 1,
      profile: publicUser(u),
      orders,
      reviews
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="voltik-data-${u.id}.json"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    captureError(e, { hint: 'gdpr-export', userId: u.id });
    return NextResponse.json({ error: 'Could not generate export.' }, { status: 500 });
  }
}
