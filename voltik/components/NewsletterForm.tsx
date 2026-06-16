'use client';
import { useRef, useState } from 'react';
import { Icon } from './Icons';
import { Confetti } from './Confetti';

export function NewsletterForm({ compact = false, source }: { compact?: boolean; source?: string }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  // Bumping this key triggers a fresh confetti burst from the submit button.
  const [confettiKey, setConfettiKey] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setErr('Please enter a valid email.'); return; }
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: source || (compact ? 'footer' : 'hero') })
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Could not subscribe.'); setBusy(false); return; }
      setDone(true);
      setBusy(false);
      setConfettiKey(k => k + 1);
      setTimeout(() => { setDone(false); setEmail(''); }, 2400);
    } catch {
      setErr('Network error — try again.');
      setBusy(false);
    }
  };

  if (compact) {
    return (
      <form className="flex flex-col gap-1" onSubmit={submit}>
        <div className="flex gap-2">
          <input
            value={email}
            onChange={e => { setEmail(e.target.value); setErr(''); }}
            className="input"
            type="email"
            placeholder="Email address"
            disabled={busy}
            suppressHydrationWarning
          />
          <button type="submit" disabled={busy} className="btn-primary !px-4 disabled:opacity-60" aria-label="Subscribe" suppressHydrationWarning>
            {done ? <Icon.check width={16} height={16} /> : <Icon.arrow width={16} height={16} />}
          </button>
        </div>
        {err && <div className="text-[11px] text-danger mt-1 flex items-center gap-1"><Icon.close width={10} height={10} /> {err}</div>}
        {done && <div className="text-[11px] text-success mt-1 flex items-center gap-1"><Icon.check width={10} height={10} /> You're on the list!</div>}
      </form>
    );
  }

  return (
    <div className="mt-7 max-w-md mx-auto relative">
      <Confetti trigger={confettiKey} originRef={buttonRef} />
      <form className="flex gap-2" onSubmit={submit}>
        <input
          value={email}
          onChange={e => { setEmail(e.target.value); setErr(''); }}
          className="input"
          type="email"
          placeholder="you@example.com"
          disabled={busy}
          suppressHydrationWarning
        />
        <button ref={buttonRef} type="submit" disabled={busy} className="btn-primary disabled:opacity-60" suppressHydrationWarning>
          {done ? <>Subscribed <Icon.check width={14} height={14} /></> : busy ? 'Subscribing…' : 'Subscribe'}
        </button>
      </form>
      {err && <div className="text-xs text-danger mt-2 flex items-center justify-center gap-1"><Icon.close width={12} height={12} /> {err}</div>}
    </div>
  );
}
