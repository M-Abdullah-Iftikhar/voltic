'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from './Icons';
import { useUser } from './UserContext';

const SEEN_KEY  = 'voltik:exit-intent-seen';
const PROMO_CODE = 'WELCOME10';

/**
 * Exit-intent capture for first-time visitors: detects a fast mouse-leave
 * to the top of the viewport (the classic "going for the URL bar" gesture)
 * and surfaces a 10% off offer.
 *
 * Strict opt-out: shown once per browser, never to signed-in users, never
 * on admin/auth/checkout routes. Persists the choice in localStorage so
 * it can't bother the same visitor again.
 */
export function ExitIntentModal() {
  const path = usePathname() || '';
  const { user, loading } = useUser();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailed, setEmailed] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  // Routes where we never trigger — anywhere the visitor is mid-transaction
  // or in the admin console.
  const SUPPRESS = ['/cart', '/checkout', '/admin', '/login', '/signup', '/forgot', '/reset', '/verify', '/account'];
  const suppressed = SUPPRESS.some(p => path === p || path.startsWith(`${p}/`));

  useEffect(() => {
    if (loading) return;
    if (user) return;            // signed-in already
    if (suppressed) return;
    let seen = false;
    try { seen = !!window.localStorage.getItem(SEEN_KEY); } catch {}
    if (seen) return;

    let armed = false;
    // Arm only after the user has been on the page for 4s — keeps drive-by
    // bounces from triggering it.
    const armT = setTimeout(() => { armed = true; }, 4000);

    const onLeave = (e: MouseEvent) => {
      // Top-of-viewport leave + arm flag = exit intent.
      if (armed && e.clientY <= 0 && e.relatedTarget == null) {
        setOpen(true);
        markSeen();
        cleanup();
      }
    };
    const onBlur = () => {
      // Tab-switch on mobile-ish viewports also counts — last-chance offer.
      if (armed && window.matchMedia('(max-width: 640px)').matches) {
        setOpen(true);
        markSeen();
        cleanup();
      }
    };
    const cleanup = () => {
      document.removeEventListener('mouseout', onLeave);
      window.removeEventListener('blur', onBlur);
    };
    document.addEventListener('mouseout', onLeave);
    window.addEventListener('blur', onBlur, { once: true });

    return () => {
      clearTimeout(armT);
      cleanup();
    };
  }, [user, loading, suppressed]);

  const markSeen = () => {
    try { window.localStorage.setItem(SEEN_KEY, '1'); } catch {}
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked — fall back to highlighting the code on screen.
      const el = document.getElementById('voltik-exit-code');
      if (el && window.getSelection) {
        const r = document.createRange();
        r.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(r);
      }
    }
  };

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setBusy(true);
    try {
      await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'exit-intent' })
      });
      setEmailed(true);
    } catch {
      setEmailed(true);   // user-visible state is the same; soft-fail
    }
    setBusy(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="exit-intent-title"
      className="fixed inset-0 z-[70] grid place-items-center p-4 bg-bg/70 backdrop-blur-sm animate-fadein"
      onClick={() => setOpen(false)}
    >
      <div
        className="card max-w-md w-full p-0 overflow-hidden animate-slidein"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative p-6 sm:p-7 bg-mesh">
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute top-3 right-3 grid place-items-center h-9 w-9 rounded-full bg-bg/50 hover:bg-bg text-ink"
          >
            <Icon.close width={14} height={14} />
          </button>
          <span
            className="inline-grid place-items-center h-12 w-12 rounded-2xl text-white"
            style={{ background: 'linear-gradient(135deg,rgb(var(--accent2)),rgb(var(--brand)))' }}
            aria-hidden
          >
            <Icon.bolt width={22} height={22} />
          </span>
          <h2 id="exit-intent-title" className="font-display font-bold text-2xl sm:text-3xl mt-4 leading-tight">
            Don't leave empty-handed.
          </h2>
          <p className="text-muted mt-2">
            Use this one-time code for <span className="text-ink font-semibold">10% off</span> your first order — yours to keep.
          </p>
        </div>

        <div className="p-6 sm:p-7 space-y-4">
          <div className="flex items-stretch gap-2">
            <div className="flex-1 rounded-xl border-2 border-dashed border-brand/40 bg-brand/5 px-4 py-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Your code</div>
              <div id="voltik-exit-code" className="font-mono font-bold text-xl text-brand mt-0.5 tracking-widest select-all">
                {PROMO_CODE}
              </div>
            </div>
            <button
              onClick={copy}
              className="btn-primary !px-4"
              aria-label="Copy code"
            >
              {copied ? <><Icon.check width={14} height={14} /> Copied</> : <><Icon.refresh width={14} height={14} /> Copy</>}
            </button>
          </div>

          {emailed ? (
            <div className="rounded-xl border border-success/30 bg-success/5 p-3 text-xs text-success flex items-center gap-2">
              <Icon.check width={12} height={12} /> We'll email more drops to <span className="font-mono">{email}</span>.
            </div>
          ) : (
            <form onSubmit={subscribe} className="space-y-2">
              <label className="text-xs text-muted">
                Want a reminder? We'll email it to you (zero spam, unsubscribe anytime).
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                  required
                  suppressHydrationWarning
                />
                <button type="submit" disabled={busy} className="btn-ghost text-sm disabled:opacity-60">
                  {busy ? '…' : 'Email me'}
                </button>
              </div>
            </form>
          )}

          <button
            onClick={() => setOpen(false)}
            className="w-full text-xs text-muted hover:text-ink pt-1"
          >
            No thanks, I'll keep browsing
          </button>
        </div>
      </div>
    </div>
  );
}
