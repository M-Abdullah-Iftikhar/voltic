'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from './UserContext';
import { haptic } from '@/lib/haptics';

interface FavCtx {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  count: number;
}

const Ctx = createContext<FavCtx | null>(null);
const LS_KEY = 'voltik:favorites';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const lastUserId = useRef<string | null>(null);

  // Initial localStorage hydrate.
  useEffect(() => {
    try { setIds(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); } catch {}
    setHydrated(true);
  }, []);

  // Swap to the server-side favorites when the user becomes known.
  useEffect(() => {
    if (userLoading) return;
    if (user) {
      lastUserId.current = user.id;
      // Merge anonymous + server favorites on first login, then adopt server.
      let merged = user.favorites || [];
      try {
        const local: string[] = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
        if (local.length) {
          merged = Array.from(new Set([...merged, ...local]));
          localStorage.removeItem(LS_KEY);
        }
      } catch {}
      setIds(merged);
    } else if (lastUserId.current) {
      lastUserId.current = null;
      setIds([]);
    }
  }, [user, userLoading]);

  // Persist anonymous → localStorage. Logged-in mutations go through the
  // POST endpoint per-toggle (atomic $addToSet / $pull) so concurrent
  // toggles in two tabs no longer race the way the bulk PUT used to.
  // We still PUT once on first hydrate to reconcile any anonymous list
  // we just merged in — that's a one-shot, not a per-click write.
  const mergedOnce = useRef(false);
  useEffect(() => {
    if (!hydrated || userLoading) return;
    if (!user) {
      try { localStorage.setItem(LS_KEY, JSON.stringify(ids)); } catch {}
      return;
    }
    if (!mergedOnce.current) {
      mergedOnce.current = true;
      fetch('/api/me/favorites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites: ids })
      }).catch(() => {});
    }
  }, [ids, hydrated, user, userLoading]);

  // Single-product mutation against the atomic server endpoint. Fires
  // when the user is logged in — anonymous users just hit localStorage
  // through the state setter.
  const pushMutation = useCallback((productId: string, action: 'add' | 'remove') => {
    if (!user) return;
    fetch('/api/me/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, action })
    }).catch(() => {});
  }, [user]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const add = useCallback((id: string) => setIds(prev => {
    if (prev.includes(id)) return prev;
    pushMutation(id, 'add');
    return [...prev, id];
  }), [pushMutation]);
  const remove = useCallback((id: string) => setIds(prev => {
    if (!prev.includes(id)) return prev;
    pushMutation(id, 'remove');
    return prev.filter(x => x !== id);
  }), [pushMutation]);
  const toggle = useCallback((id: string) => setIds(prev => {
    const willAdd = !prev.includes(id);
    haptic('tap');
    pushMutation(id, willAdd ? 'add' : 'remove');
    return willAdd ? [...prev, id] : prev.filter(x => x !== id);
  }), [pushMutation]);

  const count = useMemo(() => ids.length, [ids]);

  return (
    <Ctx.Provider value={{ ids, has, toggle, add, remove, count }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFavorites must be inside FavoritesProvider');
  return ctx;
}
