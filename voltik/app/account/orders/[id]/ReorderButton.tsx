'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icons';
import { useCart } from '@/components/CartContext';
import type { CartLine } from '@/lib/types';

interface Props {
  lines: CartLine[];
  /** Ids that still exist + are in stock — others are silently skipped with a notice. */
  availableIds: string[];
}

export function ReorderButton({ lines, availableIds }: Props) {
  const router = useRouter();
  const { add } = useCart();
  const [done, setDone] = useState(false);

  const available = lines.filter(l => availableIds.includes(l.id));
  const skipped = lines.length - available.length;
  if (available.length === 0) return null;

  const reorder = () => {
    available.forEach(l => add(l.id, l.qty));
    setDone(true);
    // Give the cart context a beat to persist before navigating.
    setTimeout(() => router.push('/cart'), 320);
  };

  return (
    <div className="flex items-center gap-3">
      <button onClick={reorder} disabled={done} className="btn-ghost text-xs disabled:opacity-60">
        {done
          ? <><Icon.check width={12} height={12} /> Added to cart</>
          : <><Icon.refresh width={12} height={12} /> Reorder these items</>}
      </button>
      {skipped > 0 && (
        <span className="text-[11px] text-muted">
          ({skipped} {skipped === 1 ? 'item is' : 'items are'} no longer available)
        </span>
      )}
    </div>
  );
}
