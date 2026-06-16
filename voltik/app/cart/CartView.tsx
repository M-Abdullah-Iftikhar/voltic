'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProductIllustration } from '@/components/ProductIllustration';
import { Icon } from '@/components/Icons';
import { useCart } from '@/components/CartContext';
import { useFavorites } from '@/components/FavoritesContext';
import { FreeShippingBar } from '@/components/FreeShippingBar';
import { EmptyState } from '@/components/EmptyState';
import { DeliveryEstimate } from '@/components/DeliveryEstimate';
import { YouMightLike } from '@/components/YouMightLike';
import { loadAppliedPromo, saveAppliedPromo, clearAppliedPromo, type AppliedPromo } from '@/lib/promoClient';
import { AnimatedPrice } from '@/components/AnimatedPrice';
import { PromoCodeHint } from '@/components/PromoCodeHint';
import { SwipeableRow } from '@/components/SwipeableRow';
import type { EnrichedProduct } from '@/lib/types';

export function CartView({ products }: { products: EnrichedProduct[] }) {
  const { lines, setQty, remove, totalFor, clear } = useCart();
  const { add: addFavorite, has: isFavorite } = useFavorites();
  const [promo, setPromo] = useState('');
  const [applied, setApplied] = useState<AppliedPromo | null>(null);
  const [promoErr, setPromoErr] = useState('');
  const [applying, setApplying] = useState(false);
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  // Restore any previously applied promo on mount.
  useEffect(() => { setApplied(loadAppliedPromo()); }, []);

  // Animate the row out, then commit the actual removal a tick later.
  const animatedRemove = (id: string) => {
    setRemovingIds(prev => prev.includes(id) ? prev : [...prev, id]);
    setTimeout(() => {
      remove(id);
      setRemovingIds(prev => prev.filter(x => x !== id));
    }, 320);
  };

  // Save-for-later: tuck the item into favourites and drop it from the cart.
  // If it's already a favourite, just remove it from the cart without flashing.
  const saveForLater = (id: string, name: string) => {
    const wasFavorite = isFavorite(id);
    addFavorite(id);
    if (!wasFavorite) {
      setSavedFlash(name);
      setTimeout(() => setSavedFlash(null), 2200);
    }
    animatedRemove(id);
  };

  if (lines.length === 0) {
    return (
      <EmptyState
        kind="cart"
        title="Your cart is empty"
        body="Tap the plus on any product to drop it in here."
        primary={{ href: '/shop', label: 'Continue shopping' }}
      />
    );
  }

  const subtotal = totalFor(products);
  // Recompute discount each render against the live subtotal — the stored
  // promo holds rules, not a frozen dollar amount.
  const discount = applied
    ? applied.type === 'percent' ? +(subtotal * (applied.value / 100)).toFixed(2)
    : applied.type === 'flat'    ? Math.min(subtotal, applied.value)
    : 0
    : 0;
  const freeShip = applied?.type === 'shipping';
  const baseAfterDiscount = Math.max(0, subtotal - discount);
  const shipping = freeShip ? 0 : (baseAfterDiscount >= 50 ? 0 : 6.50);
  const tax = baseAfterDiscount * 0.08;
  const total = Math.max(0, baseAfterDiscount + shipping + tax);

  const applyPromo = async () => {
    const code = promo.trim();
    if (!code) return;
    setApplying(true); setPromoErr('');
    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal })
      });
      const data = await res.json();
      if (!res.ok) { setPromoErr(data.error || 'Could not apply promo.'); setApplying(false); return; }
      const next: AppliedPromo = data.promo;
      setApplied(next);
      saveAppliedPromo(next);
    } catch {
      setPromoErr('Network error — try again.');
    }
    setApplying(false);
  };

  const removePromo = () => {
    setApplied(null);
    setPromo('');
    setPromoErr('');
    clearAppliedPromo();
  };

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8">
      <div className="space-y-3">
        {savedFlash && (
          <div className="rounded-2xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm flex items-center gap-2 animate-slidein">
            <Icon.heart width={14} height={14} className="text-brand" />
            <span><span className="font-semibold text-ink">{savedFlash}</span> moved to <Link href="/favorites" className="text-brand hover:underline">favourites</Link>.</span>
          </div>
        )}
        <FreeShippingBar subtotal={subtotal} />
        {lines.map(line => {
          const p = products.find(x => x.id === line.id);
          if (!p) return null;
          const removing = removingIds.includes(line.id);
          return (
            <SwipeableRow
              key={line.id}
              primary={{ icon: 'trash', label: 'Remove', onClick: () => animatedRemove(line.id), bg: 'bg-danger' }}
              secondary={{ icon: 'heart', label: 'Save', onClick: () => saveForLater(line.id, p.name), bg: 'bg-brand' }}
              className={removing ? 'voltik-slide-away' : ''}
            >
              <div className="card p-3 sm:p-4 flex gap-4 items-center overflow-hidden">
                <ProductIllustration category={p.category} icon={p.icon} className="aspect-square h-20 w-20 rounded-2xl shrink-0" size={40} />
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${p.slug || p.id}`} className="font-semibold hover:text-brand line-clamp-1">{p.name}</Link>
                  <div className="text-xs text-muted">SKU {p.sku}</div>
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <div className="flex items-center rounded-full border border-line bg-surface">
                      <button onClick={() => setQty(line.id, line.qty - 1)} className="px-2.5 py-1.5 hover:bg-elev rounded-l-full" aria-label="Decrease">
                        <Icon.minus width={12} height={12} />
                      </button>
                      <span className="px-3 text-xs font-semibold min-w-[24px] text-center">{line.qty}</span>
                      <button onClick={() => setQty(line.id, line.qty + 1)} className="px-2.5 py-1.5 hover:bg-elev rounded-r-full" aria-label="Increase">
                        <Icon.plus width={12} height={12} />
                      </button>
                    </div>
                    <button onClick={() => saveForLater(line.id, p.name)} className="text-xs text-muted hover:text-brand flex items-center gap-1">
                      <Icon.heart width={12} height={12} /> Save for later
                    </button>
                    <button onClick={() => animatedRemove(line.id)} className="text-xs text-muted hover:text-danger flex items-center gap-1">
                      <Icon.trash width={12} height={12} /> Remove
                    </button>
                  </div>
                  <div className="text-[10px] text-muted/70 mt-2 sm:hidden italic">
                    Swipe left to remove · right to save for later
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <AnimatedPrice value={p.price * line.qty} className="font-bold" />
                  <div className="text-xs text-muted">${p.price.toFixed(2)} each</div>
                </div>
              </div>
            </SwipeableRow>
          );
        })}

        <div className="flex items-center justify-between pt-3">
          <Link href="/shop" className="text-sm text-muted hover:text-ink flex items-center gap-1">
            <Icon.arrow width={14} height={14} className="rotate-180" /> Continue shopping
          </Link>
          <button onClick={clear} className="text-xs text-muted hover:text-danger flex items-center gap-1">
            <Icon.trash width={12} height={12} /> Empty cart
          </button>
        </div>
      </div>

      {/* Summary */}
      <aside className="self-start lg:sticky lg:top-20">
        <div className="card p-6">
          <h3 className="font-display font-bold text-xl">Order summary</h3>

          <div className="mt-5 space-y-3 text-sm">
            <SummaryRow label="Subtotal">
              <AnimatedPrice value={subtotal} className="font-semibold text-ink" />
            </SummaryRow>
            {applied && discount > 0 && (
              <SummaryRow label={`Promo (${applied.code})`}>
                <AnimatedPrice value={-discount} className="font-semibold text-success" />
              </SummaryRow>
            )}
            <SummaryRow label="Shipping">
              <span className={`font-semibold ${freeShip ? 'text-success' : 'text-ink'}`}>
                {shipping === 0 ? (freeShip ? 'Free (promo)' : 'Free') : `$${shipping.toFixed(2)}`}
              </span>
            </SummaryRow>
            <SummaryRow label="Estimated tax (8%)">
              <AnimatedPrice value={tax} className="font-semibold text-ink" />
            </SummaryRow>
            <div className="border-t border-line pt-3 flex justify-between text-base font-bold">
              <span>Total</span>
              <AnimatedPrice value={total} className="gradient-text" />
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs uppercase tracking-wide text-muted font-semibold">Promo code</label>
              <PromoCodeHint />
            </div>
            {applied ? (
              <div className="mt-1.5 flex items-center justify-between gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-2">
                <span className="text-xs text-success font-semibold flex items-center gap-1.5">
                  <Icon.check width={12} height={12} />
                  <span className="font-mono">{applied.code}</span>
                  <span className="text-success/80">
                    · {applied.type === 'percent' ? `${applied.value}% off` : applied.type === 'flat' ? `$${applied.value} off` : 'Free shipping'}
                  </span>
                </span>
                <button onClick={removePromo} className="text-xs text-muted hover:text-danger" aria-label="Remove promo">
                  <Icon.close width={12} height={12} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mt-1.5">
                <input
                  className="input"
                  placeholder="Enter code"
                  value={promo}
                  onChange={(e) => { setPromo(e.target.value.toUpperCase()); setPromoErr(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyPromo(); }}
                />
                <button onClick={applyPromo} disabled={applying || !promo.trim()} className="btn-ghost !px-3 disabled:opacity-60">
                  {applying ? '…' : 'Apply'}
                </button>
              </div>
            )}
            {promoErr && <div className="text-xs text-danger mt-2 flex items-center gap-1"><Icon.close width={12} height={12} /> {promoErr}</div>}
            {!applied && !promoErr && <div className="text-xs text-muted mt-2">Try <span className="font-mono">VOLT10</span> · <span className="font-mono">FREESHIP</span></div>}
          </div>

          <div className="mt-5">
            <DeliveryEstimate variant="card" />
          </div>

          <Link href="/checkout" className="btn-primary w-full justify-center mt-4">
            Checkout securely <Icon.arrow width={16} height={16} />
          </Link>

          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-muted">
            <Icon.shield width={14} height={14} /> 256-bit SSL · 30-day returns
          </div>

          <YouMightLike
            catalog={products}
            excludeIds={lines.map(l => l.id)}
            title="Complete your set"
            max={4}
          />
        </div>
      </aside>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-muted">{label}</span>
      {children}
    </div>
  );
}
