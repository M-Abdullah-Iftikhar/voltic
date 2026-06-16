'use client';
import { useEffect, useRef, type RefObject } from 'react';

/**
 * Magnetic-button effect. Attach the returned ref to any element to make
 * its centre subtly attract the cursor when the pointer is within `radius`.
 *
 *   const ref = useMagnet<HTMLButtonElement>({ strength: 0.4, radius: 80 });
 *   <button ref={ref}>Buy now</button>
 *
 * Pointer-fine devices only — disabled on touch + when reduced-motion is on.
 */
export function useMagnet<T extends HTMLElement = HTMLElement>({
  strength = 0.3,
  radius = 70
}: { strength?: number; radius?: number } = {}): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia?.('(hover: none)').matches) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) {
        el.style.transform = '';
        return;
      }
      // Fall-off factor — stronger near the centre, weaker near the edge.
      const k = (1 - dist / radius) * strength;
      el.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    };
    const onLeave = () => { el.style.transform = ''; };

    el.style.transition = 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)';
    window.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.style.transform = '';
      el.style.transition = '';
    };
  }, [strength, radius]);

  return ref;
}
