'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icons';
import { useUser } from '@/components/UserContext';

/**
 * GDPR controls: download a JSON dump of every record tied to the user,
 * or hard-delete the account. Deletion scrubs PII from order history but
 * keeps the rows for tax purposes (see /api/me/delete + db.hardDeleteUser).
 */
export function DangerZone() {
  const router = useRouter();
  const { refresh } = useUser();

  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const deleteAccount = async () => {
    setBusy(true); setErr('');
    const res = await fetch('/api/me/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, confirm })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error || 'Could not delete account.'); return; }
    await refresh();
    router.push('/?deleted=1');
  };

  return (
    <div className="card p-6 border-danger/30 space-y-4">
      <div>
        <h3 className="font-display font-bold text-lg text-danger">Data & deletion</h3>
        <p className="text-xs text-muted mt-1">
          Your GDPR controls. Export downloads a JSON copy of everything we hold about you.
          Deletion is permanent and scrubs PII from past orders.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href="/api/me/export" download className="btn-ghost text-xs">
          <Icon.refresh width={12} height={12} /> Download my data
        </a>
        {!confirming && (
          <button
            onClick={() => { setConfirming(true); setErr(''); }}
            className="btn-ghost text-xs !text-danger border-danger/40 hover:bg-danger/10"
          >
            <Icon.trash width={12} height={12} /> Delete my account
          </button>
        )}
      </div>

      {confirming && (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-4 space-y-3">
          <p className="text-sm text-ink">
            <span className="font-semibold">This cannot be undone.</span> Your cart, favourites,
            saved addresses and reviews will be erased. Past orders are kept (for tax law)
            but stripped of every personal field.
          </p>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-muted font-semibold">Confirm password</span>
            <input type="password" className="input mt-1.5" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-muted font-semibold">Type <span className="font-mono text-ink">DELETE</span> to confirm</span>
            <input className="input mt-1.5 font-mono" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="DELETE" />
          </label>
          {err && <div className="text-xs text-danger flex items-center gap-1"><Icon.close width={10} height={10} /> {err}</div>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirming(false)} disabled={busy} className="btn-ghost text-xs">Cancel</button>
            <button
              onClick={deleteAccount}
              disabled={busy || !password || confirm !== 'DELETE'}
              className="btn !bg-danger text-white text-xs disabled:opacity-50"
            >
              {busy ? 'Deleting…' : 'Permanently delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
