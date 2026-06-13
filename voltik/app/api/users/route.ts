import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, publicUser, setUserSession, validateSignup } from '@/lib/auth';
import type { User } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/users — register + sign-in. */
export async function POST(req: Request) {
  const body = await req.json();
  const err = validateSignup(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const email = body.email.trim().toLowerCase();
  const existing = await db.getUserByEmail(email);
  if (existing) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });

  const id = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const newUser: User = {
    id,
    email,
    name: body.name.trim(),
    passwordHash: hashPassword(body.password),
    createdAt: new Date().toISOString().slice(0, 10),
    cart: body.cart || [],
    favorites: body.favorites || []
  };
  await db.upsertUser(newUser);
  await setUserSession(id);

  return NextResponse.json({ user: publicUser(newUser) }, { status: 201 });
}
