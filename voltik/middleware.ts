import { NextResponse, type NextRequest } from 'next/server';

/**
 * Combined gate + edge-side defences:
 *
 *  - `/admin/*`   → requires `voltik_admin` session cookie
 *  - `/account/*` → requires `voltik_user`  session cookie
 *  - `/api/*`     → CORS allow-list + CSRF double-submit check for
 *                   state-changing methods (POST / PUT / PATCH / DELETE)
 *  - every navigation → drops a fresh `voltik_csrf` cookie so the
 *                       client can echo it back on the next mutation
 *
 * The middleware can't talk to Mongo (Edge runtime), so the CSRF token
 * is just a high-entropy random value compared via a constant-time loop.
 * That gives us double-submit semantics without needing a server-side
 * session table.
 */

const CSRF_COOKIE = 'voltik_csrf';
const CSRF_HEADER = 'x-csrf-token';
const STATE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Routes that legitimately get hit before the client has a CSRF cookie
 *  to echo back — bootstrap reads + the first signup. We keep this set
 *  intentionally tiny. */
const CSRF_EXEMPT = new Set([
  '/api/session',           // login / logout (bootstrap)
  '/api/users',             // signup
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/subscribers',       // newsletter + drop-event reservation
  '/api/health'
]);

function isSameOriginRequest(req: NextRequest): boolean {
  const host = req.headers.get('host');
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  if (!origin && !referer) return true; // same-origin browser nav
  try {
    if (origin) {
      const u = new URL(origin);
      return u.host === host;
    }
    if (referer) {
      const u = new URL(referer);
      return u.host === host;
    }
  } catch { /* malformed */ }
  return false;
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Generate a 24-byte random base64url token using the Edge Web Crypto API. */
function newCsrfToken(): string {
  const buf = new Uint8Array(24);
  crypto.getRandomValues(buf);
  return btoa(String.fromCharCode(...buf)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* ── /api/* — CORS + CSRF ─────────────────────────────────── */
  if (pathname.startsWith('/api/')) {
    // CORS allow-list — same-origin only. Cross-origin browser fetches
    // get rejected at the preflight stage by simply not echoing
    // Access-Control-Allow-Origin.
    if (!isSameOriginRequest(req)) {
      return NextResponse.json(
        { error: 'Cross-origin requests are not permitted.' },
        { status: 403 }
      );
    }

    // CSRF double-submit. Methods that change state must include a
    // matching token in the header. Exempt the small bootstrap set
    // above so first-time visitors can sign in / sign up.
    if (STATE_METHODS.has(req.method) && !CSRF_EXEMPT.has(pathname)) {
      const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
      const headerToken = req.headers.get(CSRF_HEADER);
      if (!cookieToken || !headerToken || !constantTimeEq(cookieToken, headerToken)) {
        return NextResponse.json(
          { error: 'CSRF token missing or mismatched.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  }

  /* ── /admin/* and /account/* — gated by auth cookies ─────── */
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (req.cookies.get('voltik_admin')?.value === '1') return withCsrfCookie(NextResponse.next(), req);
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/account')) {
    if (req.cookies.get('voltik_user')?.value) return withCsrfCookie(NextResponse.next(), req);
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Every other navigation also gets the CSRF cookie planted so the
  // first state-changing call from the client succeeds.
  return withCsrfCookie(NextResponse.next(), req);
}

function withCsrfCookie(res: NextResponse, req: NextRequest): NextResponse {
  if (!req.cookies.get(CSRF_COOKIE)?.value) {
    res.cookies.set(CSRF_COOKIE, newCsrfToken(), {
      // Readable from JS so the client can echo it back as a header.
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    });
  }
  return res;
}

export const config = {
  // Match every non-static path; the function decides what to do per
  // pathname. Static assets (_next/static, favicon, etc.) are excluded
  // so the security headers come from next.config.mjs headers() instead.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'
  ]
};
