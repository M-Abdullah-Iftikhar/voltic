'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Icon } from './Icons';
import { useCart } from './CartContext';
import type { EnrichedProduct, Product } from '@/lib/types';

const THRESHOLD = 50;
const DISMISS_KEY = 'voltik:shipfloat-dismissed';

/**
 * Bottom-screen floating bar that shows progress toward free shipping.
 * Mounts globally; auto-hides on the cart/checkout pages (the cart's own
 * FreeShippingBar already lives there) and on admin/auth routes.
 *
 * Dismissible — choice is remembered in localStorage so it doesn't pester.
 */
export function FreeShippingFloater() {
  const path = usePathname() || '';
  const { lines } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [dismissed, setDismissed] = useState(false);

  // Pull products once when the user actually has a cart — keeps cold landings cheap.
  useEffect(() => {
    if (lines.length === 0 || products.length > 0) return;
    let cancelled = false;
    fetch('/api/products', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { products: [] })
      .then((d: { products: EnrichedProduct[] }) => { if (!cancelled) setProducts(d.products || []); })
      .catch(() => { /* fail open */ });
    return () => { cancelled = true; };
  }, [lines.length, products.length]);

  // Restore dismissed state on mount (resets if cart becomes empty so it
  // can show up again on the next session).
  useEffect(() => {
    try { setDismissed(!!window.sessionStorage.getItem(DISMISS_KEY)); } catch {}
  }, []);

  // Hide entirely on routes where it would duplicate other UI.
  const HIDDEN_PREFIXES = ['/cart', '/checkout', '/admin', '/login', '/signup', '/forgot', '/reset', '/verify'];
  const hiddenForRoute = HIDDEN_PREFIXES.some(p => path === p || path.startsWith(`${p}/`));
  if (hiddenForRoute || dismissed || lines.length === 0) return null;

  const subtotal = lines.reduce((s, l) => {
    const p = products.find(x => x.id === l.id);
    return s + (p ? p.price * l.qty : 0);
  }, 0);

  // Don't show until we've actually resolved the subtotal — otherwise the
  // bar jumps in saying "Add $50" before products land, which looks broken.
  if (subtotal === 0) return null;

  const remaining = Math.max(0, THRESHOLD - subtotal);
  const pct = Math.min(100, (subtotal / THRESHOLD) * 100);
  const earned = remaining === 0;

  const dismiss = () => {
    try { window.sessionStorage.setItem(DISMISS_KEY, '1'); } catch {}
    setDismissed(true);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-20 sm:bottom-4 sm:left-auto sm:right-4 sm:w-[360px] z-40 animate-slidein"
    >
      <div className="card p-4 shadow-card border-line">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={`grid place-items-center h-10 w-10 rounded-xl text-white shrink-0 ${earned ? '' : 'animate-floaty'}`}
            style={{
              background: earned
                ? 'linear-gradient(135deg,rgb(var(--success)),rgb(var(--brand)))'
                : 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))'
            }}
          >
            <Icon.truck width={18} height={18} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-ink line-clamp-1">
              {earned ? 'Free shipping unlocked ⚡' : `Add $${remaining.toFixed(2)} for free shipping`}
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-elev overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${earned ? 'bg-success' : 'bg-gradient-to-r from-brand to-brand2'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <Link href="/cart" className="btn-ghost text-xs !px-3 shrink-0">View cart</Link>
          <button
            onClick={dismiss}
            aria-label="Dismiss free-shipping bar"
            className="text-muted hover:text-ink"
          >
            <Icon.close width={12} height={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
