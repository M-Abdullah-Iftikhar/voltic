'use client';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icons';
import { AdminPageHeader } from '@/components/AdminPageHeader';
import { recordEdit } from '@/lib/recentEdits';
import type { Ad, Product } from '@/lib/types';

const PLACEMENTS: Ad['placement'][] = ['hero', 'rotator', 'bento', 'banner'];

// Curated gradient set so admins don't have to remember Tailwind class names.
const GRADIENTS: { label: string; value: string }[] = [
  { label: 'Brand sweep',  value: 'from-brand to-brand2' },
  { label: 'Tangerine',    value: 'from-accent2 to-accent' },
  { label: 'Aqua → indigo',value: 'from-cyan-400 to-indigo-500' },
  { label: 'Sunrise',      value: 'from-orange-500 to-pink-500' },
  { label: 'Sage',         value: 'from-emerald-400 to-teal-600' },
  { label: 'Ink',          value: 'from-slate-700 to-slate-900' }
];

const blank = (): Partial<Ad> => ({
  headline: '', tagline: '', ctaLabel: 'Shop now', ctaHref: '/shop',
  placement: 'rotator', gradient: 'from-brand to-brand2',
  priority: 0, active: true, productId: undefined,
  startsAt: undefined, endsAt: undefined
});

export function AdsAdminClient({
  initialAds, products
}: {
  initialAds: Ad[];
  products: Product[];
}) {
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [editing, setEditing] = useState<Partial<Ad> | null>(null);
  const [confirmDel, setConfirmDel] = useState<Ad | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [placementFilter, setPlacementFilter] = useState<'all' | Ad['placement']>('all');

  const filtered = useMemo(() => {
    return ads.filter(a => placementFilter === 'all' || a.placement === placementFilter);
  }, [ads, placementFilter]);

  const stats = useMemo(() => {
    const now = Date.now();
    const liveNow = ads.filter(a => {
      if (!a.active) return false;
      if (a.startsAt && new Date(a.startsAt).getTime() > now) return false;
      if (a.endsAt   && new Date(a.endsAt).getTime()   < now) return false;
      return true;
    });
    return {
      total: ads.length,
      live: liveNow.length,
      scheduled: ads.filter(a => a.active && a.startsAt && new Date(a.startsAt).getTime() > now).length
    };
  }, [ads]);

  const onSave = async () => {
    if (!editing?.headline?.trim() || !editing.ctaLabel?.trim() || !editing.ctaHref?.trim()) {
      setErr('Headline, CTA label and CTA target are required.');
      return;
    }
    setSaving(true); setErr('');
    const res = await fetch('/api/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing)
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Failed to save.'); return; }
    const saved = data as Ad;
    setAds(prev => {
      const i = prev.findIndex(a => a.id === saved.id);
      if (i >= 0) { const next = prev.slice(); next[i] = saved; return next; }
      return [saved, ...prev];
    });
    recordEdit({ kind: 'promo', title: saved.headline, sub: `Ad · ${saved.placement}`, href: '/admin/ads' });
    setEditing(null);
  };

  const onDelete = async (a: Ad) => {
    await fetch(`/api/ads/${encodeURIComponent(a.id)}`, { method: 'DELETE' });
    setAds(prev => prev.filter(x => x.id !== a.id));
    setConfirmDel(null);
  };

  const toggleActive = async (a: Ad) => {
    const next = { ...a, active: !a.active };
    const res = await fetch(`/api/ads/${encodeURIComponent(a.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: next.active })
    });
    if (res.ok) {
      const saved = await res.json();
      setAds(prev => prev.map(x => x.id === saved.id ? saved : x));
    }
  };

  const productName = (id?: string) => id ? (products.find(p => p.id === id)?.name || `(missing ${id})`) : '—';

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Promotional ads"
        subtitle="Hero slides, rotator slots and banner copy — edit in one place."
        crumbs={[{ label: 'Ads' }]}
        primary={{ label: 'New ad', icon: 'plus', onClick: () => { setEditing(blank()); setErr(''); } }}
      />

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Total ads"  value={stats.total.toString()} />
        <StatCard label="Live now"   value={stats.live.toString()} accent="text-success" />
        <StatCard label="Scheduled"  value={stats.scheduled.toString()} accent="text-warn" />
      </div>

      {/* Placement filter */}
      <div className="card p-3 flex items-center gap-2 flex-wrap">
        <span className="text-xs uppercase tracking-wide text-muted font-semibold">Placement</span>
        {(['all', ...PLACEMENTS] as const).map(p => (
          <button
            key={p}
            onClick={() => setPlacementFilter(p as typeof placementFilter)}
            aria-pressed={placementFilter === p}
            className={`chip ${placementFilter === p ? 'bg-brand text-white' : 'bg-elev text-muted hover:text-ink'} capitalize`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted bg-elev/40">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Headline</th>
                <th className="text-left px-2 py-3 font-semibold">Placement</th>
                <th className="text-left px-2 py-3 font-semibold">Product</th>
                <th className="text-left px-2 py-3 font-semibold">Window</th>
                <th className="text-right px-2 py-3 font-semibold">Priority</th>
                <th className="text-left px-2 py-3 font-semibold">Status</th>
                <th className="text-right px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className="admin-row">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`h-8 w-8 rounded-lg bg-gradient-to-br ${a.gradient} shrink-0`} aria-hidden />
                      <div className="min-w-0">
                        <div className="font-semibold line-clamp-1">{a.headline}</div>
                        <div className="text-xs text-muted line-clamp-1">{a.tagline || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-xs capitalize">{a.placement}</td>
                  <td className="px-2 py-3 text-xs">{productName(a.productId)}</td>
                  <td className="px-2 py-3 text-xs text-muted">
                    {a.startsAt || '—'} → {a.endsAt || '∞'}
                  </td>
                  <td className="px-2 py-3 text-right font-mono text-xs">{a.priority}</td>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => toggleActive(a)}
                      className={`chip ${a.active ? 'bg-success/15 text-success' : 'bg-elev text-muted'}`}
                    >
                      {a.active ? 'Active' : 'Off'}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => setEditing(a)} className="h-8 w-8 grid place-items-center rounded-lg border border-line hover:bg-elev" title="Edit">
                        <Icon.edit width={14} height={14} />
                      </button>
                      <button onClick={() => setConfirmDel(a)} className="h-8 w-8 grid place-items-center rounded-lg border border-line hover:bg-danger/10 hover:text-danger" title="Delete">
                        <Icon.trash width={14} height={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-muted">No ads yet. Create one to see it on the storefront.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor */}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? 'Edit ad' : 'New ad'} wide>
          <div className="grid md:grid-cols-[1fr_280px] gap-6">
            <div className="space-y-4">
              <Field label="Headline" required>
                <input className="input" placeholder="Volt Buds Pro 2" value={editing.headline ?? ''} onChange={e => setEditing({ ...editing, headline: e.target.value })} />
              </Field>
              <Field label="Tagline">
                <input className="input" placeholder="ANC, 30hr battery, 4 colours" value={editing.tagline ?? ''} onChange={e => setEditing({ ...editing, tagline: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CTA label" required>
                  <input className="input" value={editing.ctaLabel ?? ''} onChange={e => setEditing({ ...editing, ctaLabel: e.target.value })} />
                </Field>
                <Field label="CTA target" required>
                  <input className="input" placeholder="/shop or /product/volt-buds" value={editing.ctaHref ?? ''} onChange={e => setEditing({ ...editing, ctaHref: e.target.value })} />
                </Field>
              </div>
              <Field label="Linked product (optional)">
                <select className="input" value={editing.productId ?? ''} onChange={e => setEditing({ ...editing, productId: e.target.value || undefined })}>
                  <option value="">(none)</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Placement">
                  <select className="input" value={editing.placement} onChange={e => setEditing({ ...editing, placement: e.target.value as Ad['placement'] })}>
                    {PLACEMENTS.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                  </select>
                </Field>
                <Field label="Priority">
                  <input type="number" className="input" value={editing.priority ?? 0} onChange={e => setEditing({ ...editing, priority: parseInt(e.target.value || '0', 10) })} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Starts at (UTC)">
                  <input type="date" className="input" value={editing.startsAt ?? ''} onChange={e => setEditing({ ...editing, startsAt: e.target.value || undefined })} />
                </Field>
                <Field label="Ends at (UTC)">
                  <input type="date" className="input" value={editing.endsAt ?? ''} onChange={e => setEditing({ ...editing, endsAt: e.target.value || undefined })} />
                </Field>
              </div>
              <Field label="Gradient">
                <div className="flex flex-wrap gap-2">
                  {GRADIENTS.map(g => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setEditing({ ...editing, gradient: g.value })}
                      aria-pressed={editing.gradient === g.value}
                      className={`h-10 w-16 rounded-lg bg-gradient-to-br ${g.value} relative ${editing.gradient === g.value ? 'ring-2 ring-brand ring-offset-2 ring-offset-bg' : 'border border-line'}`}
                      title={g.label}
                    >
                      <span className="sr-only">{g.label}</span>
                    </button>
                  ))}
                </div>
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.active ?? true} onChange={e => setEditing({ ...editing, active: e.target.checked })} />
                Active
              </label>
              {err && <p className="text-xs text-danger">{err}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditing(null)} disabled={saving} className="btn-ghost text-sm">Cancel</button>
                <button onClick={onSave} disabled={saving} className="btn-primary text-sm disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save ad'}
                </button>
              </div>
            </div>

            {/* Live preview */}
            <div className="lg:sticky lg:top-4 self-start space-y-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted font-semibold">Preview</div>
              <div className={`rounded-2xl overflow-hidden p-6 bg-gradient-to-br ${editing.gradient || 'from-brand to-brand2'} text-white shadow-card`}>
                <div className="text-[10px] uppercase tracking-[0.18em] font-semibold opacity-80">
                  {editing.placement || 'rotator'}
                </div>
                <div className="font-display font-bold text-2xl mt-2 leading-tight line-clamp-2">{editing.headline || 'Headline goes here'}</div>
                <div className="text-sm opacity-90 mt-1 line-clamp-2">{editing.tagline || 'Tagline preview'}</div>
                <button type="button" className="mt-4 px-3 py-1.5 rounded-full bg-white text-ink text-xs font-semibold">
                  {editing.ctaLabel || 'Shop now'}
                </button>
              </div>
              <p className="text-[11px] text-muted">
                This card mirrors what a rotator slot will render on the storefront. Surfaces with custom layouts (hero, banner) pull the same fields.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)} title={`Delete "${confirmDel.headline}"?`}>
          <p className="text-sm text-muted">Removes the ad immediately. Active surfaces fall back to the next-priority ad.</p>
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

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-muted font-semibold">{label}{required && <span className="text-danger ml-0.5">*</span>}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Modal({ children, onClose, title, wide }: { children: React.ReactNode; onClose: () => void; title: string; wide?: boolean }) {
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4 animate-fadein" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={`card relative w-full ${wide ? 'max-w-3xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink"><Icon.close width={14} height={14} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
