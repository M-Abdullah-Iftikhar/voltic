'use client';
import { useState } from 'react';
import { Icon } from './Icons';

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setDone(true);
    setTimeout(() => { setDone(false); setEmail(''); }, 2400);
  };

  if (compact) {
    return (
      <form className="flex gap-2" onSubmit={submit}>
        <input value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="Email address" />
        <button type="submit" className="btn-primary !px-4" aria-label="Subscribe">
          {done ? <Icon.check width={16} height={16} /> : <Icon.arrow width={16} height={16} />}
        </button>
      </form>
    );
  }

  return (
    <form className="mt-7 max-w-md mx-auto flex gap-2" onSubmit={submit}>
      <input value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
      <button type="submit" className="btn-primary">
        {done ? <>Subscribed <Icon.check width={14} height={14} /></> : 'Subscribe'}
      </button>
    </form>
  );
}
