'use client';
import { createContext, useCallback, useContext, useRef } from 'react';

/**
 * FlyToCart animation system.
 *
 *  - Cart icon registers its bounding-box getter via `setCartAnchor()`.
 *  - When a product is added, callers invoke `flyToCart(sourceEl)` with the
 *    DOM node of the product image. We clone it, animate it on a curved path
 *    to the cart anchor, then briefly wiggle the cart badge.
 *
 * The whole thing is fire-and-forget — callers don't await anything.
 */

type AnchorGetter = () => DOMRect | null;

interface Ctx {
  setCartAnchor: (getter: AnchorGetter | null) => void;
  flyToCart: (source: HTMLElement | null) => void;
}

const FlyContext = createContext<Ctx | null>(null);

const WIGGLE_CLASS = 'voltik-wiggle';

export function FlyToCartProvider({ children }: { children: React.ReactNode }) {
  const anchorRef = useRef<AnchorGetter | null>(null);

  const setCartAnchor = useCallback((getter: AnchorGetter | null) => {
    anchorRef.current = getter;
  }, []);

  const flyToCart = useCallback((source: HTMLElement | null) => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (!source || !anchorRef.current) return;

    const target = anchorRef.current();
    if (!target) return;
    const start = source.getBoundingClientRect();
    if (start.width === 0 || start.height === 0) return;

    // Clone the source as a fixed overlay, fly it to the cart, then drop it.
    const clone = source.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.left = `${start.left}px`;
    clone.style.top = `${start.top}px`;
    clone.style.width = `${start.width}px`;
    clone.style.height = `${start.height}px`;
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';
    clone.style.willChange = 'transform, opacity';
    clone.style.borderRadius = '20px';
    clone.style.transition = 'none';
    clone.setAttribute('aria-hidden', 'true');

    document.body.appendChild(clone);

    // Animation maths — small arc through a mid control point.
    const dx = target.left + target.width / 2 - (start.left + start.width / 2);
    const dy = target.top + target.height / 2 - (start.top + start.height / 2);

    const anim = clone.animate(
      [
        { transform: 'translate(0,0) scale(1)',                       opacity: 1, offset: 0 },
        { transform: `translate(${dx * 0.55}px, ${dy * 0.25 - 80}px) scale(0.55)`, opacity: 0.85, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.12)`,       opacity: 0,  offset: 1 }
      ],
      { duration: 700, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }
    );
    anim.onfinish = () => {
      clone.remove();
      // Wiggle the cart icon after arrival.
      const anchorEl = document.querySelector('[data-cart-anchor]') as HTMLElement | null;
      if (anchorEl) {
        anchorEl.classList.add(WIGGLE_CLASS);
        setTimeout(() => anchorEl.classList.remove(WIGGLE_CLASS), 600);
      }
    };
  }, []);

  return (
    <FlyContext.Provider value={{ setCartAnchor, flyToCart }}>
      {children}
    </FlyContext.Provider>
  );
}

export function useFlyToCart(): Ctx {
  const ctx = useContext(FlyContext);
  // Outside the provider (e.g. server render) the hook is a no-op rather than
  // throwing — callers can fire-and-forget safely.
  if (!ctx) return { setCartAnchor: () => {}, flyToCart: () => {} };
  return ctx;
}
