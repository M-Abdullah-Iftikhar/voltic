import { NextResponse, type NextRequest } from 'next/server';

/** Two gates:
 *  - `/admin/*`   → requires the `voltik_admin`  session cookie
 *  - `/account/*` → requires the `voltik_user`   session cookie
 *  Login pages remain public. Unauth visitors get bounced with ?next= preserved.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (req.cookies.get('voltik_admin')?.value === '1') return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/account')) {
    if (req.cookies.get('voltik_user')?.value) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*']
};
