'use client';
import { useState } from 'react';
import { Icon } from '@/components/Icons';
import type { Address } from '@/lib/types';

const blank = (): Partial<Address> => ({
  label: 'Home', recipient: '', street: '', city: '', country: '', phone: '', isDefault: false
});

export function AddressBook({ initial }: { initial: Address[] }) {
  const [addresses, setAddresses] = useState<Address[]>(initial);
  const [editing, setEditing] = useState<Partial<Address> | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!editing) return;
    setBusy(true); setErr('');
    const isUpdate = !!editing.id;
    const res = await fetch('/api/me/addresses', {
      method: isUpdate ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing)
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error || 'Could not save.'); return; }
    setAddresses(data.addresses);
    setEditing(null);
  };

  const remove = async (a: Address) => {
    if (!confirm(`Remove "${a.label}" address?`)) return;
    const res = await fetch(`/api/me/addresses?id=${encodeURIComponent(a.id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) setAddresses(data.addresses);
  };

  const setDefault = async (a: Address) => {
    const res = await fetch('/api/me/addresses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...a, isDefault: true })
    });
    const data = await res.json();
    if (res.ok) setAddresses(data.addresses);
  };

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-lg">Address book</h3>
          <p className="text-xs text-muted mt-0.5">Saved addresses autofill at checkout.</p>
        </div>
        <button onClick={() => { setEditing(blank()); setErr(''); }} className="btn-ghost text-xs">
          <Icon.plus width={12} height={12} /> Add address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-sm text-muted italic">No addresses saved yet.</div>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {addresses.map(a => (
            <li key={a.id} className={`relative rounded-2xl border p-4 transition ${a.isDefault ? 'border-brand bg-brand/5' : 'border-line hover:border-brand/40'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{a.label}</span>
                    {a.isDefault && <span className="chip bg-brand text-white !text-[10px]">Default</span>}
                  </div>
                  <div className="text-xs text-muted mt-1.5 leading-relaxed">
                    {a.recipient}<br />
                    {a.street}<br />
                    {a.city}, {a.country}<br />
                    {a.phone}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                {!a.isDefault && (
                  <button onClick={() => setDefault(a)} className="text-[11px] text-brand hover:underline">Set default</button>
                )}
                <button onClick={() => { setEditing(a); setErr(''); }} className="text-[11px] text-muted hover:text-ink">Edit</button>
                <button onClick={() => remove(a)} className="text-[11px] text-muted hover:text-danger">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-bg/70 backdrop-blur-md animate-slidein" onClick={() => setEditing(null)}>
          <div className="card max-w-xl w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-xl">{editing.id ? 'Edit address' : 'New address'}</h3>
              <button onClick={() => setEditing(null)} className="grid place-items-center h-9 w-9 rounded-full border border-line hover:bg-elev">
                <Icon.close width={16} height={16} />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Label"><input className="input" value={editing.label || ''} onChange={e => setEditing({ ...editing, label: e.target.value })} /></Field>
              <Field label="Recipient"><input className="input" value={editing.recipient || ''} onChange={e => setEditing({ ...editing, recipient: e.target.value })} /></Field>
              <Field label="Street" full><input className="input" value={editing.street || ''} onChange={e => setEditing({ ...editing, street: e.target.value })} /></Field>
              <Field label="City"><input className="input" value={editing.city || ''} onChange={e => setEditing({ ...editing, city: e.target.value })} /></Field>
              <Field label="Country"><input className="input" value={editing.country || ''} onChange={e => setEditing({ ...editing, country: e.target.value })} /></Field>
              <Field label="Phone" full><input className="input" value={editing.phone || ''} onChange={e => setEditing({ ...editing, phone: e.target.value })} /></Field>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" checked={!!editing.isDefault} onChange={e => setEditing({ ...editing, isDefault: e.target.checked })} />
                <span>Use as default checkout address</span>
              </label>
            </div>

            {err && <div className="text-sm text-danger mt-3 flex items-center gap-2"><Icon.close width={14} height={14} /> {err}</div>}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="btn-ghost text-sm">Cancel</button>
              <button onClick={save} disabled={busy} className="btn-primary text-sm disabled:opacity-60">
                {busy ? 'Saving…' : editing.id ? 'Save changes' : 'Add address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-xs uppercase tracking-wide text-muted font-semibold">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
