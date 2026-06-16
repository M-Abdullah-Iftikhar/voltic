/**
 * Client-only helpers for persisting the currently-applied promo code
 * across the cart → checkout transition (they're separate routes).
 * Stored in localStorage; the server is authoritative on validation
 * (`/api/promos/validate`) and on usage counting (in `/api/orders`).
 */

export type AppliedPromo = {
  code: string;
  type: 'percent' | 'flat' | 'shipping';
  value: number;
  minBasket: number;
};

const KEY = 'voltik:promo';

export function loadAppliedPromo(): AppliedPromo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppliedPromo;
    if (!parsed?.code || !parsed?.type) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAppliedPromo(promo: AppliedPromo): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(KEY, JSON.stringify(promo)); } catch {}
}

export function clearAppliedPromo(): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(KEY); } catch {}
}
