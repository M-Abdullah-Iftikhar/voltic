'use client';
import { useState } from 'react';
import { Icon } from '@/components/Icons';
import { useUser } from '@/components/UserContext';

/**
 * Renders only on OOS products. Captures an email; once stock comes back
 * the admin can fan out emails by draining the queue.
 */
export function NotifyMeWhenInStock({ productId }: { productId: string }) {
  const { user } = useUser();
  const [email, setEmail] = useState(user?.email || '');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setErr('Enter a valid email.'); return; }
    setBusy(true); setErr('');
    const res = await fetch(`/api/products/${encodeURIComponent(productId)}/back-in-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error || 'Could not save request.'); return; }
    setDone(true);
  };

  if (done) {
    return (
      <div className="mt-5 card p-4 border-success/30 bg-success/5 flex items-start gap-3">
        <Icon.check width={18} height={18} className="text-success shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-ink">You're on the list</div>
          <p className="text-xs text-muted mt-0.5">We'll email <span className="font-mono">{email}</span> as soon as it ships again.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon.spark width={16} height={16} className="text-brand" />
        <h4 className="text-sm font-semibold text-ink">Notify me when it's back</h4>
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setErr(''); }}
          placeholder="you@example.com"
          className="input"
          disabled={busy}
          suppressHydrationWarning
        />
        <button type="submit" disabled={busy} className="btn-primary !px-4 disabled:opacity-60">
          {busy ? '…' : 'Notify me'}
        </button>
      </div>
      {err && <div className="text-xs text-danger flex items-center gap-1"><Icon.close width={10} height={10} /> {err}</div>}
      <p className="text-[11px] text-muted">One-time email — we won't add you to the newsletter.</p>
    </form>
  );
}
