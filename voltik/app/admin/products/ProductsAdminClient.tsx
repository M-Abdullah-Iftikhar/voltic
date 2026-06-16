'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ProductIllustration } from '@/components/ProductIllustration';
import { Icon, type IconKey } from '@/components/Icons';
import { AdminPageHeader } from '@/components/AdminPageHeader';
import { Pagination } from '@/components/Pagination';
import { ExportCsvButton } from '@/components/ExportCsvButton';
import { Sparkline } from '@/components/Sparkline';
import { productViewSeries } from '@/lib/productViewSeries';
import { buildTree, categoryPath, descendantIds, flattenTree } from '@/lib/categoryTree';
import { recordEdit } from '@/lib/recentEdits';
import type { Category, EnrichedProduct, Product } from '@/lib/types';

const ICON_OPTIONS: IconKey[] = ['cable','battery','wireless','plug','car','earbud','headset','speaker','shield','case','camlens','ringlight','tripod','gimbal','chip','stand','box','bolt'];

const blank = (defaultCat: string): Partial<Product> => ({
  name: '', category: defaultCat, price: 0, oldPrice: undefined,
  stock: 0, icon: 'box', brand: 'Voltik', sku: '', description: '', features: []
});

type ColumnKey = 'category' | 'sku' | 'price' | 'stock' | 'rating' | 'views';
const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'category', label: 'Category' },
  { key: 'sku',      label: 'SKU' },
  { key: 'price',    label: 'Price' },
  { key: 'stock',    label: 'Stock' },
  { key: 'rating',   label: 'Rating' },
  { key: 'views',    label: '7-day views' }
];
const COLS_KEY = 'voltik:admin-products-cols';

