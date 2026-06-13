'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/Icons';
import { AuthHero } from '@/components/AuthHero';
import { useUser } from '@/components/UserContext';
import { readAnonymousCart } from '@/components/CartContext';

export function LoginPageClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';

  const { user, login, loading } = useUser();
  const [email, setEmail] = useState('demo@voltik.com');
  const [password, setPassword] = useState('demo123');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already authed? Bounce out.
  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, router, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setSubmitting(true);
    const merge = readAnonymousCart();
    const res = await login(email, password, merge);
    setSubmitting(false);
    if (!res.ok) { setErr(res.error || 'Login failed'); return; }
    router.push(next);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-bg">
      <AuthHero
        headline={<>Welcome back to <span className="gradient-text">Voltik.</span></>}
        bullets={['Cart syncs across all your devices','Save favourites for later','See your orders + write reviews','Faster checkout']} />

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden flex items-center gap-2 font-display font-bold text-xl mb-8">
            <span className="grid place-items-center h-9 w-9 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}>
              <Icon.bolt width={20} height={20} />
            </span>
            Voltik
          </Link>

          <h2 className="font-display font-bold text-3xl">Sign in</h2>
          <p className="text-muted text-sm mt-2">Welcome back. Enter your credentials below.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-muted font-semibold">Email</span>
              <input className="input mt-1.5" type="email" autoFocus value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-muted font-semibold">Password</span>
              <div className="relative mt-1.5">
                <input className="input pr-12" type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs">
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {err && <div className="text-sm text-danger flex items-center gap-2"><Icon.close width={14} height={14} /> {err}</div>}

            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center !py-3 disabled:opacity-60">
              {submitting ? 'Signing in…' : <>Sign in <Icon.arrow width={16} height={16} /></>}
            </button>
          </form>

          <p className="text-xs text-muted mt-6 text-center">
            New here? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-brand hover:underline font-semibold">Create an account</Link>
          </p>

          <div className="mt-6 card p-4 text-xs text-muted">
            <div className="font-semibold text-ink mb-1">Demo accounts</div>
            <span className="font-mono text-ink">demo@voltik.com</span> · <span className="font-mono text-ink">demo123</span>
            <br />
            <span className="font-mono text-ink">alex@voltik.com</span> · <span className="font-mono text-ink">alex1234</span>
          </div>
        </div>
      </div>
    </div>
  );
}
