'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ProductIllustration } from '@/components/ProductIllustration';
import { Icon } from '@/components/Icons';
import { useCart } from '@/components/CartContext';
import type { Product } from '@/lib/types';

export function CartView({ products }: { products: Product[] }) {
  const { lines, setQty, remove, totalFor, clear } = useCart();
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  if (lines.length === 0) {
    return (
      <div className="card p-14 text-center">
        <div className="grid place-items-center h-20 w-20 mx-auto rounded-full bg-elev text-muted">
          <Icon.cart width={32} height={32} />
        </div>
        <h2 className="font-display font-bold text-2xl mt-5">Your cart is empty</h2>
        <p className="text-muted text-sm mt-2">Looks like you haven't added anything yet.</p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">
          Continue shopping <Icon.arrow width={14} height={14} />
        </Link>
      </div>
    );
  }

  const subtotal = totalFor(products);
  const discount = promoApplied ? subtotal * 0.10 : 0;
  const shipping = subtotal - discount >= 50 ? 0 : 6.50;
  const tax = (subtotal - discount) * 0.08;
  const total = Math.max(0, subtotal - discount + shipping + tax);

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8">
      <div className="space-y-3">
        {lines.map(line => {
          const p = products.find(x => x.id === line.id);
          if (!p) return null;
          return (
            <div key={line.id} className="card p-3 sm:p-4 flex gap-4 items-center">
              <ProductIllustration category={p.category} icon={p.icon} className="aspect-square h-20 w-20 rounded-2xl shrink-0" size={40} />
              <div className="flex-1 min-w-0">
                <Link href={`/product/${p.id}`} className="font-semibold hover:text-brand line-clamp-1">{p.name}</Link>
                <div className="text-xs text-muted">SKU {p.sku}</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-line bg-surface">
                    <button onClick={() => setQty(line.id, line.qty - 1)} className="px-2.5 py-1.5 hover:bg-elev rounded-l-full" aria-label="Decrease">
                      <Icon.minus width={12} height={12} />
                    </button>
                    <span className="px-3 text-xs font-semibold min-w-[24px] text-center">{line.qty}</span>
                    <button onClick={() => setQty(line.id, line.qty + 1)} className="px-2.5 py-1.5 hover:bg-elev rounded-r-full" aria-label="Increase">
                      <Icon.plus width={12} height={12} />
                    </button>
                  </div>
                  <button onClick={() => remove(line.id)} className="text-xs text-muted hover:text-danger flex items-center gap-1">
                    <Icon.trash width={12} height={12} /> Remove
                  </button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold">${(p.price * line.qty).toFixed(2)}</div>
                <div className="text-xs text-muted">${p.price.toFixed(2)} each</div>
              </div>
            </div>
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
            <SummaryRow label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
            {promoApplied && <SummaryRow label="Promo (VOLT10)" value={`-$${discount.toFixed(2)}`} accent="text-success" />}
            <SummaryRow label="Shipping" value={shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`} />
            <SummaryRow label="Estimated tax (8%)" value={`$${tax.toFixed(2)}`} />
            <div className="border-t border-line pt-3 flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="gradient-text">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-5">
            <label className="text-xs uppercase tracking-wide text-muted font-semibold">Promo code</label>
            <div className="flex gap-2 mt-1.5">
              <input className="input" placeholder="VOLT10" value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} />
              <button
                onClick={() => setPromoApplied(promo.trim() === 'VOLT10')}
                className="btn-ghost !px-3"
              >Apply</button>
            </div>
            {promoApplied && <div className="text-xs text-success mt-2 flex items-center gap-1"><Icon.check width={12} height={12} /> VOLT10 applied — 10% off!</div>}
            {!promoApplied && promo && <div className="text-xs text-muted mt-2">Try <span className="font-mono">VOLT10</span></div>}
          </div>

          <Link href="/checkout" className="btn-primary w-full justify-center mt-6">
            Checkout securely <Icon.arrow width={16} height={16} />
          </Link>

          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-muted">
            <Icon.shield width={14} height={14} /> 256-bit SSL · 30-day returns
          </div>
        </div>
      </aside>
    </div>
  );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={`font-semibold ${accent || 'text-ink'}`}>{value}</span>
    </div>
  );
}
