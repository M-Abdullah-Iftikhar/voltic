'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  /** Final dollar value (already in dollars, not cents). */
  value: number;
  /** Decimals to render — defaults to 2 (currency). */
  decimals?: number;
  /** Optional className for the wrapping span. */
  className?: string;
  /** Override the currency prefix; pass an empty string to disable. */
  prefix?: string;
}

/**
 * Currency tween — animates from the previous value to the new one over
 * ~280ms whenever `value` changes. The first render snaps without a
 * tween (looks fine for SSR) and reduced-motion users get a clean swap.
 */
export function AnimatedPrice({ value, decimals = 2, className = '', prefix = '$' }: Props) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const frameRef = useRef<number | null>(null);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = to;
    if (from === to) return;

    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setDisplay(to); return; }

    setDirection(to > from ? 'up' : 'down');
    const start = performance.now();
    const duration = 280;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);   // ease-out cubic
      setDisplay(from + (to - from) * eased);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
      else { setDirection(null); frameRef.current = null; }
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value]);

  const tone = direction === 'up' ? 'text-success' : direction === 'down' ? 'text-warn' : '';
  return (
    <span className={`${className} tabular-nums transition-colors duration-300 ${tone}`} aria-live="polite">
      {prefix}{display.toFixed(decimals)}
    </span>
  );
}
