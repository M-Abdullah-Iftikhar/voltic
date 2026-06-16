'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icons';
import { SpinTheWheel } from '@/components/SpinTheWheel';

const SEEN_KEY = 'voltik:spin-claimed';

/**
 * Spin-to-win page client. Wraps SpinTheWheel with the email-capture flow:
 * a winning spin reveals the code AND offers to save it to the subscriber
 * list so the visitor can find it later. We persist a per-browser flag so
 * users can't spin again from the same device.
 */
export function SpinPageClient() {
  const [email, setEmail] = useState('');
  const [emailed, setEmailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [won, setWon] = useState<{ label: string; code: string } | null>(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SEEN_KEY);
      if (raw) {
        setAlreadyClaimed(true);
        const parsed = JSON.parse(raw) as { label: string; code: string };
        if (parsed?.code) setWon(parsed);
      }
    } catch {}
  }, []);

  const handleWin = (slice: { label: string; code: string }) => {
    setWon(slice);
    try {
      window.localStorage.setItem(SEEN_KEY, JSON.stringify({ label: slice.label, code: slice.code }));
    } catch {}
  };

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setBusy(true);
    try {
      await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'spin' })
      });
      setEmailed(true);
    } catch {
      setEmailed(true);   // user-visible state is the same; soft-fail
    }
    setBusy(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <header className="text-center mb-10">
        <span className="text-xs uppercase tracking-[0.18em] font-semibold text-accent2">Voltik Roulette</span>
        <h1 className="font-display font-bold text-3xl sm:text-5xl mt-2 leading-tight">
          Spin once. Win something.
        </h1>
        <p className="text-muted text-sm sm:text-base mt-3 max-w-xl mx-auto leading-relaxed">
          Every visit, one of eight wedges has your name on it. Discounts, free shipping,
          even the occasional pair of Volt Buds. No purchase required.
        </p>
      </header>

      <div className="card p-8 sm:p-12 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-mesh opacity-60" />
        <div className="relative">
          {alreadyClaimed && won ? (
            <div className="text-center max-w-md mx-auto">
              <span className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">Your prize</span>
              <h2 className="font-display font-bold text-2xl mt-2">{won.label}</h2>
              {won.code && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand/10 border border-brand/30 px-4 py-2 text-sm">
                  <span className="text-xs uppercase tracking-wide text-muted font-semibold">Code</span>
                  <span className="font-mono font-bold text-brand">{won.code}</span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(won.code)}
                    className="text-[11px] text-muted hover:text-brand"
                  >
                    Copy
                  </button>
                </div>
              )}
              <p className="text-xs text-muted mt-4">
                Come back tomorrow for another spin — one per browser per day.
              </p>
            </div>
          ) : (
            <SpinTheWheel onWin={handleWin} />
          )}
        </div>
      </div>

      {/* Post-win email capture */}
      {won?.code && !emailed && (
        <div className="mt-8 card p-6 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="grid place-items-center h-10 w-10 rounded-xl text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,rgb(var(--accent2)),rgb(var(--brand)))' }}
            >
              <Icon.bolt width={18} height={18} />
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-sm">Email it to yourself</h3>
              <p className="text-xs text-muted mt-1">
                We'll save the code in your inbox so it doesn't get lost. No spam — promise.
              </p>
              <form onSubmit={subscribe} className="mt-3 flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                  suppressHydrationWarning
                />
                <button type="submit" disabled={busy} className="btn-primary !px-4 disabled:opacity-60">
                  {busy ? '…' : 'Send it'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {emailed && (
        <div className="mt-6 card p-4 max-w-md mx-auto border-success/30 bg-success/5 flex items-center gap-2 text-sm text-success">
          <Icon.check width={14} height={14} />
          Saved. Watch <span className="font-mono">{email}</span> for the reminder.
        </div>
      )}

      <div className="text-center mt-10 text-xs text-muted">
        <Link href="/shop" className="text-brand hover:underline">Or skip the spin and shop directly →</Link>
      </div>
    </div>
  );
}
