'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icons';
import { ProductIllustration } from '@/components/ProductIllustration';
import { useCart } from '@/components/CartContext';
import { useFlyToCart } from '@/components/FlyToCartContext';
import { haptic } from '@/lib/haptics';
import type { EnrichedProduct } from '@/lib/types';

/** Sticky bottom bar that appears when the primary "Add to cart" button
 *  scrolls offscreen. Mirrors the action so users never lose the CTA. */
export function StickyAddToCart({ product }: { product: EnrichedProduct }) {
  const { add } = useCart();
  const { flyToCart } = useFlyToCart();
  const [visible, setVisible] = useState(false);
  const [added, setAdded] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // A sentinel rendered next to the in-flow Add panel — once it's offscreen
  // (scrolled past), show the sticky bar. IntersectionObserver is cheap.
  useEffect(() => {
    const id = 'voltik-sticky-cta-sentinel';
    const el = document.getElementById(id);
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    }, { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onAdd = () => {
    add(product.id, 1);
    flyToCart(imageRef.current);
    haptic('success');
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  if (product.stock <= 0) return null;

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <div
      ref={sentinelRef}
      aria-hidden={!visible}
      // On mobile the MobileNavBar already sits at bottom:0 (~64px tall);
      // we pin this bar just above it and honour iOS safe-area. On sm+
      // there's no bottom dock so we land back at bottom:0.
      className={`fixed inset-x-0 z-30 transition-transform duration-300 ease-out
        bottom-[calc(64px+env(safe-area-inset-bottom,0px))] sm:bottom-0
        ${visible ? 'translate-y-0' : 'translate-y-[calc(100%+72px)]'}`}
    >
      <div className="container-x pb-3 pt-2 sm:pt-0">
        <div className="glass rounded-2xl shadow-card p-3 flex items-center gap-3">
          <div ref={imageRef} className="shrink-0 relative">
            <ProductIllustration category={product.category} icon={product.icon} className="h-12 w-12 rounded-xl" size={22} />
            {discount > 0 && (
              <span className="absolute -top-1 -right-1 chip bg-danger text-white !text-[9px] !px-1.5 !py-0.5">
                −{discount}%
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold line-clamp-1">{product.name}</div>
            <div className="text-xs text-muted flex items-baseline gap-2 flex-wrap">
              <span className="text-base font-bold gradient-text">${product.price.toFixed(2)}</span>
              {product.oldPrice && <span className="line-through">${product.oldPrice.toFixed(2)}</span>}
              {product.stock < 10 && (
                <span className="text-warn">· {product.stock} left</span>
              )}
            </div>
          </div>
          <button
            onClick={onAdd}
            // 44px min height is Apple HIG's mobile target; sm+ shrinks back.
            className={`btn-primary !px-4 !py-3 sm:!py-2.5 text-sm transition-all min-h-[44px] ${added ? '!bg-success' : ''}`}
            aria-label={added ? 'Added to cart' : `Add ${product.name} to cart`}
          >
            {added
              ? <><Icon.check width={14} height={14} /> <span className="hidden sm:inline">Added</span></>
              : <><Icon.cart width={14} height={14} /> <span className="hidden sm:inline">Add to cart</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}
