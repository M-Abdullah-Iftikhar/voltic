'use client';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';

/**
 * Segmented light/dark switch sized for the admin topbar. Shows both
 * states at once so the affordance is obvious — an icon button is fine
 * for storefront chrome but admins switch themes constantly while
 * matching customer screenshots, so the topbar wants the wider control.
 *
 * Uses the same `voltik-theme` localStorage key as the storefront
 * ThemeToggle so toggling either side stays in sync.
 */
export function AdminThemeSwitch() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('voltik-theme') as 'light' | 'dark' | null);
    const initial = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const set = (next: 'light' | 'dark') => {
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    try { localStorage.setItem('voltik-theme', next); } catch {}
  };

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-0.5 rounded-full border border-line bg-bg/60 p-0.5"
      suppressHydrationWarning
    >
      <button
        role="radio"
        aria-checked={theme === 'light'}
        onClick={() => set('light')}
        title="Light theme"
        className={`grid place-items-center h-8 w-8 rounded-full transition ${
          theme === 'light' ? 'bg-surface shadow-soft text-warn' : 'text-muted hover:text-ink'
        }`}
      >
        <Icon.sun width={14} height={14} />
      </button>
      <button
        role="radio"
        aria-checked={theme === 'dark'}
        onClick={() => set('dark')}
        title="Dark theme"
        className={`grid place-items-center h-8 w-8 rounded-full transition ${
          theme === 'dark' ? 'bg-surface shadow-soft text-brand' : 'text-muted hover:text-ink'
        }`}
      >
        <Icon.moon width={14} height={14} />
      </button>
    </div>
  );
}
