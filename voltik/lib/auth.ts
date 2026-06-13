import { cookies } from 'next/headers';
import { db } from './db';
import type { PublicUser, User } from './types';

export { hashPassword, verifyPassword } from './passwords';

export const USER_COOKIE = 'voltik_user';

/* ── Session helpers (cookie-backed) ──────────────────────────── */

export async function setUserSession(userId: string) {
  const jar = await cookies();
  jar.set(USER_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30   // 30 days
  });
}

export async function clearUserSession() {
  const jar = await cookies();
  jar.delete(USER_COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const id = jar.get(USER_COOKIE)?.value;
  if (!id) return null;
  return db.getUser(id);
}

export function publicUser(u: User | null): PublicUser | null {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}

/* ── Validation ───────────────────────────────────────────────── */

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateSignup(input: { email?: string; name?: string; password?: string }): string | null {
  if (!input.email || !validateEmail(input.email)) return 'Please enter a valid email address.';
  if (!input.name || input.name.trim().length < 2) return 'Name must be at least 2 characters.';
  if (!input.password || input.password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}
