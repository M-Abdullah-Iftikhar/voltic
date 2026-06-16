import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { clientIp, rateLimit, rateLimitHeaders } from '@/lib/rateLimit';
import { captureError } from '@/lib/observability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET — admin-only: list every newsletter subscriber. */
export async function GET() {
  const jar = await cookies();
  if (jar.get('voltik_admin')?.value !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const subscribers = await db.listSubscribers();
  return NextResponse.json({ subscribers, count: subscribers.length });
}

/** POST — public: subscribe an email. Idempotent (re-subscribing is a no-op). */
export async function POST(req: Request) {
  // 5 subscribe attempts per IP per 5 minutes — keeps spammers off the list.
  const ip = clientIp(req);
  const limit = rateLimit(`subscribe:${ip}`, 5, 5 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests — try again in a few minutes.' },
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  const { email, source } = await req.json();
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400, headers: rateLimitHeaders(limit) });
  }

  try {
    const sub = await db.addSubscriber(email, typeof source === 'string' ? source : undefined);
    return NextResponse.json({ ok: true, subscriber: sub }, { headers: rateLimitHeaders(limit) });
  } catch (e) {
    captureError(e, { hint: 'subscriber-add' });
    return NextResponse.json({ error: 'Could not subscribe — please try again.' }, { status: 500, headers: rateLimitHeaders(limit) });
  }
}
