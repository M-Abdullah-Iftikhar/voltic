'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from './UserContext';

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

  // Persist anonymous → localStorage; logged-in → debounced server sync.
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated || userLoading) return;
    if (user) {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        fetch('/api/me/favorites', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorites: ids })
        }).catch(() => {});
      }, 300);
    } else {
      try { localStorage.setItem(LS_KEY, JSON.stringify(ids)); } catch {}
    }
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [ids, hydrated, user, userLoading]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const add = useCallback((id: string) => setIds(prev => prev.includes(id) ? prev : [...prev, id]), []);
  const remove = useCallback((id: string) => setIds(prev => prev.filter(x => x !== id)), []);
  const toggle = useCallback((id: string) => setIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]), []);

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
