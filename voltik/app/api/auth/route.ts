import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

const ADMIN_USER = process.env.ADMIN_USER || 'arizz@gmail.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'arizz123#';

export async function POST(req: Request) {
  const { username, password, action } = await req.json();
  const jar = await cookies();

  if (action === 'logout') {
    jar.delete('voltik_admin');
    return NextResponse.json({ ok: true });
  }

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    jar.set('voltik_admin', '1', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8
    });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}

export async function GET() {
  const jar = await cookies();
  const authed = jar.get('voltik_admin')?.value === '1';
  return NextResponse.json({ authed });
}
