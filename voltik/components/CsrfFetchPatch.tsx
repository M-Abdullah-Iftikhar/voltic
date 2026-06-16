'use client';
import { useEffect } from 'react';

const CSRF_COOKIE = 'voltik_csrf';
const CSRF_HEADER = 'x-csrf-token';
const STATE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Mounts once at the top of the App Router tree and patches `window.fetch`
 * so every state-changing same-origin request quietly grows an
 * `x-csrf-token` header. Pulls the token from the `voltik_csrf` cookie
 * the middleware plants on the way in, so user code doesn't have to
 * know the cookie exists.
 *
 * Cross-origin and idempotent requests pass through untouched.
 */
export function CsrfFetchPatch() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const original = window.fetch;
    if ((original as { __voltikCsrfPatched?: boolean }).__voltikCsrfPatched) return;

    const patched: typeof fetch = async (input, init) => {
      const method = (init?.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : undefined) || 'GET').toUpperCase();
      if (!STATE_METHODS.has(method)) return original(input, init);

      // Only attach for same-origin URLs — never leak the CSRF token
      // to a third party.
      let url: string;
      if (typeof input === 'string')      url = input;
      else if (input instanceof URL)       url = input.toString();
      else                                  url = input.url;
      try {
        const resolved = new URL(url, window.location.origin);
        if (resolved.origin !== window.location.origin) return original(input, init);
      } catch { /* keep going — relative URL */ }

      const token = readCookie(CSRF_COOKIE);
      if (!token) return original(input, init);

      // Merge the header without clobbering whatever the caller passed.
      const headers = new Headers(init?.headers || (typeof input !== 'string' && !(input instanceof URL) ? input.headers : undefined));
      if (!headers.has(CSRF_HEADER)) headers.set(CSRF_HEADER, token);
      return original(input, { ...init, headers });
    };

    (patched as { __voltikCsrfPatched?: boolean }).__voltikCsrfPatched = true;
    window.fetch = patched;
    return () => { window.fetch = original; };
  }, []);

  return null;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const target = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) return decodeURIComponent(trimmed.slice(target.length));
  }
  return null;
}
