/**
 * In-memory fixed-window rate limiter.
 *
 * Caveat for production at scale: each serverless instance has its own Map,
 * so the limit is per-instance, not global. For real distributed rate limits
 * swap the storage for Upstash Redis (`@upstash/ratelimit`) — the public API
 * here is intentionally the same shape so callers don't change.
 */

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

// Janitor: prune expired buckets so the Map can't grow unbounded. Runs every
// 60s and unrefs so the timer doesn't keep the process alive in tests.
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, b] of store.entries()) {
      if (b.resetAt < now) store.delete(k);
    }
  }, 60_000);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (timer as any).unref?.();
}

export type RateLimitResult = {
  ok: boolean;
  /** How many calls remain in this window. */
  remaining: number;
  /** Milliseconds until the window resets. */
  resetIn: number;
  /** Max calls allowed per window. */
  limit: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetIn: windowMs, limit };
  }

  bucket.count += 1;
  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetIn: bucket.resetAt - now,
    limit
  };
}

/** Best-effort IP extraction from a Next.js Request. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

/** Standard response headers for rate-limited endpoints. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit':     String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset':     String(Math.ceil(result.resetIn / 1000))
  };
}
