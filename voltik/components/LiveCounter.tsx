'use client';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';

interface LiveCounterProps {
  /** Starting visible number — defaults to a deterministic value derived from
   *  today's date so SSR + hydrate match without flicker. */
  base?: number;
  label?: string;
  /** Min/max ms between increments. */
  minInterval?: number;
  maxInterval?: number;
}

/**
 * Cute live-counter strip ("⚡ N chargers shipped this week"). Increments
 * by 1 at a randomised interval so it always feels alive. Pauses when
 * offscreen via IntersectionObserver.
 */
export function LiveCounter({
  base,
  label = 'chargers shipped this week',
  minInterval = 3000,
  maxInterval = 9000
}: LiveCounterProps) {
  const initial = base ?? defaultBase();
  const [value, setValue] = useState(initial);
  const [pulse, setPulse] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;
    const io = new IntersectionObserver(([e]) => setPaused(p => !e.isIntersecting || p), { threshold: 0.2 });
    io.observe(ref);
    return () => io.disconnect();
  }, [ref]);

  useEffect(() => {
    if (paused) return;
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const wait = minInterval + Math.random() * (maxInterval - minInterval);
      timeout = setTimeout(() => {
        setValue(v => v + 1);
        setPulse(p => p + 1);
        schedule();
      }, wait);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, [paused, minInterval, maxInterval]);

  return (
    <div
      ref={setRef}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs"
      aria-live="polite"
    >
      <span className="relative grid place-items-center h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-success animate-pulseRing" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      <span className="text-muted">⚡ </span>
      <span
        key={pulse}
        className="font-display font-bold text-ink tabular-nums voltik-bump"
      >
        {value.toLocaleString()}
      </span>
      <span className="text-muted">{label}</span>
    </div>
  );
}

/** Stable initial value so SSR + first client render don't mismatch. */
function defaultBase(): number {
  const dayOfYear = Math.floor((Date.now() / 86_400_000) % 365);
  return 1200 + dayOfYear * 7;   // ~1200 in Jan, ~3760 by Dec — credible scale
}
