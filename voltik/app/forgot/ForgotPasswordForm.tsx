'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icons';
import { AuthHero } from '@/components/AuthHero';
import { FloatingInput } from '@/components/FloatingInput';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error || 'Could not send reset link.'); return; }
    setDone(true);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-bg">
      <AuthHero
        headline={<>Forgot? <span className="gradient-text">No problem.</span></>}
        bullets={['One-time reset link', 'Valid for 60 minutes', 'No password questions, no support tickets']} />

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden flex items-center gap-2 font-display font-bold text-xl mb-8">
            <span className="grid place-items-center h-9 w-9 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}>
              <Icon.bolt width={20} height={20} />
            </span>
            Voltik
          </Link>

          <h2 className="font-display font-bold text-3xl">Reset your password</h2>
          <p className="text-muted text-sm mt-2">
            Enter your email and we'll send a one-time link to set a new password.
          </p>

          {done ? (
            <div className="mt-7 card p-5 border-success/30 bg-success/5 flex items-start gap-3">
              <Icon.check width={20} height={20} className="text-success shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-ink">Check your inbox</div>
                <p className="text-xs text-muted mt-1">
                  If <span className="font-mono">{email}</span> is on file, we just sent a reset link.
                  It expires in 60 minutes.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-7 space-y-4">
              <FloatingInput
                label="Email"
                type="email" required autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                validateOnBlur
                validate={v => v && !/^\S+@\S+\.\S+$/.test(v) ? 'Please enter a valid email.' : null}
              />
              {err && <div className="text-sm text-danger flex items-center gap-2"><Icon.close width={14} height={14} /> {err}</div>}
              <button type="submit" disabled={busy} className="btn-primary w-full justify-center !py-3 disabled:opacity-60">
                {busy ? 'Sending…' : <>Send reset link <Icon.arrow width={16} height={16} /></>}
              </button>
            </form>
          )}

          <p className="text-xs text-muted mt-6 text-center">
            Remembered it? <Link href="/login" className="text-brand hover:underline font-semibold">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
