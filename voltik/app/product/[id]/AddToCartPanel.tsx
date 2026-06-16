'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icons';
import { useCart } from '@/components/CartContext';
import { useFlyToCart } from '@/components/FlyToCartContext';
import { QuantityStepper } from '@/components/QuantityStepper';
import { LiveStockPanel } from '@/components/LiveStockPanel';
import { haptic } from '@/lib/haptics';
import { brandSound } from '@/lib/brandSound';
import { NotifyMeWhenInStock } from './NotifyMeWhenInStock';

export function AddToCartPanel({ productId, stock }: { productId: string; stock: number }) {
  const { add } = useCart();
  const { flyToCart } = useFlyToCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const inStock = stock > 0;
  const lowStock = stock < 30;

  const handleAdd = () => {
    add(productId, qty);
    flyToCart(btnRef.current);
    haptic('success');
    brandSound('success');
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mt-7 space-y-3">
      <LiveStockPanel initialStock={stock} productId={productId} />

      <div className="flex flex-wrap items-stretch gap-3">
        <QuantityStepper value={qty} onChange={setQty} min={1} max={stock || 99} />

        <button
          ref={btnRef}
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

      {!inStock && <NotifyMeWhenInStock productId={productId} />}
    </div>
  );
}
