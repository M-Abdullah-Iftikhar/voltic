'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Oversize gradient "VOLTIK" wordmark that scrolls into view as the user
 * approaches the footer. Uses IntersectionObserver to gate the reveal and
 * sets a CSS var (`--logo-progress`) so the inner stroke + opacity feel
 * tied to scroll position without a full RAF loop.
 *
 * Bails out under prefers-reduced-motion — renders the wordmark muted
 * + static without animating the transform.
 */
export function FooterMarquee() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    let frame: number | null = null;
    const measure = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // 0 when the band is still well below the fold, 1 when its top
        // crosses the centre of the viewport.
        const rect = el.getBoundingClientRect();
        const vh   = window.innerHeight;
        const enter = vh * 1.0;        // start fading in at this distance below the fold
        const settle = vh * 0.4;       // fully landed at this distance
        const fromTop = rect.top;
        if (fromTop > enter)   { setProgress(0);   return; }
        if (fromTop < settle)  { setProgress(1);   return; }
        const p = 1 - (fromTop - settle) / (enter - settle);
        setProgress(Math.max(0, Math.min(1, p)));
      });
    };
    measure();
    window.addEventListener('scroll',  measure, { passive: true });
    window.addEventListener('resize',  measure);
    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  const p = reduced ? 0.5 : progress;
  const lift = (1 - p) * 56;     // pixels — rises into place

  return (
    <div
      ref={ref}
      aria-hidden
      className="relative overflow-hidden border-t border-line/60 bg-surface/60"
      style={{ height: 'clamp(150px, 22vw, 280px)' }}
    >
      <div
        className="absolute inset-x-0 bottom-0 flex items-end justify-center pointer-events-none select-none"
        style={{
          transform: `translateY(${lift}px)`,
          opacity: 0.15 + p * 0.85,
          transition: 'transform 600ms cubic-bezier(.22,.78,.16,1), opacity 400ms ease-out'
        }}
      >
        <span
          className="font-display font-black leading-none"
          style={{
            fontSize: 'clamp(120px, 28vw, 360px)',
            letterSpacing: '-0.04em',
            backgroundImage: 'linear-gradient(135deg, rgb(var(--brand)) 0%, rgb(var(--brand2)) 45%, rgb(var(--accent2)) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            // Inset stroke effect so the wordmark feels carved as it rises
            WebkitTextStroke: `${1 + p * 0.6}px rgb(var(--brand) / 0.15)`,
            paintOrder: 'stroke fill'
          }}
        >
          VOLTIK
        </span>
      </div>
      {/* Tagline rides above the wordmark once it's mostly in place */}
      <div
        className="absolute inset-x-0 top-6 sm:top-10 flex justify-center text-[11px] sm:text-xs uppercase tracking-[0.4em] text-muted font-semibold pointer-events-none"
        style={{
          opacity: p,
          transform: `translateY(${(1 - p) * 20}px)`,
          transition: 'opacity 400ms ease-out, transform 400ms ease-out'
        }}
      >
        Engineered to charge the next thing you reach for.
      </div>
    </div>
  );
}