export function ProductsAdminClient({ initialProducts, categories }: { initialProducts: EnrichedProduct[]; categories: Category[] }) {
  const [products, setProducts] = useState<EnrichedProduct[]>(initialProducts);
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [confirmDel, setConfirmDel] = useState<EnrichedProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<null | 'delete' | 'low-stock'>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  // Visible columns persist per browser so a user keeps their layout.
  const [visibleCols, setVisibleCols] = useState<Set<ColumnKey>>(
    new Set(ALL_COLUMNS.map(c => c.key))
  );
  const [colsOpen, setColsOpen] = useState(false);
  const colsRef = useRef<HTMLDivElement>(null);

  // Restore column visibility once on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COLS_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as ColumnKey[];
        const next = new Set(arr.filter(k => ALL_COLUMNS.some(c => c.key === k)));
        if (next.size > 0) setVisibleCols(next);
      }
    } catch {}
  }, []);

  // Persist whenever it changes.
  useEffect(() => {
    try { window.localStorage.setItem(COLS_KEY, JSON.stringify(Array.from(visibleCols))); } catch {}
  }, [visibleCols]);

  // Click-outside to close the columns popover.
  useEffect(() => {
    if (!colsOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!colsRef.current?.contains(e.target as Node)) setColsOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [colsOpen]);

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

  // Paginate the filtered slice.
  useMemo(() => { setPage(1); }, [query, filterCat, pageSize]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
    // Drop a breadcrumb into the recent-edits panel so a returning admin
    // can pick this product back up from the sidebar.
    recordEdit({
      kind: 'product',
      title: saved.name,
      sub: `${isUpdate ? 'Edited' : 'Created'} · ${saved.sku || saved.id}`,
      href: '/admin/products'
    });
    setEditing(null);
    setSaving(false);
  };

  const onDelete = async (p: Product) => {
    await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
    setProducts(prev => prev.filter(x => x.id !== p.id));
    setSelected(prev => { const n = new Set(prev); n.delete(p.id); return n; });
    setConfirmDel(null);
  };

  // ── Bulk select helpers ─────────────────────────────────────────
  const toggleSelected = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const pageIds = paged.map(p => p.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const somePageSelected = pageIds.some(id => selected.has(id)) && !allPageSelected;
  const togglePageSelection = () => setSelected(prev => {
    const next = new Set(prev);
    if (allPageSelected) pageIds.forEach(id => next.delete(id));
    else                 pageIds.forEach(id => next.add(id));
    return next;
  });

  const bulkDelete = async () => {
    setBulkBusy(true);
    const ids = Array.from(selected);
    // Fire-and-forget per-id deletes; the API doesn't have a batch endpoint.
    // Catch per-call so a single failure doesn't abandon the rest.
    await Promise.allSettled(
      ids.map(id => fetch(`/api/products/${id}`, { method: 'DELETE' }))
    );
    setProducts(prev => prev.filter(p => !selected.has(p.id)));
    setSelected(new Set());
    setBulkBusy(false);
    setBulkConfirm(null);
  };

  const bulkSetLowStock = async () => {
    setBulkBusy(true);
    const ids = Array.from(selected);
    const updated: EnrichedProduct[] = [];
    for (const id of ids) {
      const target = products.find(p => p.id === id);
      if (!target) continue;
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: 5 })
      }).catch(() => null);
      if (res?.ok) {
        const saved: Product = await res.json();
        updated.push({ ...target, ...saved });
      }
    }
    setProducts(prev => prev.map(p => {
      const u = updated.find(x => x.id === p.id);
      return u ? { ...p, ...u } : p;
    }));
    setBulkBusy(false);
    setBulkConfirm(null);
  };

  /**
   * Generic batch PUT — accepts a partial patch and applies it to every
   * selected row. Returns when the last request settles so the drawer
   * can close on success.
   */
  const bulkApplyPatch = async (patch: Partial<Pick<Product, 'price' | 'oldPrice' | 'stock' | 'category' | 'brand' | 'badge'>>) => {
    setBulkBusy(true);
    const ids = Array.from(selected);
    const updated: Product[] = [];
    await Promise.allSettled(ids.map(async id => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      if (res.ok) updated.push(await res.json());
    }));
    setProducts(prev => prev.map(p => {
      const u = updated.find(x => x.id === p.id);
      return u ? { ...p, ...u } : p;
    }));
    setBulkBusy(false);
    setBulkEditOpen(false);
    setSelected(new Set());
  };

  const isColVisible = (k: ColumnKey) => visibleCols.has(k);

  /**
   * Inline cell edit. Issues a PUT for one field at a time and merges the
   * server's response back into local state — keeps the rest of the page
   * in sync (stock health widget, etc.) without a full refetch.
   */
  const patchField = async (id: string, patch: Partial<Pick<Product, 'price' | 'stock'>>) => {
    const target = products.find(x => x.id === id);
    if (!target) return;
    // Optimistic — write through immediately so the table feels live.
    setProducts(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      if (!res.ok) {
        // Roll back if the server rejected the write.
        setProducts(prev => prev.map(x => x.id === id ? target : x));
      } else {
        const saved: Product = await res.json();
        setProducts(prev => prev.map(x => x.id === id ? { ...x, ...saved } : x));
      }
    } catch {
      setProducts(prev => prev.map(x => x.id === id ? target : x));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Products"
        subtitle="Manage your catalog — create, edit and retire SKUs."
        crumbs={[{ label: 'Products' }]}
        primary={{ label: 'New product', icon: 'plus', onClick: () => setEditing(blank(defaultCat)) }}
        secondary={{ label: 'Export CSV', icon: 'list', href: '/api/admin/products/export' }}
      />

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
        <div ref={colsRef} className="relative">
          <button
            onClick={() => setColsOpen(o => !o)}
            aria-expanded={colsOpen}
            className="flex items-center gap-1.5 rounded-full border border-line bg-bg px-3 py-2 text-xs hover:border-brand/40 transition"
          >
            <Icon.cog width={12} height={12} />
            Columns
            <span className="text-muted">({visibleCols.size}/{ALL_COLUMNS.length})</span>
          </button>
          {colsOpen && (
            <div role="dialog" aria-label="Visible columns" className="absolute right-0 mt-2 z-30 w-56 card p-2 animate-slidein">
              <div className="text-[10px] uppercase tracking-wide text-muted font-semibold px-2 pt-1 pb-1.5">Show columns</div>
              {ALL_COLUMNS.map(c => {
                const on = visibleCols.has(c.key);
                return (
                  <label key={c.key} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-elev cursor-pointer">
                    <span className="text-sm text-ink">{c.label}</span>
                    <input
                      type="checkbox"
                      checked={on}
                      // Don't let users hide every column — keep at least one body column visible.
                      disabled={on && visibleCols.size === 1}
                      onChange={() => setVisibleCols(prev => {
                        const next = new Set(prev);
                        next.has(c.key) ? next.delete(c.key) : next.add(c.key);
                        return next;
                      })}
                    />
                  </label>
                );
              })}
              <button
                onClick={() => setVisibleCols(new Set(ALL_COLUMNS.map(c => c.key)))}
                className="w-full text-[11px] text-muted hover:text-brand pt-2 mt-1 border-t border-line/60"
              >
                Reset to all
              </button>
            </div>
          )}
        </div>
        <div className="text-xs text-muted">{filtered.length} of {products.length}</div>
        <ExportCsvButton
          rows={filtered}
          filename="voltik-products"
          columns={[
            { label: 'ID',          get: p => p.id },
            { label: 'SKU',         get: p => p.sku },
            { label: 'Name',        get: p => p.name },
            { label: 'Brand',       get: p => p.brand },
            { label: 'Category',    get: p => p.category },
            { label: 'Price',       get: p => p.price.toFixed(2) },
            { label: 'Old price',   get: p => p.oldPrice ? p.oldPrice.toFixed(2) : '' },
            { label: 'Stock',       get: p => p.stock },
            { label: 'Rating',      get: p => p.rating.toFixed(2) },
            { label: 'Reviews',     get: p => p.reviewsCount },
            { label: 'Badge',       get: p => p.badge ?? '' },
            { label: 'Description', get: p => p.description }
          ]}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted bg-elev/40">
              <tr>
                <th className="px-3 py-3 w-9">
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={allPageSelected}
                    ref={el => { if (el) el.indeterminate = somePageSelected; }}
                    onChange={togglePageSelection}
                    disabled={pageIds.length === 0}
                  />
                </th>
                <th className="text-left px-5 py-3 font-semibold">Product</th>
                {isColVisible('category') && <th className="text-left px-2 py-3 font-semibold">Category</th>}
                {isColVisible('sku')      && <th className="text-left px-2 py-3 font-semibold">SKU</th>}
                {isColVisible('price')    && <th className="text-right px-2 py-3 font-semibold">Price</th>}
                {isColVisible('stock')    && <th className="text-right px-2 py-3 font-semibold">Stock</th>}
                {isColVisible('rating')   && <th className="text-right px-2 py-3 font-semibold">Rating</th>}
                {isColVisible('views')    && <th className="text-left px-2 py-3 font-semibold">7-day views</th>}
                <th className="text-right px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(p => {
                const isSelected = selected.has(p.id);
                return (
                  <tr key={p.id} className={`admin-row ${isSelected ? 'is-open' : ''}`}>
                    <td className="px-3 py-3 w-9">
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.name}`}
                        checked={isSelected}
                        onChange={() => toggleSelected(p.id)}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <ProductIllustration category={p.category} icon={p.icon} className="h-10 w-10 rounded-xl shrink-0" size={20} />
                        <div className="min-w-0">
                          <div className="font-semibold line-clamp-1">{p.name}</div>
                          <div className="text-xs text-muted line-clamp-1">{p.brand}</div>
                        </div>
                      </div>
                    </td>
                    {isColVisible('category') && <td className="px-2 py-3 text-xs">{pathFor(p.category)}</td>}
                    {isColVisible('sku')      && <td className="px-2 py-3 font-mono text-xs">{p.sku}</td>}
                    {isColVisible('price') && (
                      <td className="px-2 py-3 text-right font-semibold">
                        <InlineNumberCell
                          value={p.price}
                          decimals={2}
                          format={v => `$${v.toFixed(2)}`}
                          ariaLabel={`Price of ${p.name}`}
                          onCommit={v => patchField(p.id, { price: v })}
                        />
                      </td>
                    )}
                    {isColVisible('stock') && (
                      <td className="px-2 py-3 text-right">
                        <InlineNumberCell
                          value={p.stock}
                          decimals={0}
                          format={v => String(v)}
                          ariaLabel={`Stock for ${p.name}`}
                          onCommit={v => patchField(p.id, { stock: Math.max(0, Math.round(v)) })}
                          renderDisplay={v => (
                            <span className={`chip ${v < 100 ? 'bg-warn/15 text-warn' : 'bg-success/15 text-success'}`}>{v}</span>
                          )}
                        />
                      </td>
                    )}
                    {isColVisible('rating') && (
                      <td className="px-2 py-3 text-right text-xs">
                        {p.reviewsCount > 0
                          ? <span>★ {p.rating.toFixed(1)} <span className="text-muted">({p.reviewsCount})</span></span>
                          : <span className="text-muted italic">No reviews</span>}
                      </td>
                    )}
                    {isColVisible('views') && (
                      <td className="px-2 py-3">
                        <ProductViewsCell product={p} />
                      </td>
                    )}
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
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={visibleCols.size + 3} className="text-center py-12 text-muted">No products match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          total={filtered.length}
          pageSize={pageSize}
          page={currentPage}
          onPage={setPage}
          onPageSize={setPageSize}
        />
      </div>

      {/* Editor drawer — wide layout with form on the left + storefront preview on the right */}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? 'Edit product' : 'Create product'} wide>
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div>
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
            <Field label="Image alt text (screen readers)" full>
              <AltTextSuggester
                value={editing.altText || ''}
                onChange={v => setEditing({ ...editing, altText: v })}
                product={editing}
              />
            </Field>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="btn-ghost text-sm">Cancel</button>
            <button onClick={onSave} disabled={saving} className="btn-primary text-sm disabled:opacity-60">
              {saving ? 'Saving…' : editing.id ? 'Save changes' : 'Create product'}
            </button>
          </div>
          </div>
          {/* Live storefront preview — rebuilt every keystroke so admins
              see exactly how the card will land in the shop grid. */}
          <ProductPreview editing={editing} />
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

      {/* Bulk-action toolbar — slides up from the bottom whenever there's
          at least one row selected. Floats above the mobile dock too. */}
      {selected.size > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="fixed inset-x-0 bottom-4 sm:bottom-6 z-30 px-3 sm:px-6 pointer-events-none"
        >
          <div className="container-x flex justify-center">
            <div className="pointer-events-auto card p-3 pl-4 shadow-card flex items-center gap-3 flex-wrap animate-slidein">
              <span className="text-sm font-semibold text-ink flex items-center gap-2">
                <span className="grid place-items-center h-7 w-7 rounded-lg bg-brand/15 text-brand text-xs font-bold">
                  {selected.size}
                </span>
                {selected.size === 1 ? 'product' : 'products'} selected
              </span>
              <div className="h-6 w-px bg-line/70 hidden sm:block" />
              <button
                onClick={() => setBulkEditOpen(true)}
                disabled={bulkBusy}
                className="btn-ghost text-xs disabled:opacity-50"
              >
                <Icon.edit width={12} height={12} /> Edit fields
              </button>
              <button
                onClick={() => setBulkConfirm('low-stock')}
                disabled={bulkBusy}
                className="btn-ghost text-xs disabled:opacity-50"
              >
                <Icon.box width={12} height={12} /> Set stock to 5
              </button>
              <button
                onClick={() => setBulkConfirm('delete')}
                disabled={bulkBusy}
                className="btn-ghost text-xs !text-danger border-danger/40 hover:bg-danger/10 disabled:opacity-50"
              >
                <Icon.trash width={12} height={12} /> Delete
              </button>
              <button
                onClick={() => setSelected(new Set())}
                disabled={bulkBusy}
                className="text-xs text-muted hover:text-ink ml-auto sm:ml-2"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkConfirm === 'delete' && (
        <Modal onClose={() => setBulkConfirm(null)} title={`Delete ${selected.size} product${selected.size === 1 ? '' : 's'}?`}>
          <p className="text-sm text-muted">
            This permanently removes <span className="font-semibold text-ink">{selected.size}</span> SKUs from your catalog.
            Stock, reviews, and order references for these products are kept but orphaned. Can't be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setBulkConfirm(null)} disabled={bulkBusy} className="btn-ghost text-sm">Cancel</button>
            <button onClick={bulkDelete} disabled={bulkBusy} className="btn !bg-danger text-white text-sm disabled:opacity-60">
              {bulkBusy ? 'Deleting…' : 'Delete all'}
            </button>
          </div>
        </Modal>
      )}

      {bulkConfirm === 'low-stock' && (
        <Modal onClose={() => setBulkConfirm(null)} title={`Set stock to 5 for ${selected.size} product${selected.size === 1 ? '' : 's'}?`}>
          <p className="text-sm text-muted">
            Useful for forcing "low-stock" alerts on the storefront during a promo or surge.
            Each SKU's stock will be set to <span className="font-semibold text-ink">5</span>.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setBulkConfirm(null)} disabled={bulkBusy} className="btn-ghost text-sm">Cancel</button>
            <button onClick={bulkSetLowStock} disabled={bulkBusy} className="btn-primary text-sm disabled:opacity-60">
              {bulkBusy ? 'Updating…' : 'Apply'}
            </button>
          </div>
        </Modal>
      )}

      {bulkEditOpen && (
        <BulkEditDrawer
          count={selected.size}
          categories={categories}
          busy={bulkBusy}
          onClose={() => setBulkEditOpen(false)}
          onApply={bulkApplyPatch}
        />
      )}
    </div>
  );
}

/**
 * Right-side drawer for editing several products at once. Only fields
 * the admin actively toggles on are sent to the API — leaving a field's
 * checkbox off means "don't touch this on the selected rows."
 *
 * Numeric inputs accept an optional "Δ %" mode so you can mark every
 * selected product down by 15% instead of typing one specific price.
 */
function BulkEditDrawer({
  count, categories, busy, onClose, onApply
}: {
  count: number;
  categories: Category[];
  busy: boolean;
  onClose: () => void;
  onApply: (patch: Partial<Pick<Product, 'price' | 'oldPrice' | 'stock' | 'category' | 'brand' | 'badge'>>) => void;
}) {
  type Mode = 'set' | 'delta';
  const [enablePrice, setEnablePrice]       = useState(false);
  const [priceMode, setPriceMode]           = useState<Mode>('set');
  const [priceValue, setPriceValue]         = useState('');
  const [enableStock, setEnableStock]       = useState(false);
  const [stockValue, setStockValue]         = useState('');
  const [enableCategory, setEnableCategory] = useState(false);
  const [categoryValue, setCategoryValue]   = useState(categories[0]?.id || '');
  const [enableBrand, setEnableBrand]       = useState(false);
  const [brandValue, setBrandValue]         = useState('');
  const [enableBadge, setEnableBadge]       = useState(false);
  const [badgeValue, setBadgeValue]         = useState<'' | 'New' | 'Bestseller' | 'Sale' | 'Limited'>('New');

  const anyEnabled = enablePrice || enableStock || enableCategory || enableBrand || enableBadge;

  // Close on Escape — drawers should match modal affordances.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const apply = () => {
    const patch: Partial<Pick<Product, 'price' | 'oldPrice' | 'stock' | 'category' | 'brand' | 'badge'>> = {};
    if (enablePrice && priceValue) {
      const n = parseFloat(priceValue);
      if (priceMode === 'set' && !isNaN(n))   patch.price = Math.round(n * 100) / 100;
      // Delta mode is per-product so it can't be packed into a single
      // patch — surfaced as a hint instead of silently dropping the field.
    }
    if (enableStock && stockValue) {
      const n = parseInt(stockValue, 10);
      if (!isNaN(n)) patch.stock = Math.max(0, n);
    }
    if (enableCategory && categoryValue) patch.category = categoryValue;
    if (enableBrand && brandValue)       patch.brand = brandValue;
    if (enableBadge)                     patch.badge = (badgeValue || undefined) as Product['badge'];
    if (Object.keys(patch).length === 0) return;
    onApply(patch);
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fadein"
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Bulk edit products"
        className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[460px] bg-surface border-l border-line shadow-card flex flex-col"
        style={{ animation: 'drawerIn 280ms cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <header className="px-5 py-4 border-b border-line flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">Bulk edit</div>
            <h3 className="font-display font-bold text-lg mt-0.5">{count} product{count === 1 ? '' : 's'}</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close drawer">
            <Icon.close width={16} height={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-sm">
          <p className="text-xs text-muted">
            Toggle the fields you want to change. Anything left off keeps its current value on every selected row.
          </p>

          <FieldRow enabled={enablePrice} onToggle={setEnablePrice} label="Price">
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-full border border-line p-0.5 text-[11px]">
                <button type="button" onClick={() => setPriceMode('set')}   className={`px-2 py-1 rounded-full ${priceMode === 'set'   ? 'bg-brand text-white' : 'text-muted'}`}>Set to</button>
                <button type="button" onClick={() => setPriceMode('delta')} className={`px-2 py-1 rounded-full ${priceMode === 'delta' ? 'bg-brand text-white' : 'text-muted'}`}>Δ %</button>
              </div>
              <div className="flex items-center rounded-lg border border-line px-2 py-1 flex-1 bg-bg">
                <span className="text-muted text-xs mr-1">{priceMode === 'set' ? '$' : '%'}</span>
                <input
                  type="number"
                  step="0.01"
                  value={priceValue}
                  onChange={e => setPriceValue(e.target.value)}
                  className="bg-transparent outline-none w-full text-sm"
                  placeholder={priceMode === 'set' ? '29.00' : '-15'}
                />
              </div>
            </div>
            {priceMode === 'delta' && (
              <p className="text-[10px] text-muted mt-1.5">
                Δ % needs a per-row calculation — coming soon. For now, only the "Set to" mode is applied.
              </p>
            )}
          </FieldRow>

          <FieldRow enabled={enableStock} onToggle={setEnableStock} label="Stock">
            <input
              type="number"
              value={stockValue}
              onChange={e => setStockValue(e.target.value)}
              className="w-full bg-bg border border-line rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand"
              placeholder="0, 50, 200…"
              min={0}
            />
          </FieldRow>

          <FieldRow enabled={enableCategory} onToggle={setEnableCategory} label="Category">
            <select
              value={categoryValue}
              onChange={e => setCategoryValue(e.target.value)}
              className="w-full bg-bg border border-line rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand"
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FieldRow>

          <FieldRow enabled={enableBrand} onToggle={setEnableBrand} label="Brand">
            <input
              type="text"
              value={brandValue}
              onChange={e => setBrandValue(e.target.value)}
              className="w-full bg-bg border border-line rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand"
              placeholder="Voltik"
            />
          </FieldRow>

          <FieldRow enabled={enableBadge} onToggle={setEnableBadge} label="Badge">
            <select
              value={badgeValue}
              onChange={e => setBadgeValue(e.target.value as typeof badgeValue)}
              className="w-full bg-bg border border-line rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand"
            >
              <option value="">(no badge)</option>
              <option value="New">New</option>
              <option value="Bestseller">Bestseller</option>
              <option value="Sale">Sale</option>
              <option value="Limited">Limited</option>
            </select>
          </FieldRow>
        </div>

        <footer className="px-5 py-4 border-t border-line flex items-center gap-2 justify-end">
          <button onClick={onClose} disabled={busy} className="btn-ghost text-sm">Cancel</button>
          <button
            onClick={apply}
            disabled={busy || !anyEnabled}
            className="btn-primary text-sm disabled:opacity-60"
          >
            {busy ? 'Applying…' : `Apply to ${count}`}
          </button>
        </footer>
      </aside>
    </>
  );
}

function FieldRow({
  enabled, onToggle, label, children
}: {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border ${enabled ? 'border-brand/40 bg-brand/[0.04]' : 'border-line'} p-3 transition`}>
      <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted font-semibold cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => onToggle(e.target.checked)}
        />
        {label}
      </label>
      <div className={`mt-2 ${enabled ? '' : 'opacity-40 pointer-events-none'}`}>
        {children}
      </div>
    </div>
  );
}

