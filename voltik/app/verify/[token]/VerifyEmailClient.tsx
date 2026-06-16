'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icons';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useUser } from '@/components/UserContext';

type State = 'pending' | 'success' | 'error';

export function VerifyEmailClient({ token }: { token: string }) {
  const { refresh } = useUser();
  const [state, setState] = useState<State>('pending');
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) { setErr(data.error || 'Could not verify.'); setState('error'); return; }
      setState('success');
      // Refresh the user-context so the verified-email banner disappears.
      refresh();
    })();
    return () => { cancelled = true; };
  }, [token, refresh]);

  return (
    <>
      <Navbar />
      <main id="main" className="container-x py-20">
        <div className="card max-w-md mx-auto p-10 text-center">
          {state === 'pending' && (
            <>
              <div className="mx-auto h-12 w-12 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <h2 className="font-display font-bold text-xl mt-5">Verifying your email…</h2>
              <p className="text-sm text-muted mt-2">Hold tight, this only takes a moment.</p>
            </>
          )}
          {state === 'success' && (
            <>
              <div className="mx-auto grid place-items-center h-12 w-12 rounded-full bg-success/15 text-success">
                <Icon.check width={24} height={24} />
              </div>
              <h2 className="font-display font-bold text-xl mt-5">Email verified ⚡</h2>
              <p className="text-sm text-muted mt-2">Your account is fully unlocked. Have fun.</p>
              <div className="mt-6 flex justify-center gap-2">
                <Link href="/account" className="btn-primary text-sm">Go to dashboard</Link>
                <Link href="/shop" className="btn-ghost text-sm">Keep shopping</Link>
              </div>
            </>
          )}
          {state === 'error' && (
            <>
              <div className="mx-auto grid place-items-center h-12 w-12 rounded-full bg-danger/15 text-danger">
                <Icon.close width={24} height={24} />
              </div>
              <h2 className="font-display font-bold text-xl mt-5">Couldn't verify</h2>
              <p className="text-sm text-muted mt-2">{err}</p>
              <p className="text-xs text-muted mt-3">
                Need a fresh link? Open your <Link href="/account/profile" className="text-brand hover:underline">profile</Link> and tap <span className="font-semibold text-ink">Resend verification</span>.
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
