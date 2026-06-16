'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icons';

/**
 * Sticky promo bar above the navbar. Default messages can be overridden by
 * the `NEXT_PUBLIC_PROMO_MESSAGES` env var (pipe-separated) and the
 * `NEXT_PUBLIC_PROMO_LINK` env var. Cycles through the messages with a
 * crossfade so the strip never looks static. Dismissible per browser.
 */

const DEFAULT_MESSAGES = [
  '⚡ Free worldwide shipping on orders over $50',
  '🚚 2-day express delivery to most cities',
  '🆕 Volt Buds Pro 2 — now in stock with adaptive ANC',
  '🎁 Use code VOLT10 for 10% off your first order',
  '🔋 GaN Cube 100W — 30% off ends Sunday'
];

function parseEnvList(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  return value.split('|').map(s => s.trim()).filter(Boolean);
}

const STORAGE_KEY = 'voltik:promo-dismissed';

export function PromoBar() {
  const messages = parseEnvList(process.env.NEXT_PUBLIC_PROMO_MESSAGES, DEFAULT_MESSAGES);
  const link     = process.env.NEXT_PUBLIC_PROMO_LINK || '/shop';
  const linkText = process.env.NEXT_PUBLIC_PROMO_LINK_TEXT || 'Shop now';

  const [idx, setIdx] = useState(0);
  const [dismissed, setDismissed] = useState(true);

  // Hydrate dismissal — default to NOT dismissed; only hide if user clicked ×.
  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(STORAGE_KEY) === '1');
    } catch { setDismissed(false); }
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const t = setInterval(() => setIdx(i => (i + 1) % messages.length), 4500);
    return () => clearInterval(t);
  }, [dismissed, messages.length]);

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch {}
  };

  return (
    <div
      className="relative overflow-hidden text-white text-xs sm:text-sm"
      style={{ background: 'linear-gradient(90deg, rgb(var(--brand)), rgb(var(--brand2)) 60%, rgb(var(--accent)))' }}
      role="status"
      aria-live="polite"
    >
      <div className="container-x flex items-center gap-3 py-2 min-h-[40px]">
        {/* Crossfading message stack */}
        <div className="relative flex-1 h-5">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`absolute inset-0 flex items-center transition-opacity duration-700 ${
                i === idx ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden={i !== idx}
            >
              <span className="truncate font-medium">{m}</span>
            </div>
          ))}
        </div>

        <Link
          href={link}
          className="hidden sm:inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline shrink-0"
        >
          {linkText}
          <Icon.arrow width={12} height={12} />
        </Link>

        {/* Indicator dots */}
        <div className="hidden md:flex items-center gap-1 shrink-0">
          {messages.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
              aria-label={`Show promo message ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={dismiss}
          className="shrink-0 grid place-items-center h-6 w-6 rounded-full hover:bg-white/15 transition"
          aria-label="Dismiss promo bar"
        >
          <Icon.close width={12} height={12} />
        </button>
      </div>
    </div>
  );
}