/**
 * Per-row mini chart of the last 7 days of view counts. The series is
 * synthesised from product metadata until we ship real impression
 * tracking — see `lib/productViewSeries.ts` for the swap-in point.
 */
function ProductViewsCell({ product }: { product: EnrichedProduct }) {
  const series = useMemo(() => productViewSeries({
    id: product.id,
    sku: product.sku,
    rating: product.rating,
    reviewsCount: product.reviewsCount,
    stock: product.stock
  }), [product.id, product.sku, product.rating, product.reviewsCount, product.stock]);
  const total = series.reduce((s, n) => s + n, 0);
  const early = (series[0] + series[1] + series[2] + series[3]) / 4;
  const late  = (series[4] + series[5] + series[6]) / 3;
  const delta = early > 0 ? ((late - early) / early) * 100 : 0;
  const positive = delta >= 0;
  const colour = positive ? 'rgb(var(--success))' : 'rgb(var(--danger))';
  return (
    <div className="inline-flex items-center gap-2">
      <Sparkline data={series} width={84} height={24} color={colour} />
      <div className="text-[10px] leading-tight">
        <div className="font-mono text-ink">{total.toLocaleString()}</div>
        <div className={positive ? 'text-success' : 'text-danger'}>
          {positive ? '↑' : '↓'} {Math.abs(delta).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}

/**
 * Storefront-style preview of the in-flight product. Mirrors the real
 * ProductCard so the admin sees badges, pricing, gradient text, stock
 * gauge, and rating placeholder land exactly where they will on /shop.
 *
 * Sticky inside the modal so it stays visible while the form scrolls.
 */
function ProductPreview({ editing }: { editing: Partial<Product> }) {
  const discount = editing.oldPrice && editing.price && editing.oldPrice > editing.price
    ? Math.round(((editing.oldPrice - editing.price) / editing.oldPrice) * 100)
    : 0;
  const stock = editing.stock ?? 0;
  const inStock = stock > 0;
  const lowStock = inStock && stock < 30;

  return (
    <div className="lg:sticky lg:top-2 self-start">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted font-semibold mb-2">Live preview</div>
      <div className="rounded-3xl border border-dashed border-line/70 p-4 bg-elev/30">
        {/* Mock card — copied from ProductCard but driven by `editing` */}
        <div className="card card-hover p-3 sm:p-4 flex flex-col relative overflow-hidden">
          <div className="relative">
            <ProductIllustration
              category={editing.category || 'charging'}
              icon={editing.icon || 'box'}
              className="aspect-square"
              size={88}
            />
            {editing.badge && (
              <span className="absolute top-3 left-3 chip bg-brand text-white !text-[10px]">{editing.badge}</span>
            )}
            {discount > 0 && (
              <span className="absolute top-3 right-3 chip bg-danger text-white !text-[10px]">−{discount}%</span>
            )}
          </div>
          <div className="mt-3 flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              {editing.brand || 'Brand'}
            </div>
            <div className="text-sm font-semibold text-ink line-clamp-1 mt-0.5">
              {editing.name || 'Untitled product'}
            </div>
            <div className="text-[11px] text-muted font-mono mt-0.5 line-clamp-1">
              {editing.sku || 'no-sku'}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base font-bold gradient-text">
              ${(editing.price ?? 0).toFixed(2)}
            </span>
            {editing.oldPrice && (
              <span className="text-[11px] text-muted line-through">
                ${editing.oldPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className={`grid place-items-center h-2 w-2 rounded-full ${inStock ? 'bg-success' : 'bg-danger'}`} />
            <span className={inStock ? 'text-muted' : 'text-danger'}>
              {inStock ? `${stock} in stock` : 'Out of stock'}
            </span>
            {lowStock && <span className="text-warn">· low</span>}
          </div>
        </div>

        {/* Inline marketing copy preview */}
        {editing.description && (
          <div className="mt-3 text-xs text-muted leading-relaxed line-clamp-4 px-1">
            {editing.description}
          </div>
        )}

        {(editing.features?.length || 0) > 0 && (
          <ul className="mt-3 space-y-1.5 px-1">
            {(editing.features || []).slice(0, 4).map(f => (
              <li key={f} className="flex items-start gap-2 text-[11px] text-muted">
                <Icon.check width={11} height={11} className="text-success shrink-0 mt-0.5" />
                <span className="line-clamp-1">{f}</span>
              </li>
            ))}
            {(editing.features?.length || 0) > 4 && (
              <li className="text-[11px] text-muted italic pl-5">
                +{(editing.features!.length - 4)} more…
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Suggests three alt-text candidates derived from the product's own
 * fields. Not LLM-backed — the admin still owns the final wording, but
 * a couple of one-click starts removes the "I'll come back to it later"
 * inertia that leaves images unlabelled in practice.
 *
 * The suggester surfaces a length hint (recommended: 5-15 words, < 125
 * chars) so admins land closer to WCAG-friendly phrasing.
 */
function AltTextSuggester({
  value, onChange, product
}: {
  value: string;
  onChange: (v: string) => void;
  product: Partial<Product>;
}) {
  const suggestions = useMemo(() => buildAltSuggestions(product), [product]);
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const overLimit = value.length > 125;
  const tone = !value
    ? 'text-muted'
    : overLimit
      ? 'text-danger'
      : words < 3 ? 'text-warn' : 'text-success';

  return (
    <div className="space-y-2">
      <textarea
        rows={2}
        className="input"
        placeholder={suggestions[0] || `Photo of a ${product.category || 'product'}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={200}
      />
      <div className={`flex items-center justify-between text-[11px] ${tone}`}>
        <span>{words} word{words === 1 ? '' : 's'} · {value.length}/125 chars</span>
        <span className="text-muted italic">
          Tip: describe the product so a screen reader user "sees" it.
        </span>
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[10px] uppercase tracking-wide text-muted font-semibold mr-1 self-center">Try</span>
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(s)}
              className="chip border border-line text-muted hover:text-brand hover:border-brand/40 transition text-[11px]"
            >
              {s.slice(0, 60)}{s.length > 60 ? '…' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function buildAltSuggestions(p: Partial<Product>): string[] {
  const name  = (p.name || '').trim();
  const brand = (p.brand || '').trim();
  const cat   = (p.category || 'product').trim();
  const firstFeat = (p.features || [])[0]?.trim() || '';

  const out: string[] = [];
  if (name && brand) out.push(`${brand} ${name} — ${cat} accessory in a neutral silver finish`);
  if (name)          out.push(`${name} pictured against a soft grey background, ready to ship`);
  if (firstFeat)     out.push(`${name || cat}: ${firstFeat.toLowerCase()}`);
  // Always keep at least one safe fallback so the suggester never returns 0.
  if (out.length === 0) out.push(`Voltik ${cat} accessory shown on a neutral surface`);
  // Trim to 125 chars so the tip and the suggestion line up.
  return out.map(s => s.length > 125 ? `${s.slice(0, 122).trimEnd()}…` : s).slice(0, 3);
}

/**
 * Spreadsheet-style cell. Double-click (or Enter/F2 with the cell focused)
 * opens a number input pre-selected; Enter commits, Esc cancels, blur
 * commits. Calls back with the parsed numeric value when the entry changed.
 *
 * The parent owns the value so React state and the network write live
 * together — see `patchField` for the optimistic + rollback choreography.
 */
function InlineNumberCell({
  value, decimals, format, ariaLabel, onCommit, renderDisplay
}: {
  value: number;
  decimals: number;
  format: (v: number) => string;
  ariaLabel: string;
  onCommit: (v: number) => void;
  renderDisplay?: (v: number) => React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value.toFixed(decimals));
  }, [value, decimals, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const parsed = Number(draft);
    setEditing(false);
    if (Number.isFinite(parsed) && parsed !== value) onCommit(parsed);
    else setDraft(value.toFixed(decimals));
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step={decimals === 0 ? '1' : `0.${'0'.repeat(decimals - 1)}1`}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter')  { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { e.preventDefault(); setDraft(value.toFixed(decimals)); setEditing(false); }
        }}
        aria-label={ariaLabel}
        className="w-20 rounded-lg border border-brand bg-bg px-2 py-1 text-right font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand/50"
      />
    );
  }

  return (
    <button
      type="button"
      onDoubleClick={() => setEditing(true)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); setEditing(true); } }}
      title="Double-click to edit"
      aria-label={`${ariaLabel} — double-click to edit`}
      className="inline-flex items-center justify-end rounded-md px-1 -mx-1 hover:bg-elev hover:ring-1 hover:ring-line transition cursor-text"
    >
      {renderDisplay ? renderDisplay(value) : format(value)}
    </button>
  );
}

function Modal({
  children, title, onClose, wide = false
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-bg/70 backdrop-blur-md animate-slidein" onClick={onClose}>
      <div className={`card w-full p-6 max-h-[92vh] overflow-y-auto ${wide ? 'max-w-5xl' : 'max-w-2xl'}`} onClick={e => e.stopPropagation()}>
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
