'use client';
import { useState } from 'react';
import { Icon } from '@/components/Icons';

/** Pesters the user to verify their email; one-tap resend. */
export function VerifyEmailBanner({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const resend = async () => {
    setBusy(true); setErr('');
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resend' })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error || 'Could not resend.'); return; }
    setDone(true);
    setTimeout(() => setDone(false), 4000);
  };

  return (
    <div className="card p-5 border-warn/30 bg-warn/5 flex flex-wrap items-center gap-4">
      <span
        className="grid place-items-center h-10 w-10 rounded-xl text-white shrink-0"
        style={{ background: 'linear-gradient(135deg,rgb(var(--warn)),rgb(var(--brand)))' }}
        aria-hidden
      >
        <Icon.shield width={18} height={18} />
      </span>
      <div className="flex-1 min-w-[200px]">
        <div className="font-display font-bold text-sm text-ink">Verify your email</div>
        <p className="text-xs text-muted mt-1">
          We sent a link to <span className="font-mono">{email}</span>. Click it to unlock review writing and faster checkout.
        </p>
        {err  && <div className="text-[11px] text-danger mt-1 flex items-center gap-1"><Icon.close width={10} height={10} /> {err}</div>}
        {done && <div className="text-[11px] text-success mt-1 flex items-center gap-1"><Icon.check width={10} height={10} /> New link sent.</div>}
      </div>
      <button onClick={resend} disabled={busy} className="btn-ghost text-xs disabled:opacity-60">
        {busy ? 'Sending…' : 'Resend link'}
      </button>
    </div>
  );
}
