'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icons';

/**
 * Inline "How do I get a code?" hint trigger. Click expands a small
 * card under the promo input with the public promo channels. Closes on
 * click-outside / Escape / tab-away so it never steals focus on mobile.
 */
export function PromoCodeHint() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="text-[11px] text-muted hover:text-brand inline-flex items-center gap-1 underline-offset-2 hover:underline transition"
      >
        <Icon.spark width={10} height={10} />
        How do I get a code?
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="How to get a promo code"
          className="absolute left-0 right-0 z-30 mt-2 card p-4 animate-slidein text-xs leading-relaxed"
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="grid place-items-center h-9 w-9 rounded-xl text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,rgb(var(--accent2)),rgb(var(--brand)))' }}
            >
              <Icon.bolt width={14} height={14} />
            </span>
            <div className="min-w-0">
              <div className="font-display font-bold text-sm text-ink">A few ways to score one</div>
              <ul className="mt-2 space-y-2 text-muted">
                <li className="flex gap-2">
                  <Icon.check width={12} height={12} className="text-brand shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Newsletter signup</strong> — instant <span className="font-mono text-brand">WELCOME10</span> for 10% off your first order.
                  </span>
                </li>
                <li className="flex gap-2">
                  <Icon.check width={12} height={12} className="text-brand shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Spend $50+</strong> — auto-eligible for free shipping. Try <span className="font-mono text-brand">FREESHIP</span>.
                  </span>
                </li>
                <li className="flex gap-2">
                  <Icon.check width={12} height={12} className="text-brand shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Seasonal drops</strong> — codes go out on our newsletter + posted at <Link href="/faq#promo" className="text-brand hover:underline">/faq</Link>.
                  </span>
                </li>
              </ul>
              <div className="mt-3 pt-3 border-t border-line/60">
                <span className="text-muted">No code? No problem.</span>{' '}
                <Link href="/shop?sort=price-asc" className="text-brand hover:underline">Browse sale items</Link> instead.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
