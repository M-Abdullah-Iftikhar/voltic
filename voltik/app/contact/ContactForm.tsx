'use client';
import { useState } from 'react';
import { Icon } from '@/components/Icons';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Support');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Wire-up only — sending mail is out of scope for this prototype.
    setSent(true);
    setName(''); setEmail(''); setMessage('');
  };

  if (sent) {
    return (
      <div className="card p-6 flex items-start gap-3 border-success/30 bg-success/5">
        <Icon.check width={20} height={20} className="text-success shrink-0 mt-0.5" />
        <div>
          <div className="font-display font-bold text-ink">Message received</div>
          <p className="text-sm text-muted mt-1">We'll reply to you within one business day. Check your spam folder if you don't see anything soon.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-6 grid sm:grid-cols-2 gap-4 not-prose">
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-muted font-semibold">Name</span>
        <input className="input mt-1.5" required value={name} onChange={e => setName(e.target.value)} />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-muted font-semibold">Email</span>
        <input type="email" className="input mt-1.5" required value={email} onChange={e => setEmail(e.target.value)} />
      </label>
      <label className="block sm:col-span-2">
        <span className="text-xs uppercase tracking-wide text-muted font-semibold">Topic</span>
        <select className="input mt-1.5" value={topic} onChange={e => setTopic(e.target.value)}>
          <option>Support</option>
          <option>Sales / B2B</option>
          <option>Press / media</option>
          <option>Other</option>
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className="text-xs uppercase tracking-wide text-muted font-semibold">Message</span>
        <textarea rows={5} className="input mt-1.5" required value={message} onChange={e => setMessage(e.target.value)} />
      </label>
      <div className="sm:col-span-2 flex justify-end">
        <button type="submit" className="btn-primary">
          Send message <Icon.arrow width={14} height={14} />
        </button>
      </div>
    </form>
  );
}
