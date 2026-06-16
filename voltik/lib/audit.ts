import { cookies, headers } from 'next/headers';
import { db } from './db';
import { captureError } from './observability';

/**
 * Best-effort admin audit logger. Each call records a single row in
 * the `auditLog` collection. We never throw — a failure here
 * shouldn't block the underlying mutation, so the caller can
 * `audit(...)` without an `await` if they want pure fire-and-forget.
 *
 * Actor is best-effort too: we don't have admin emails on the cookie
 * (the admin login route just plants `voltik_admin=1`), so until the
 * "multiple admin users" task lands we record the literal `admin`
 * unless the caller passes an override.
 */
export async function audit(
  req: Request,
  action: string,
  target?: { type?: string; id?: string },
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    const jar = await cookies();
    const isAdmin = jar.get('voltik_admin')?.value === '1';
    const actor = isAdmin ? (process.env.ADMIN_USER || 'admin') : 'system';
    const h = await headers();
    // x-forwarded-for is what Vercel + most reverse proxies use; the
    // first hop is the client. Fall back to direct remote address if
    // absent (mostly local dev).
    const ip = (h.get('x-forwarded-for') || h.get('x-real-ip') || '')
      .split(',')[0]
      .trim() || undefined;
    const userAgent = h.get('user-agent') || undefined;
    await db.appendAuditEvent({
      actor,
      action,
      targetType: target?.type,
      targetId: target?.id,
      meta,
      ip,
      userAgent
    });
  } catch (e) {
    captureError(e, { hint: 'audit-log', action });
  }
}
