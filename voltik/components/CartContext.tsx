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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const lastUserId = useRef<string | null>(null);

  // Initial hydrate from localStorage (anonymous fallback).
  useEffect(() => {
    try { setLines(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); } catch {}
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
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated || userLoading) return;
    if (user) {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        fetch('/api/me/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cart: lines })
        }).catch(() => { /* fail open — local UI stays correct */ });
      }, 400);
    } else {
      try { localStorage.setItem(LS_KEY, JSON.stringify(lines)); } catch {}
    }
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [lines, hydrated, user, userLoading]);

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
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
