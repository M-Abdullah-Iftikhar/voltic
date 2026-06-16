'use client';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icons';
import { AdminPageHeader } from '@/components/AdminPageHeader';
import type { PromoCode } from '@/lib/types';

const blank = (): Partial<PromoCode> => ({
  code: '', type: 'percent', value: 10, minBasket: 0,
  expiresAt: undefined, usageLimit: undefined, usedCount: 0, active: true
});

export function PromosAdminClient({ initialPromos }: { initialPromos: PromoCode[] }) {
  const [promos, setPromos] = useState<PromoCode[]>(initialPromos);
  const [editing, setEditing] = useState<Partial<PromoCode> | null>(null);
  const [confirmDel, setConfirmDel] = useState<PromoCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const stats = useMemo(() => ({
    total: promos.length,
    active: promos.filter(p => p.active && (!p.expiresAt || new Date(p.expiresAt).getTime() > Date.now())).length,
    redemptions: promos.reduce((s, p) => s + (p.usedCount || 0), 0)
  }), [promos]);

  const onSave = async () => {
    if (!editing?.code || !editing.type || editing.value == null) {
      setErr('Code, type and value are required.');
      return;
    }
    setSaving(true); setErr('');
    const res = await fetch('/api/promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing)
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setErr(data.error || 'Failed to save.'); return; }
    const saved = data as PromoCode;
    setPromos(prev => {
      const i = prev.findIndex(p => p.id === saved.id);
      if (i >= 0) {
        const copy = prev.slice();
        copy[i] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setEditing(null);
  };

  const onDelete = async (p: PromoCode) => {
    await fetch(`/api/promos/${encodeURIComponent(p.code)}`, { method: 'DELETE' });
    setPromos(prev => prev.filter(x => x.id !== p.id));
    setConfirmDel(null);
  };

  const toggleActive = async (p: PromoCode) => {
    const next = { ...p, active: !p.active };
    const res = await fetch('/api/promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    });
    if (res.ok) {
      const saved = await res.json();
      setPromos(prev => prev.map(x => x.id === saved.id ? saved : x));
    }
  };

  const fmtDiscount = (p: PromoCode) =>
    p.type === 'percent' ? `${p.value}% off`
    : p.type === 'flat'  ? `$${p.value.toFixed(2)} off`
    :                       'Free shipping';

  const isExpired = (p: PromoCode) => !!(p.expiresAt && new Date(p.expiresAt).getTime() < Date.now());
  const isExhausted = (p: PromoCode) => p.usageLimit != null && p.usedCount >= p.usageLimit;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Promo codes"
        subtitle="Create, deactivate and track discount codes."
        crumbs={[{ label: 'Promos' }]}
        primary={{ label: 'New promo', icon: 'plus', onClick: () => { setEditing(blank()); setErr(''); } }}
      />

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Total codes"  value={stats.total.toString()} />
        <StatCard label="Active"       value={stats.active.toString()} accent="text-success" />
        <StatCard label="Redemptions"  value={stats.redemptions.toLocaleString()} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted bg-elev/40">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Code</th>
                <th className="text-left px-2 py-3 font-semibold">Discount</th>
                <th className="text-right px-2 py-3 font-semibold">Min basket</th>
                <th className="text-left px-2 py-3 font-semibold">Expires</th>
                <th className="text-right px-2 py-3 font-semibold">Used</th>
                <th className="text-center px-2 py-3 font-semibold">Status</th>
                <th className="text-right px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.map(p => {
                const expired = isExpired(p);
                const exhausted = isExhausted(p);
                const dead = expired || exhausted || !p.active;
                return (
                  <tr key={p.id} className="admin-row">
                    <td className="px-5 py-3 font-mono font-semibold">{p.code}</td>
                    <td className="px-2 py-3">{fmtDiscount(p)}</td>
                    <td className="px-2 py-3 text-right">{p.minBasket ? `$${p.minBasket.toFixed(2)}` : <span className="text-muted">—</span>}</td>
                    <td className="px-2 py-3 text-xs">{p.expiresAt || <span className="text-muted">No expiry</span>}</td>
                    <td className="px-2 py-3 text-right text-xs">
                      {p.usedCount}{p.usageLimit != null ? ` / ${p.usageLimit}` : ''}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className={`chip ${
                        !p.active   ? 'bg-elev text-muted'
                        : expired   ? 'bg-warn/15 text-warn'
                        : exhausted ? 'bg-warn/15 text-warn'
                        :             'bg-success/15 text-success'
                      }`}>
                        {!p.active ? 'Off' : expired ? 'Expired' : exhausted ? 'Used up' : 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => toggleActive(p)}
                          className="h-8 px-3 grid place-items-center rounded-lg border border-line hover:bg-elev text-xs"
                          title={p.active ? 'Deactivate' : 'Activate'}
                        >
                          {p.active ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => { setEditing(p); setErr(''); }} className="h-8 w-8 grid place-items-center rounded-lg border border-line hover:bg-elev" title="Edit">
                          <Icon.edit width={14} height={14} />
                        </button>
                        <button onClick={() => setConfirmDel(p)} className="h-8 w-8 grid place-items-center rounded-lg border border-line hover:bg-danger/10 hover:text-danger" title="Delete">
                          <Icon.trash width={14} height={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {promos.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-muted">No promo codes yet. Click <span className="text-ink font-semibold">New promo</span> to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor modal */}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? `Edit ${editing.code}` : 'New promo code'}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Code (uppercased)">
              <input
                className="input font-mono uppercase"
                value={editing.code || ''}
                disabled={!!editing.id}
                onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="Discount type">
              <select className="input" value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value as PromoCode['type'] })}>
                <option value="percent">Percentage off</option>
                <option value="flat">Flat $ off</option>
                <option value="shipping">Free shipping</option>
              </select>
            </Field>
            <Field label={editing.type === 'percent' ? 'Percent (0-100)' : editing.type === 'flat' ? 'Amount ($)' : 'Value (ignored)'}>
              <input
                type="number"
                step={editing.type === 'percent' ? '1' : '0.01'}
                className="input"
                disabled={editing.type === 'shipping'}
                value={editing.value ?? 0}
                onChange={e => setEditing({ ...editing, value: Number(e.target.value) })}
              />
            </Field>
            <Field label="Minimum basket ($)">
              <input
                type="number"
                step="0.01"
                className="input"
                value={editing.minBasket ?? 0}
                onChange={e => setEditing({ ...editing, minBasket: Number(e.target.value) })}
              />
            </Field>
            <Field label="Expires on (optional)">
              <input
                type="date"
                className="input"
                value={editing.expiresAt || ''}
                onChange={e => setEditing({ ...editing, expiresAt: e.target.value || undefined })}
              />
            </Field>
            <Field label="Usage limit (optional)">
              <input
                type="number"
                className="input"
                value={editing.usageLimit ?? ''}
                onChange={e => setEditing({ ...editing, usageLimit: e.target.value ? Number(e.target.value) : undefined })}
              />
            </Field>
            <Field label="Active" full>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.active ?? true}
                  onChange={e => setEditing({ ...editing, active: e.target.checked })}
                />
                <span>Code is live and accepted at checkout</span>
              </label>
            </Field>
          </div>

          {err && <div className="text-sm text-danger mt-4 flex items-center gap-2"><Icon.close width={14} height={14} /> {err}</div>}

          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="btn-ghost text-sm">Cancel</button>
            <button onClick={onSave} disabled={saving} className="btn-primary text-sm disabled:opacity-60">
              {saving ? 'Saving…' : editing.id ? 'Save changes' : 'Create promo'}
            </button>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)} title="Delete promo?">
          <p className="text-sm text-muted">
            Permanently remove <span className="font-mono font-semibold text-ink">{confirmDel.code}</span>. Past redemptions on existing orders are kept.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setConfirmDel(null)} className="btn-ghost text-sm">Cancel</button>
            <button onClick={() => onDelete(confirmDel)} className="btn !bg-danger text-white text-sm">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-muted font-semibold">{label}</div>
      <div className={`mt-2 text-2xl font-display font-bold ${accent || 'text-ink'}`}>{value}</div>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-xs uppercase tracking-wide text-muted font-semibold">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-bg/70 backdrop-blur-md animate-slidein" onClick={onClose}>
      <div className="card max-w-2xl w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-xl">{title}</h3>
          <button onClick={onClose} className="grid place-items-center h-9 w-9 rounded-full border border-line hover:bg-elev">
            <Icon.close width={16} height={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
