'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { CartLine, PublicUser } from '@/lib/types';

interface UserCtx {
  user: PublicUser | null;
  loading: boolean;
  login: (email: string, password: string, mergeCart?: CartLine[]) => Promise<{ ok: boolean; error?: string }>;
  signup: (data: { email: string; name: string; password: string; cart?: CartLine[]; favorites?: string[] }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Server-side refresh of the user object after a mutation (cart/favorites). */
  setUser: (u: PublicUser | null) => void;
}

const Ctx = createContext<UserCtx | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/session', { cache: 'no-store' });
      const data = await res.json();
      setUser(data.user || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login: UserCtx['login'] = useCallback(async (email, password, mergeCart) => {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, mergeCart })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || 'Login failed' };
    setUser(data.user);
    return { ok: true };
  }, []);

  const signup: UserCtx['signup'] = useCallback(async (input) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || 'Registration failed' };
    setUser(data.user);
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' })
    });
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, login, signup, logout, refresh, setUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUser() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useUser must be inside UserProvider');
  return ctx;
}
