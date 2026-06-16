'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import { FreeShippingBar } from './FreeShippingBar';
import { EmptyState } from './EmptyState';
import { useCart } from './CartContext';
import type { EnrichedProduct, Product } from '@/lib/types';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** Slide-in cart panel. Fetches products on first open so the drawer can
 *  render line totals without forcing the host page to pass them in. */
export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { lines, setQty, remove, totalFor } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Fetch product details only when the drawer is actually opened.
  useEffect(() => {
    if (!open || products.length > 0) return;
    setLoading(true);
    fetch('/api/products', { cache: 'no-store' })
      .then(r => r.json())
      .then((d: { products: EnrichedProduct[] }) => setProducts(d.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [open, products.length]);

  const subtotal = totalFor(products);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);
  const shipping = subtotal >= 50 ? 0 : 6.5;

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-bg/70 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!open}
      />

      {/* Panel — bottom sheet on mobile (90vh + rounded top), side drawer on sm+ */}
      <aside
        className={`fixed z-50 bg-surface shadow-card flex flex-col transition-transform duration-300 ease-out
          inset-x-0 bottom-0 h-[90vh] rounded-t-3xl border-t border-line
          sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-0 sm:h-full sm:w-full sm:max-w-[420px] sm:rounded-t-none sm:border-t-0 sm:border-l
          ${open
            ? 'translate-y-0 sm:translate-y-0 sm:translate-x-0'
            : 'translate-y-full sm:translate-y-0 sm:translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Grab handle (mobile only) — touch affordance to dismiss */}
        <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0" aria-hidden>
          <button
            onClick={onClose}
            className="h-1.5 w-12 rounded-full bg-line/80 hover:bg-muted/60 transition"
            aria-label="Close cart"
          />
        </div>

        <header className="flex items-center justify-between px-5 py-3 sm:py-4 border-b border-line shrink-0">
          <div>
            <h2 className="font-display font-bold text-lg">Your cart</h2>
            <p className="text-xs text-muted">{itemCount} item{itemCount === 1 ? '' : 's'}</p>
          </div>
          <button onClick={onClose} aria-label="Close cart" className="grid place-items-center h-9 w-9 rounded-full border border-line hover:bg-elev">
            <Icon.close width={16} height={16} />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-5">
            <div onClick={onClose}>
              <EmptyState
                kind="cart"
                title="Cart's empty"
                body="Tap the plus on any product to drop it in here."
                primary={{ href: '/shop', label: 'Start shopping' }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Shipping progress (refreshes as user changes qty) */}
            <div className="px-5 py-4 border-b border-line shrink-0">
              <FreeShippingBar subtotal={subtotal} />
            </div>

            {/* Items list */}
            <ul className="flex-1 overflow-y-auto px-3 py-2 divide-y divide-line/60">
              {lines.map(line => {
                const p = products.find(x => x.id === line.id);
                return (
                  <li key={line.id} className="flex items-center gap-3 py-3 px-2">
                    {p ? (
                      <ProductIllustration category={p.category} icon={p.icon} className="h-14 w-14 rounded-xl shrink-0" size={28} />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-elev grid place-items-center text-muted shrink-0">
                        <Icon.box width={20} height={20} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {p ? (
                        <Link href={`/product/${p.slug || p.id}`} onClick={onClose} className="text-sm font-semibold hover:text-brand line-clamp-1">{p.name}</Link>
                      ) : (
                        <span className="text-sm font-semibold italic text-muted line-clamp-1">{loading ? 'Loading…' : 'Unavailable'}</span>
                      )}
                      <div className="text-xs text-muted">{p ? `$${p.price.toFixed(2)}` : ''}</div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex items-center rounded-full border border-line bg-bg overflow-hidden">
                          <button onClick={() => setQty(line.id, line.qty - 1)} className="px-2 py-1 hover:bg-elev text-muted" aria-label="Decrease"><Icon.minus width={11} height={11} /></button>
                          <span className="px-2.5 text-xs font-semibold min-w-[24px] text-center">{line.qty}</span>
                          <button onClick={() => setQty(line.id, line.qty + 1)} className="px-2 py-1 hover:bg-elev text-muted" aria-label="Increase"><Icon.plus width={11} height={11} /></button>
                        </div>
                        <button onClick={() => remove(line.id)} className="text-[11px] text-muted hover:text-danger flex items-center gap-1">
                          <Icon.trash width={10} height={10} /> Remove
                        </button>
                      </div>
                    </div>
                    {p && (
                      <div className="text-sm font-bold whitespace-nowrap">${(p.price * line.qty).toFixed(2)}</div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Footer with totals + CTAs */}
            <footer className="border-t border-line px-5 py-4 space-y-3 shrink-0">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Shipping</span>
                <span className={shipping === 0 ? 'text-success font-semibold' : 'font-semibold'}>
                  {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-line">
                <span>Total</span>
                <span className="gradient-text">${(subtotal + shipping).toFixed(2)}</span>
              </div>

              <Link href="/checkout" onClick={onClose} className="btn-primary w-full justify-center !py-3">
                Checkout <Icon.arrow width={14} height={14} />
              </Link>
              <Link href="/cart" onClick={onClose} className="text-center block text-xs text-muted hover:text-ink">View full cart</Link>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
