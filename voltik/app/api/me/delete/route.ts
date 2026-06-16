import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clearUserSession, currentUser } from '@/lib/auth';
import { verifyPassword } from '@/lib/passwords';
import { captureError, log } from '@/lib/observability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/me/delete
 * Body: { password, confirm: "DELETE" }
 *
 * GDPR right-to-be-forgotten. Deletes the account AND scrubs PII from
 * the user's order history (we retain the rows for accounting and the
 * 7-year tax-law window, but the personal data is gone).
 */
export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { password, confirm } = await req.json();
  if (typeof password !== 'string' || !verifyPassword(password, u.passwordHash)) {
    return NextResponse.json({ error: 'Password is incorrect.' }, { status: 400 });
  }
  if (confirm !== 'DELETE') {
    return NextResponse.json({ error: 'Type DELETE to confirm.' }, { status: 400 });
  }

  try {
    const { orders, reviews } = await db.hardDeleteUser(u.id, u.email);
    await clearUserSession();
    log('info', 'gdpr-account-delete', {
      userId: u.id,
      ordersAnonymised: orders,
      reviewsDeleted: reviews
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    captureError(e, { hint: 'gdpr-delete', userId: u.id });
    return NextResponse.json({ error: 'Could not delete account — try again.' }, { status: 500 });
  }
}
