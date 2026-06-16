'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface RecentlyViewedCtx {
  ids: string[];
  track: (productId: string) => void;
  clear: () => void;
}

const Ctx = createContext<RecentlyViewedCtx | null>(null);
const KEY = 'voltik:recently-viewed';
const MAX = 12;

/**
 * LocalStorage-backed "recently viewed" tracker. Anonymous, per-device.
 * Stays small (12 ids max) and surfaces most-recent first. Hydrates after
 * mount to avoid SSR flicker.
 */
export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch { /* ignore corrupted local data */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch {}
  }, [ids, hydrated]);

  const track = useCallback((productId: string) => {
    setIds(prev => {
      const next = [productId, ...prev.filter(id => id !== productId)];
      return next.slice(0, MAX);
    });
  }, []);

  const clear = useCallback(() => setIds([]), []);

  return (
    <Ctx.Provider value={{ ids, track, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRecentlyViewed(): RecentlyViewedCtx {
  const ctx = useContext(Ctx);
  if (!ctx) return { ids: [], track: () => {}, clear: () => {} };  // no-op outside provider
  return ctx;
}
