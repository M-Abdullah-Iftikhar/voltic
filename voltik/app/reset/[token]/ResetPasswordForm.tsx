'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icons';
import { AuthHero } from '@/components/AuthHero';
import { FloatingInput } from '@/components/FloatingInput';
import { PasswordStrength } from '@/components/PasswordStrength';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setErr('Passwords do not match.'); return; }
    if (password.length < 6)   { setErr('Use at least 6 characters.'); return; }

    setBusy(true); setErr('');
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error || 'Could not reset password.'); return; }
    setDone(true);
    setTimeout(() => router.push('/login'), 1800);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-bg">
      <AuthHero
        headline={<>Set a <span className="gradient-text">fresh</span> password.</>}
        bullets={['One link, one chance', 'Minimum 6 characters', 'Re-sign in with the new one']} />

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <h2 className="font-display font-bold text-3xl">Choose a new password</h2>
          <p className="text-muted text-sm mt-2">After saving, sign in with your new password.</p>

          {done ? (
            <div className="mt-7 card p-5 border-success/30 bg-success/5 flex items-start gap-3">
              <Icon.check width={20} height={20} className="text-success shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-ink">Password updated</div>
                <p className="text-xs text-muted mt-1">Redirecting to sign-in…</p>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-7 space-y-4">
              <div>
                <div className="relative">
                  <FloatingInput
                    label="New password (min. 6)"
                    type={show ? 'text' : 'password'}
                    required autoFocus
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pr-16"
                  />
                  <button type="button" onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-3 text-muted hover:text-ink text-xs z-10">
                    {show ? 'Hide' : 'Show'}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>
              <FloatingInput
                label="Confirm new password"
                type={show ? 'text' : 'password'}
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
              {err && <div className="text-sm text-danger flex items-center gap-2"><Icon.close width={14} height={14} /> {err}</div>}
              <button type="submit" disabled={busy} className="btn-primary w-full justify-center !py-3 disabled:opacity-60">
                {busy ? 'Saving…' : 'Update password'}
              </button>
            </form>
          )}

          <p className="text-xs text-muted mt-6 text-center">
            Need a new link? <Link href="/forgot" className="text-brand hover:underline font-semibold">Request another</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
