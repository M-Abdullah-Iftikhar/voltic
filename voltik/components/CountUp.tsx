'use client';
import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  to: number;
  /** ms */ duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
  /** Triggers when the element scrolls into view (default true). */
  startOnView?: boolean;
}

/**
 * Animates a number from 0 → `to` once, when it scrolls into view.
 * Honours prefers-reduced-motion (snaps to the final value).
 */
export function CountUp({
  to, duration = 1400, prefix = '', suffix = '',
  decimals = 0, className = '', startOnView = true
}: CountUpProps) {
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (done) return;
    if (typeof window === 'undefined') return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setValue(to);
      setDone(true);
      return;
    }

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(to * eased);
        if (t < 1) requestAnimationFrame(tick);
        else setDone(true);
      };
      requestAnimationFrame(tick);
    };

    if (!startOnView || !ref.current) {
      run();
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { io.disconnect(); run(); }
    }, { threshold: 0.25 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [to, duration, startOnView, done]);

  return (
    <span ref={ref} className={className}>
      {prefix}{value.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}{suffix}
    </span>
  );
}
