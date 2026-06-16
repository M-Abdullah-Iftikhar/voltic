'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icons';

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const cancel = async () => {
    setBusy(true); setErr('');
    const res = await fetch(`/api/me/orders/${encodeURIComponent(orderId)}/cancel`, { method: 'POST' });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error || 'Could not cancel order.'); return; }
    setConfirming(false);
    router.refresh();
  };

  if (!confirming) {
    return (
      <button
        onClick={() => { setConfirming(true); setErr(''); }}
        className="btn-ghost text-xs !text-danger border-danger/40 hover:bg-danger/10"
      >
        <Icon.close width={12} height={12} /> Cancel order
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-danger/30 bg-danger/5 p-4 space-y-3">
      <div className="text-sm text-ink">
        Cancel order <span className="font-mono">{orderId}</span>?
        <span className="block text-xs text-muted mt-1">Stock will be restored and any refund will be issued within 5–7 business days.</span>
      </div>
      {err && <div className="text-xs text-danger flex items-center gap-1"><Icon.close width={10} height={10} /> {err}</div>}
      <div className="flex gap-2 justify-end">
        <button onClick={() => setConfirming(false)} disabled={busy} className="btn-ghost text-xs">Keep order</button>
        <button onClick={cancel} disabled={busy} className="btn !bg-danger text-white text-xs">
          {busy ? 'Cancelling…' : 'Yes, cancel'}
        </button>
      </div>
    </div>
  );
}
