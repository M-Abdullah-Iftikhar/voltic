'use client';
import { useMemo, useState } from 'react';
import { ProductIllustration } from '@/components/ProductIllustration';
import { Icon, type IconKey } from '@/components/Icons';
import { buildTree, categoryPath, descendantIds, flattenTree } from '@/lib/categoryTree';
import type { Category, EnrichedProduct, Product } from '@/lib/types';

const ICON_OPTIONS: IconKey[] = ['cable','battery','wireless','plug','car','earbud','headset','speaker','shield','case','camlens','ringlight','tripod','gimbal','chip','stand','box','bolt'];

const blank = (defaultCat: string): Partial<Product> => ({
  name: '', category: defaultCat, price: 0, oldPrice: undefined,
  stock: 0, icon: 'box', brand: 'Voltik', sku: '', description: '', features: []
});

export function ProductsAdminClient({ initialProducts, categories }: { initialProducts: EnrichedProduct[]; categories: Category[] }) {
  const [products, setProducts] = useState<EnrichedProduct[]>(initialProducts);
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [confirmDel, setConfirmDel] = useState<EnrichedProduct | null>(null);
  const [saving, setSaving] = useState(false);

  const tree = useMemo(() => buildTree(categories), [categories]);
  const flatCats = useMemo(() => flattenTree(tree), [tree]);
  const defaultCat = flatCats[0]?.id || '';

  // For each product, render the full breadcrumb path ("Charging / Cables / USB-C").
  const pathFor = (catId: string) =>
    categoryPath(catId, categories).map(c => c.name).join(' / ') || '— Uncategorised';

  const filtered = useMemo(() => products.filter(p => {
    if (filterCat !== 'all') {
      const subtree = descendantIds(filterCat, categories);
      if (!subtree.includes(p.category)) return false;
    }
    if (query) {
      const q = query.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    return true;
  }), [products, query, filterCat, categories]);

  const onSave = async () => {
    if (!editing?.name || !editing.category || editing.price == null) return;
    setSaving(true);
    const isUpdate = !!editing.id;
    const url = isUpdate ? `/api/products/${editing.id}` : '/api/products';
    const method = isUpdate ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    const saved: Product = await res.json();
    // Server returns base Product. Preserve any existing review stats locally.
    setProducts(prev => {
      const i = prev.findIndex(p => p.id === saved.id);
      if (i >= 0) {
        const copy = prev.slice();
        copy[i] = { ...prev[i], ...saved };
        return copy;
      }
      return [{ ...saved, rating: 0, reviewsCount: 0 }, ...prev];
    });
    setEditing(null);
    setSaving(false);
  };

  const onDelete = async (p: Product) => {
    await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
    setProducts(prev => prev.filter(x => x.id !== p.id));
    setConfirmDel(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl">Products</h1>
          <p className="text-muted text-sm mt-1">Manage your catalog — create, edit and retire SKUs.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(blank(defaultCat))} className="btn-primary text-xs">
            <Icon.plus width={14} height={14} /> New product
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-full border border-line bg-bg px-3 py-2 flex-1 min-w-[260px]">
          <Icon.search width={14} height={14} className="text-muted" />
          <input className="bg-transparent outline-none text-sm flex-1" placeholder="Search by name or SKU…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="rounded-full border border-line bg-bg px-3 py-2 text-sm">
          <option value="all">All categories</option>
          {flatCats.map(c => (
            <option key={c.id} value={c.id}>
              {'— '.repeat(c.depth)}{c.name}
            </option>
          ))}
        </select>
        <div className="text-xs text-muted">{filtered.length} of {products.length}</div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted bg-elev/40">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Product</th>
                <th className="text-left px-2 py-3 font-semibold">Category</th>
                <th className="text-left px-2 py-3 font-semibold">SKU</th>
                <th className="text-right px-2 py-3 font-semibold">Price</th>
                <th className="text-right px-2 py-3 font-semibold">Stock</th>
                <th className="text-right px-2 py-3 font-semibold">Rating</th>
                <th className="text-right px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t border-line/60 hover:bg-elev/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <ProductIllustration category={p.category} icon={p.icon} className="h-10 w-10 rounded-xl shrink-0" size={20} />
                      <div className="min-w-0">
                        <div className="font-semibold line-clamp-1">{p.name}</div>
                        <div className="text-xs text-muted line-clamp-1">{p.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-xs">{pathFor(p.category)}</td>
                  <td className="px-2 py-3 font-mono text-xs">{p.sku}</td>
                  <td className="px-2 py-3 text-right font-semibold">${p.price.toFixed(2)}</td>
                  <td className="px-2 py-3 text-right">
                    <span className={`chip ${p.stock < 100 ? 'bg-warn/15 text-warn' : 'bg-success/15 text-success'}`}>{p.stock}</span>
                  </td>
                  <td className="px-2 py-3 text-right text-xs">
                    {p.reviewsCount > 0
                      ? <span>★ {p.rating.toFixed(1)} <span className="text-muted">({p.reviewsCount})</span></span>
                      : <span className="text-muted italic">No reviews</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => setEditing(p)} className="h-8 w-8 grid place-items-center rounded-lg border border-line hover:bg-elev" title="Edit">
                        <Icon.edit width={14} height={14} />
                      </button>
                      <button onClick={() => setConfirmDel(p)} className="h-8 w-8 grid place-items-center rounded-lg border border-line hover:bg-danger/10 hover:text-danger" title="Delete">
                        <Icon.trash width={14} height={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-muted">No products match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor drawer */}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? 'Edit product' : 'Create product'}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name" full>
              <input className="input" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="Category">
              <select className="input" value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })}>
                {flatCats.length === 0 && <option value="">No categories yet — create one first</option>}
                {flatCats.map(c => (
                  <option key={c.id} value={c.id}>
                    {'— '.repeat(c.depth)}{c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Brand">
              <input className="input" value={editing.brand || ''} onChange={e => setEditing({ ...editing, brand: e.target.value })} />
            </Field>
            <Field label="SKU">
              <input className="input font-mono" value={editing.sku || ''} onChange={e => setEditing({ ...editing, sku: e.target.value })} />
            </Field>
            <Field label="Icon">
              <select className="input" value={editing.icon} onChange={e => setEditing({ ...editing, icon: e.target.value })}>
                {ICON_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </Field>
            <Field label="Price ($)">
              <input type="number" step="0.01" className="input" value={editing.price ?? 0} onChange={e => setEditing({ ...editing, price: Number(e.target.value) })} />
            </Field>
            <Field label="Old price ($)">
              <input type="number" step="0.01" className="input" value={editing.oldPrice ?? ''} onChange={e => setEditing({ ...editing, oldPrice: e.target.value ? Number(e.target.value) : undefined })} />
            </Field>
            <Field label="Stock">
              <input type="number" className="input" value={editing.stock ?? 0} onChange={e => setEditing({ ...editing, stock: Number(e.target.value) })} />
            </Field>
            <Field label="Badge">
              <select className="input" value={editing.badge || ''} onChange={e => setEditing({ ...editing, badge: e.target.value || undefined })}>
                <option value="">None</option>
                <option value="Bestseller">Bestseller</option>
                <option value="New">New</option>
                <option value="Hot Deal">Hot Deal</option>
              </select>
            </Field>
            <Field label="Rating">
              <div className="input flex items-center !cursor-not-allowed bg-elev/30 text-muted text-xs">
                {editing.id
                  ? <span>Computed from customer reviews — managed under <span className="font-mono text-ink">Reviews</span></span>
                  : <span>Will be computed once reviews come in</span>}
              </div>
            </Field>
            <Field label="Description" full>
              <textarea rows={3} className="input" value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} />
            </Field>
            <Field label="Features (one per line)" full>
              <textarea rows={4} className="input font-mono text-xs" value={(editing.features || []).join('\n')} onChange={e => setEditing({ ...editing, features: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} />
            </Field>
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 rounded-2xl bg-elev/30 flex items-center gap-4">
            <ProductIllustration category={editing.category || 'charging'} icon={editing.icon || 'box'} className="h-16 w-16 rounded-xl" size={32} />
            <div>
              <div className="font-semibold">{editing.name || 'Untitled product'}</div>
              <div className="text-xs text-muted">{editing.sku || 'no-sku'} · ${editing.price?.toFixed(2) || '0.00'}</div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="btn-ghost text-sm">Cancel</button>
            <button onClick={onSave} disabled={saving} className="btn-primary text-sm disabled:opacity-60">
              {saving ? 'Saving…' : editing.id ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)} title="Delete product?">
          <p className="text-sm text-muted">
            This will permanently remove <span className="font-semibold text-ink">{confirmDel.name}</span> from your catalog. This action can't be undone.
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

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-xs uppercase tracking-wide text-muted font-semibold">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
