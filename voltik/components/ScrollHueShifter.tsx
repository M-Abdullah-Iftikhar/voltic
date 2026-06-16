'use client';
import { useEffect } from 'react';

/**
 * Writes a CSS variable `--scroll-hue` on the documentElement (0-30deg)
 * as the user scrolls through the first viewport height. Any element
 * that sets `filter: hue-rotate(var(--scroll-hue))` will subtly shift
 * with scroll — currently the .bg-mesh hero background picks it up via
 * the .hero-tod hook in globals.css.
 *
 * Honours prefers-reduced-motion (no var written, falls back to 0deg).
 */
export function ScrollHueShifter() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let frame: number | null = null;
    const onScroll = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = window.innerHeight;
        const y = Math.min(window.scrollY, max);
        const deg = Math.round((y / max) * 30);   // 0..30deg
        root.style.setProperty('--scroll-hue', `${deg}deg`);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
      root.style.removeProperty('--scroll-hue');
    };
  }, []);

  return null;
}
