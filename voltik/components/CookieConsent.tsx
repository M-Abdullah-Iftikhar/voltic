'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icons';

const KEY = 'voltik:cookie-consent';

/**
 * Lightweight cookie banner. We only set strictly-necessary cookies, so this
 * is informational + opt-out for the (currently empty) analytics bucket.
 * Mounts globally from RootLayout; renders nothing on the server to avoid
 * hydration mismatch on the consent state.
 */
export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) setShow(true);
    } catch {
      // localStorage blocked — surface the banner so we never silently track.
      setShow(true);
    }
  }, []);

  const persist = (value: 'all' | 'necessary') => {
    try { window.localStorage.setItem(KEY, value); } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-md z-[60] animate-slidein"
    >
      <div className="card p-5 shadow-card">
        <div className="flex items-start gap-3">
          <span
            className="grid place-items-center h-9 w-9 rounded-xl text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}
            aria-hidden
          >
            <Icon.shield width={16} height={16} />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-sm">We respect your privacy</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Voltik uses only strictly-necessary cookies to keep you signed in and remember
              your cart. No third-party tracking. See our <Link href="/cookies" className="text-brand hover:underline">cookie policy</Link>.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => persist('necessary')} className="btn-ghost text-xs !px-3 !py-1.5">
                Necessary only
              </button>
              <button onClick={() => persist('all')} className="btn-primary text-xs !px-3 !py-1.5">
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
