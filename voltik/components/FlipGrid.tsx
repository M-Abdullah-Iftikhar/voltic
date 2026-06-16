'use client';
import { useLayoutEffect, useRef } from 'react';

interface Props {
  /** Stable identity for the current item set — bump it whenever the items
   *  change (filtering, sorting). The grid re-runs FLIP on each bump. */
  signature: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * FLIP animation wrapper. Before children render with new positions, we
 * record each child's bounding rect by `data-flip-id`. After render, we
 * invert any moved/added/removed cards and animate them back to natural
 * position. Honours `prefers-reduced-motion` (skips the inversion).
 *
 * Children must each carry a stable `data-flip-id="some-key"` attribute.
 */
export function FlipGrid({ signature, className = '', children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef<Map<string, DOMRect>>(new Map());

  // Capture BEFORE the new layout commits.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const next = new Map<string, DOMRect>();
    root.querySelectorAll<HTMLElement>('[data-flip-id]').forEach(el => {
      const id = el.dataset.flipId!;
      next.set(id, el.getBoundingClientRect());
    });

    // FLIP: for each new id we also saw last time, invert + animate.
    next.forEach((nextRect, id) => {
      const prevRect = prev.current.get(id);
      const el = root.querySelector<HTMLElement>(`[data-flip-id="${cssEscape(id)}"]`);
      if (!el) return;

      if (prevRect) {
        const dx = prevRect.left - nextRect.left;
        const dy = prevRect.top  - nextRect.top;
        if (dx === 0 && dy === 0) return;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.style.transition = 'transform 0s';
        // Two-frame flush ensures the browser commits the inverted state.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.transition = 'transform 380ms cubic-bezier(.22,1.36,.36,1)';
            el.style.transform  = '';
          });
        });
      } else {
        // New card — fade + scale in.
        el.style.opacity = '0';
        el.style.transform = 'scale(0.92)';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.transition = 'opacity 240ms ease-out, transform 320ms cubic-bezier(.22,1.36,.36,1)';
            el.style.opacity = '1';
            el.style.transform = '';
          });
        });
      }
    });

    prev.current = next;
  }, [signature]);

  return <div ref={ref} className={className}>{children}</div>;
}

/** Tiny CSS.escape shim (Safari < 13). */
function cssEscape(s: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(s);
  return s.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}
