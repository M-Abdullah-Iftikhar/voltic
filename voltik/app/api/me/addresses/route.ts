import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import type { Address } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function genId(): string {
  return `addr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function validate(input: Partial<Address>): string | null {
  if (!input.label?.trim())     return 'Label is required.';
  if (!input.recipient?.trim()) return 'Recipient is required.';
  if (!input.street?.trim())    return 'Street is required.';
  if (!input.city?.trim())      return 'City is required.';
  if (!input.country?.trim())   return 'Country is required.';
  if (!input.phone?.trim())     return 'Phone is required.';
  return null;
}

/** GET — list the signed-in user's saved addresses. */
export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ addresses: u.addresses || [] });
}

/** POST — add a new address. Setting isDefault clears the flag on the others. */
export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as Partial<Address>;
  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const existing = u.addresses || [];
  const makeDefault = !!body.isDefault || existing.length === 0;

  const next: Address = {
    id: genId(),
    label: body.label!.trim(),
    recipient: body.recipient!.trim(),
    street: body.street!.trim(),
    city: body.city!.trim(),
    country: body.country!.trim(),
    phone: body.phone!.trim(),
    isDefault: makeDefault
  };

  const cleared = existing.map(a => makeDefault ? { ...a, isDefault: false } : a);
  const updated = await db.upsertUser({ ...u, addresses: [...cleared, next] });
  return NextResponse.json({ addresses: updated.addresses || [] }, { status: 201 });
}

/** PUT — replace one address by id, or repoint the default. */
export async function PUT(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as Partial<Address>;
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const existing = u.addresses || [];
  if (!existing.find(a => a.id === body.id)) {
    return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
  }

  const makeDefault = !!body.isDefault;
  const updatedList = existing.map(a =>
    a.id === body.id
      ? { ...a, ...body, isDefault: makeDefault } as Address
      : makeDefault ? { ...a, isDefault: false } : a
  );

  const updated = await db.upsertUser({ ...u, addresses: updatedList });
  return NextResponse.json({ addresses: updated.addresses || [] });
}

/** DELETE — remove by ?id=. If we just removed the default, promote the first remaining. */
export async function DELETE(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id query param is required' }, { status: 400 });

  const existing = u.addresses || [];
  const target = existing.find(a => a.id === id);
  if (!target) return NextResponse.json({ error: 'Address not found.' }, { status: 404 });

  let remaining = existing.filter(a => a.id !== id);
  if (target.isDefault && remaining.length > 0) {
    remaining = remaining.map((a, i) => i === 0 ? { ...a, isDefault: true } : a);
  }

  const updated = await db.upsertUser({ ...u, addresses: remaining });
  return NextResponse.json({ addresses: updated.addresses || [] });
}
