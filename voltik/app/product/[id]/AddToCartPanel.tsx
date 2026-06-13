'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icons';
import { useCart } from '@/components/CartContext';

export function AddToCartPanel({ productId, stock }: { productId: string; stock: number }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const inStock = stock > 0;
  const lowStock = stock < 30;

  const handleAdd = () => {
    add(productId, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mt-7 space-y-3">
      <div className="flex items-center gap-2 text-xs">
        <span className={`grid place-items-center h-2 w-2 rounded-full ${inStock ? 'bg-success' : 'bg-danger'}`} />
        <span className={inStock ? 'text-success' : 'text-danger'}>
          {inStock ? `In stock (${stock} available)` : 'Out of stock'}
        </span>
        {inStock && lowStock && <span className="text-warn">· Low stock — order soon</span>}
      </div>

      <div className="flex flex-wrap items-stretch gap-3">
        <div className="flex items-center rounded-full border border-line bg-surface overflow-hidden">
          <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-elev" aria-label="Decrease">
            <Icon.minus width={14} height={14} />
          </button>
          <span className="px-4 font-semibold text-sm min-w-[28px] text-center">{qty}</span>
          <button onClick={() => setQty(q => Math.min(stock || 99, q + 1))} className="px-3 py-2 hover:bg-elev" aria-label="Increase">
            <Icon.plus width={14} height={14} />
          </button>
        </div>

        <button
          onClick={handleAdd}
          disabled={!inStock}
          className={`flex-1 btn-primary justify-center transition-all ${added ? '!bg-success' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {added ? <><Icon.check width={16} height={16} /> Added to cart</> : <><Icon.cart width={16} height={16} /> Add to cart</>}
        </button>

        <Link href="/cart" className="btn-ghost justify-center">
          View cart
        </Link>
      </div>
    </div>
  );
}
