'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/Icons';

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/admin';

  const [username, setU] = useState('arizz@gmail.com');
  const [password, setP] = useState('arizz123#');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    setLoading(false);
    if (res.ok) router.push(next);
    else setErr('Invalid credentials. Try again.');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-bg">
      {/* Brand panel */}
      <div className="relative hidden lg:flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute inset-0 noise" />
        <div className="relative z-10 max-w-md p-12">
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-2xl">
            <span className="grid place-items-center h-10 w-10 rounded-2xl text-white" style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}>
              <Icon.bolt width={22} height={22} />
            </span>
            Voltik
          </Link>
          <h1 className="font-display font-bold text-4xl mt-10 leading-tight">
            Run your <span className="gradient-text">storefront</span> from one console.
          </h1>
          <p className="text-muted mt-4">Live revenue, orders, customers and products — all in one place. Designed for the people who actually ship things.</p>

          <ul className="mt-10 space-y-3">
            {['Real-time dashboard analytics','Inventory & SKU management','Order lifecycle tracking','Customer segmentation'].map(t => (
              <li key={t} className="flex items-center gap-2 text-sm">
                <Icon.check width={16} height={16} className="text-success" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden flex items-center gap-2 font-display font-bold text-xl mb-8">
            <span className="grid place-items-center h-9 w-9 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}>
              <Icon.bolt width={20} height={20} />
            </span>
            Voltik
          </Link>

          <h2 className="font-display font-bold text-3xl">Welcome back</h2>
          <p className="text-muted text-sm mt-2">Sign in to the Voltik admin console.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-muted font-semibold">Email</span>
              <input className="input mt-1.5" type="email" value={username} onChange={e => setU(e.target.value)} autoFocus />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-muted font-semibold">Password</span>
              <div className="relative mt-1.5">
                <input className="input pr-12" type={show ? 'text' : 'password'} value={password} onChange={e => setP(e.target.value)} />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs">
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {err && <div className="text-sm text-danger flex items-center gap-2"><Icon.close width={14} height={14} /> {err}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center !py-3 disabled:opacity-60">
              {loading ? 'Signing in…' : <>Sign in <Icon.arrow width={16} height={16} /></>}
            </button>
          </form>

          <div className="mt-6 card p-4 text-xs text-muted">
            <div className="font-semibold text-ink mb-1">Admin credentials</div>
            Username <span className="font-mono text-ink">arizz@gmail.com</span> · Password <span className="font-mono text-ink">arizz123#</span>
            <div className="mt-1 text-[10px] text-muted/80">Override via the <span className="font-mono">ADMIN_USER</span> / <span className="font-mono">ADMIN_PASS</span> env vars.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
