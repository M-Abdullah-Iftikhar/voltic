'use client';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('voltik-theme') as 'light' | 'dark' | null);
    const initial = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('voltik-theme', next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="grid place-items-center h-10 w-10 rounded-full border border-line text-ink hover:bg-elev transition"
    >
      {theme === 'dark'
        ? <Icon.sun width={18} height={18} />
        : <Icon.moon width={18} height={18} />}
    </button>
  );
}
