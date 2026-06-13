'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/Icons';
import { AuthHero } from '@/components/AuthHero';
import { useUser } from '@/components/UserContext';
import { readAnonymousCart } from '@/components/CartContext';

export function SignupPageClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';
  const { user, signup, loading } = useUser();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, router, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setSubmitting(true);
    const cart = readAnonymousCart();
    const res = await signup({ name, email, password, cart });
    setSubmitting(false);
    if (!res.ok) { setErr(res.error || 'Sign up failed'); return; }
    router.push(next);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-bg">
      <AuthHero
        headline={<>Join the <span className="gradient-text">Voltik</span> family.</>}
        bullets={['10% off your first order','Free express shipping over $50','Exclusive early access to drops','Save your cart + favourites everywhere']} />

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden flex items-center gap-2 font-display font-bold text-xl mb-8">
            <span className="grid place-items-center h-9 w-9 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}>
              <Icon.bolt width={20} height={20} />
            </span>
            Voltik
          </Link>

          <h2 className="font-display font-bold text-3xl">Create your account</h2>
          <p className="text-muted text-sm mt-2">Takes 30 seconds. No credit card needed.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-muted font-semibold">Full name</span>
              <input className="input mt-1.5" autoFocus required value={name} onChange={e => setName(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-muted font-semibold">Email</span>
              <input className="input mt-1.5" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-muted font-semibold">Password (min. 6)</span>
              <div className="relative mt-1.5">
                <input className="input pr-12" type={show ? 'text' : 'password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs">
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {err && <div className="text-sm text-danger flex items-center gap-2"><Icon.close width={14} height={14} /> {err}</div>}

            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center !py-3 disabled:opacity-60">
              {submitting ? 'Creating…' : <>Create account <Icon.arrow width={16} height={16} /></>}
            </button>
          </form>

          <p className="text-xs text-muted mt-6 text-center">
            Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-brand hover:underline font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
