import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser, hashPassword, publicUser, validateEmail, verifyPassword } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/me — current user's profile incl. cart + favorites. */
export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ user: publicUser(u) });
}

/** PATCH /api/me — update name / email / password. */
export async function PATCH(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const patch: Partial<typeof u> = {};

  if (typeof body.name === 'string') {
    const name = body.name.trim();
    if (name.length < 2) return NextResponse.json({ error: 'Name is too short.' }, { status: 400 });
    patch.name = name;
  }

  if (typeof body.email === 'string') {
    const email = body.email.trim().toLowerCase();
    if (!validateEmail(email)) return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    if (email !== u.email) {
      const taken = await db.getUserByEmail(email);
      if (taken && taken.id !== u.id) return NextResponse.json({ error: 'Email already in use.' }, { status: 409 });
    }
    patch.email = email;
  }

  if (typeof body.newPassword === 'string' && body.newPassword.length) {
    if (typeof body.currentPassword !== 'string' || !verifyPassword(body.currentPassword, u.passwordHash)) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    }
    if (body.newPassword.length < 6) return NextResponse.json({ error: 'New password must be 6+ characters.' }, { status: 400 });
    patch.passwordHash = hashPassword(body.newPassword);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const saved = await db.upsertUser({ ...u, ...patch });
  return NextResponse.json({ user: publicUser(saved) });
}
