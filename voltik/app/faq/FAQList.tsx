'use client';
import { useState } from 'react';
import { Icon } from '@/components/Icons';

export function FAQList({ items }: { items: { q: string; a: string }[] }) {
  // Track which entries are expanded — first one open by default.
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });

  return (
    <div className="not-prose space-y-2">
      {items.map((it, i) => {
        const isOpen = !!open[i];
        return (
          <div key={i} className="card overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(prev => ({ ...prev, [i]: !isOpen }))}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-elev/40 transition"
            >
              <span className="font-semibold text-ink">{it.q}</span>
              <Icon.plus
                width={16}
                height={16}
                className={`text-muted shrink-0 transition-transform ${isOpen ? 'rotate-45' : ''}`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-sm text-muted leading-relaxed border-t border-line/60 pt-3">
                {it.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
