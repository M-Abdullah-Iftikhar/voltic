/**
 * Central error-capture hook.
 *
 * Today: structured console.error.
 * To wire Sentry (one-minute swap):
 *   1. `npm install @sentry/nextjs`
 *   2. Set the `SENTRY_DSN` env var on Vercel
 *   3. Replace the body of `captureError` with:
 *        import * as Sentry from '@sentry/nextjs';
 *        Sentry.captureException(error, { extra: context, tags });
 *   4. Add `sentry.client.config.ts` / `sentry.server.config.ts` per the
 *      @sentry/nextjs setup wizard.
 *
 * Keeping this indirection means feature code calls `captureError(e, ctx)`
 * once and never has to know how observability is wired.
 */

type ErrorContext = Record<string, unknown>;
type Tags = Record<string, string>;

export function captureError(
  error: unknown,
  context?: ErrorContext,
  tags?: Tags
): void {
  const tag = '[voltik]';
  const tagStr = tags ? ` ${JSON.stringify(tags)}` : '';
  if (error instanceof Error) {
    console.error(`${tag}${tagStr} ${error.name}: ${error.message}`);
    if (error.stack) console.error(error.stack);
    if (context) console.error('context:', context);
  } else {
    console.error(`${tag}${tagStr}`, error, context || '');
  }
}

/**
 * Structured info/warn log. Same call site survives a future swap to a
 * proper sink (Logtail, Axiom, Datadog) — see captureError for the pattern.
 */
export function log(level: 'info' | 'warn', event: string, data?: ErrorContext): void {
  const line = `[voltik:${level}] ${event}`;
  const out = level === 'warn' ? console.warn : console.log;
  if (data) out(line, JSON.stringify(data));
  else      out(line);
}

/** Wrap an async handler to capture + rethrow. */
export async function withErrorCapture<T>(
  fn: () => Promise<T>,
  context?: ErrorContext,
  tags?: Tags
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    captureError(e, context, tags);
    throw e;
  }
}
