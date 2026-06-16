'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { CartLine, Product } from '@/lib/types';
import { useUser } from './UserContext';

interface CartCtx {
  lines: CartLine[];
  add: (id: string, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  totalFor: (products: Product[]) => number;
}

const Ctx = createContext<CartCtx | null>(null);
const LS_KEY = 'voltik:cart';
// Anonymous carts older than this are dropped on load. Stale localStorage
// from an abandoned-then-rediscovered device shouldn't suddenly resurrect
// a months-old wishlist when the user comes back.
const CART_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

interface StoredCart {
  v: 1;
  lines: CartLine[];
  /** Last-mutation timestamp; refreshed every time the user touches the cart. */
  updatedAt: number;
}

function readStored(): CartLine[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    // Migration path: legacy payload was just `CartLine[]`. Adopt it,
    // then re-save in the new shape on the next mutation.
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(l => l && typeof l.id === 'string');
    if (parsed && parsed.v === 1 && Array.isArray(parsed.lines)) {
      if (typeof parsed.updatedAt === 'number' && Date.now() - parsed.updatedAt > CART_TTL_MS) {
        localStorage.removeItem(LS_KEY);
        return [];
      }
      return parsed.lines.filter((l: CartLine) => l && typeof l.id === 'string');
    }
    return [];
  } catch { return []; }
}

function writeStored(lines: CartLine[]) {
  try {
    const payload: StoredCart = { v: 1, lines, updatedAt: Date.now() };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const lastUserId = useRef<string | null>(null);

  // Initial hydrate from localStorage (anonymous fallback). The reader
  // also enforces a 14-day TTL so a stale device doesn't repopulate
  // months-old picks when the user comes back.
  useEffect(() => {
    setLines(readStored());
    setHydrated(true);
  }, []);

  // When the user changes, swap in the appropriate cart source.
  useEffect(() => {
    if (userLoading) return;
    if (user) {
      // Login transition: server already merged via /api/session.
      // Adopt the server cart as our source of truth.
      lastUserId.current = user.id;
      setLines(user.cart || []);
      // Wipe the anonymous cart so we don't double-merge next time.
      try { localStorage.removeItem(LS_KEY); } catch {}
    } else if (lastUserId.current) {
      // Just logged out: reset to empty (anonymous cart starts fresh).
      lastUserId.current = null;
      setLines([]);
      try { localStorage.removeItem(LS_KEY); } catch {}
    }
  }, [user, userLoading]);

  // Persist anonymous cart to localStorage; sync logged-in cart to server (debounced).
  // The "dirty" ref tracks lines that haven't been PUT yet so we can
  // flush them on `pagehide` / `visibilitychange` — the events that fire
  // when the user closes the tab or backgrounds it, before the debounce
  // window has elapsed.
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingLines = useRef<CartLine[] | null>(null);

  useEffect(() => {
    if (!hydrated || userLoading) return;
    if (user) {
      pendingLines.current = lines;
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        const snapshot = pendingLines.current;
        if (!snapshot) return;
        pendingLines.current = null;
        fetch('/api/me/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cart: snapshot })
        }).catch(() => { /* fail open — local UI stays correct */ });
      }, 400);
    } else {
      writeStored(lines);
    }
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [lines, hydrated, user, userLoading]);

  // Flush-on-exit. `pagehide` is the only event mobile Safari fires
  // reliably when a tab closes; `visibilitychange` covers the
  // background-tab case. We use `navigator.sendBeacon` so the request
  // survives the unload — `fetch` is cancelled mid-flight.
  useEffect(() => {
    if (!hydrated || !user) return;
    const flush = () => {
      const snapshot = pendingLines.current;
      if (!snapshot) return;
      pendingLines.current = null;
      if (syncTimer.current) { clearTimeout(syncTimer.current); syncTimer.current = null; }
      // `keepalive: true` tells the browser to let the request finish
      // even while the page is unloading. Capped at ~64KB per spec,
      // which is far more than a cart payload will ever be.
      try {
        fetch('/api/me/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cart: snapshot }),
          keepalive: true
        }).catch(() => {});
      } catch {}
    };
    const onVis = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [hydrated, user]);

  const add = useCallback((id: string, qty = 1) => {
    setLines(prev => {
      const existing = prev.find(l => l.id === id);
      if (existing) return prev.map(l => l.id === id ? { ...l, qty: l.qty + qty } : l);
      return [...prev, { id, qty }];
    });
  }, []);
  const remove = useCallback((id: string) => setLines(prev => prev.filter(l => l.id !== id)), []);
  const setQty = useCallback((id: string, qty: number) => {
    setLines(prev => qty <= 0 ? prev.filter(l => l.id !== id) : prev.map(l => l.id === id ? { ...l, qty } : l));
  }, []);
  const clear = useCallback(() => setLines([]), []);

  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);
  const totalFor = useCallback(
    (products: Product[]) =>
      lines.reduce((s, l) => {
        const p = products.find(x => x.id === l.id);
        return s + (p ? p.price * l.qty : 0);
      }, 0),
    [lines]
  );

  return (
    <Ctx.Provider value={{ lines, add, remove, setQty, clear, count, totalFor }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}

/** Helper used by the login form to gather anonymous cart for merge-on-login. */
export function readAnonymousCart(): CartLine[] {
  return readStored();
}
