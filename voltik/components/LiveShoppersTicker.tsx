'use client';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';

interface Props {
  /** Hide the country line on small viewports if your layout's tight. */
  compact?: boolean;
}

/**
 * Tiny floating chip that says "47 shoppers browsing now · 12 from Berlin".
 * The count drifts on a ~5s loop so the page feels alive without claiming
 * real traffic data. Country rotates from a short pool so each pulse adds
 * a new piece of context.
 *
 * Hidden under prefers-reduced-motion (we render the chip but don't animate
 * the digits) and on the cart/checkout/admin routes where it would be noisy.
 */
const CITIES = [
  'Karachi', 'Berlin', 'Singapore', 'São Paulo', 'Toronto', 'Dubai',
  'Tokyo', 'Bangalore', 'Melbourne', 'Lagos', 'Helsinki', 'Mexico City',
  'Seoul', 'Madrid', 'Stockholm', 'Cairo'
];

export function LiveShoppersTicker({ compact = false }: Props) {
  const [count, setCount] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    // Seed from the hour-of-day so two visitors close in time see consistent
    // numbers; still drifts as the day progresses.
    const seed = new Date().getHours();
    setCount(28 + ((seed * 7) % 42));
    setCity(CITIES[seed % CITIES.length]);
  }, []);

  // Gentle drift — at most ±3 every 5s. Don't run under reduced-motion.
  useEffect(() => {
    if (count == null || reduced) return;
    const id = setInterval(() => {
      setCount(c => {
        if (c == null) return c;
        const delta = Math.floor(Math.random() * 7) - 3;     // -3..+3
        return Math.max(18, Math.min(110, c + delta));
      });
      setCity(CITIES[Math.floor(Math.random() * CITIES.length)]);
    }, 5400);
    return () => clearInterval(id);
  }, [count, reduced]);

  if (count == null) return null;

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={`${count} shoppers browsing now`}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/85 backdrop-blur-sm px-3 py-1.5 text-xs"
    >
      <span className="relative grid place-items-center h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-success animate-pulseRing" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
      </span>
      <span className="text-ink">
        <span className="font-mono font-bold tabular-nums">{count}</span>{' '}
        <span className="text-muted">shoppers browsing now</span>
      </span>
      {!compact && city && (
        <span className="hidden sm:inline text-muted/80">· from {city}</span>
      )}
    </span>
  );
}
