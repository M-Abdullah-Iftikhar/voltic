'use client';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';

type Item = {
  id: string;
  firstName: string;
  country?: string;
  productName: string;
  productId?: string;
  date: string;
};

const TICK_MS = 4200;

export function PurchaseTicker({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [idx, setIdx] = useState(0);

  // Soft-refresh every 60s so the ticker stays current without server reload.
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const res = await fetch('/api/orders/recent', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.items) && data.items.length) setItems(data.items);
      } catch { /* fail open */ }
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), TICK_MS);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;

  const current = items[idx];

  return (
    <div className="flex items-center gap-3 glass rounded-full pl-2 pr-4 py-2 text-xs shadow-soft" aria-live="polite">
      <span className="relative grid place-items-center h-7 w-7 rounded-full bg-success/20 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-success/30 animate-pulseRing" />
        <Icon.check width={12} height={12} className="text-success relative" />
      </span>
      <div key={current.id} className="overflow-hidden">
        <p
          className="leading-tight whitespace-nowrap"
          style={{ animation: `tickerUp ${TICK_MS}ms ease-in-out both` }}
        >
          <span className="font-semibold text-ink">{current.firstName}</span>
          {current.country && <span className="text-muted"> from {current.country}</span>}
          <span className="text-muted"> just got </span>
          <span className="font-semibold text-ink">{current.productName}</span>
        </p>
      </div>
    </div>
  );
}
