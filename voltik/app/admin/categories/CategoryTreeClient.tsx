'use client';
import { useMemo, useState } from 'react';
import { Icon, type IconKey } from '@/components/Icons';
import { ProductIllustration } from '@/components/ProductIllustration';
import { AdminPageHeader } from '@/components/AdminPageHeader';
import { buildTree, CATEGORY_GRADIENTS, descendantIds } from '@/lib/categoryTree';
import type { Category, CategoryNode } from '@/lib/types';

const ICON_OPTIONS: IconKey[] = ['bolt','cable','battery','wireless','plug','car','earbud','headset','speaker','shield','case','camlens','ringlight','tripod','gimbal','chip','stand','box','tag','spark'];

type EditorState =
  | { mode: 'create'; parent: string | null }
  | { mode: 'edit'; category: Category };

const blank = (parent: string | null): Partial<Category> => ({
  parent, name: '', icon: 'box', blurb: '', gradient: CATEGORY_GRADIENTS[0].value
});

export function CategoryTreeClient({ initialCategories, productCounts }: { initialCategories: Category[]; productCounts: Record<string, number> }) {
  const [categories, setCategories] = useState(initialCategories);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialCategories.filter(c => c.parent === null).map(c => [c.id, true]))
  );
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [draft, setDraft] = useState<Partial<Category>>(blank(null));
  const [confirmDel, setConfirmDel] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const tree = useMemo(() => buildTree(categories), [categories]);
  const flat = useMemo(() => categories, [categories]);

  // Compute subtree counts (products in this node + all descendants).
  const subtreeCounts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const c of categories) {
      const subtree = descendantIds(c.id, categories);
      result[c.id] = subtree.reduce((s, id) => s + (productCounts[id] || 0), 0);
    }
    return result;
  }, [categories, productCounts]);

  const openCreate = (parent: string | null) => {
    setEditor({ mode: 'create', parent });
    setDraft(blank(parent));
    setError('');
  };
  const openEdit = (cat: Category) => {
    setEditor({ mode: 'edit', category: cat });
    setDraft({ ...cat });
    setError('');
  };
  const closeEditor = () => { setEditor(null); setError(''); };

  const save = async () => {
    if (!draft.name?.trim()) { setError('Name is required.'); return; }
    setBusy(true); setError('');
    try {
      const isUpdate = editor?.mode === 'edit';
      const url = isUpdate ? `/api/categories/${(editor as any).category.id}` : '/api/categories';
      const method = isUpdate ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); setBusy(false); return; }
      setCategories(prev => {
        const i = prev.findIndex(c => c.id === data.id);
        if (i >= 0) { const copy = prev.slice(); copy[i] = data; return copy; }
        return [data, ...prev];
      });
      // Expand the new parent so the new node is visible.
      if (!isUpdate && data.parent) setExpanded(e => ({ ...e, [data.parent]: true }));
      closeEditor();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (cat: Category, cascade: boolean) => {
    setBusy(true); setError('');
    const res = await fetch(`/api/categories/${cat.id}${cascade ? '?cascade=1' : ''}`, { method: 'DELETE' });
    const data = await res.json();
    setBusy(false);
    if (!res.ok && res.status === 409) {
      setError(`This category has ${data.childCount} children and ${data.productCount} products. Confirm to delete the entire subtree.`);
      // Keep dialog open; user clicks "Delete subtree".
      (cat as any).__needsCascade = true;
      setConfirmDel({ ...cat });
      return;
    }
    if (!res.ok) { setError(data.error || 'Delete failed'); return; }
    const removed: string[] = data.removed || [cat.id];
    setCategories(prev => prev.filter(c => !removed.includes(c.id)));
    setConfirmDel(null);
  };

  const toggle = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const expandAll = () => setExpanded(Object.fromEntries(categories.map(c => [c.id, true])));
  const collapseAll = () => setExpanded({});

  // Optional flat-filter mode when searching.
  const visibleFlat = filter.trim()
    ? categories.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
    : null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categories"
        subtitle="Hierarchical taxonomy — create roots, subcategories and sub-sub-categories on the fly."
        crumbs={[{ label: 'Categories' }]}
        secondary={{ label: 'Expand all', onClick: expandAll }}
        primary={{ label: 'New root category', icon: 'plus', onClick: () => openCreate(null) }}
      />
      <div className="flex justify-end">
        <button onClick={collapseAll} className="text-xs text-muted hover:text-ink">Collapse all</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total nodes"      value={String(categories.length)} icon="tag" />
        <StatCard label="Root categories"  value={String(categories.filter(c => c.parent === null).length)} icon="globe" />
        <StatCard label="Sub-categories"   value={String(categories.filter(c => c.parent !== null).length)} icon="list" />
        <StatCard label="Max depth"        value={String(maxDepth(tree))} icon="trending" />
      </div>

      {/* Search */}
      <div className="card p-4 flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-line bg-bg px-3 py-2 flex-1">
          <Icon.search width={14} height={14} className="text-muted" />
          <input value={filter} onChange={e => setFilter(e.target.value)} className="bg-transparent outline-none text-sm flex-1" placeholder="Quick-find by name…" />
          {filter && <button onClick={() => setFilter('')} className="text-muted hover:text-ink"><Icon.close width={12} height={12} /></button>}
        </div>
        <span className="text-xs text-muted">{visibleFlat ? `${visibleFlat.length} match` : `Tree view`}</span>
      </div>

      {/* Tree / flat results */}
      <div className="card p-4 sm:p-6">
        {visibleFlat ? (
          <ul className="space-y-2">
            {visibleFlat.map(c => (
              <li key={c.id}>
                <CategoryRow node={{ ...c, children: [], depth: 0 }} categories={flat} productCount={productCounts[c.id] || 0} subtreeCount={subtreeCounts[c.id] || 0}
                  expanded={false} hasChildren={false} onToggle={() => {}} onAddChild={openCreate} onEdit={openEdit} onDelete={setConfirmDel} hideAddChild />
              </li>
            ))}
            {visibleFlat.length === 0 && <li className="text-center text-muted py-8 text-sm">No categories match.</li>}
          </ul>
        ) : (
          <TreeView tree={tree} categories={flat} productCounts={productCounts} subtreeCounts={subtreeCounts}
            expanded={expanded} onToggle={toggle}
            onAddChild={openCreate} onEdit={openEdit} onDelete={setConfirmDel} />
        )}
      </div>

      {/* Editor modal */}
      {editor && (
        <Modal title={editor.mode === 'create' ? 'New category' : `Edit "${(editor as any).category?.name}"`} onClose={closeEditor}>
          <CategoryForm
            draft={draft} setDraft={setDraft}
            categories={categories}
            currentId={editor.mode === 'edit' ? (editor as any).category.id : null}
            error={error}
          />
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={closeEditor} className="btn-ghost text-sm">Cancel</button>
            <button onClick={save} disabled={busy} className="btn-primary text-sm disabled:opacity-60">
              {busy ? 'Saving…' : editor.mode === 'edit' ? 'Save changes' : 'Create category'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <Modal title="Delete category?" onClose={() => { setConfirmDel(null); setError(''); }}>
          <p className="text-sm text-muted">
            Removing <span className="font-semibold text-ink">{confirmDel.name}</span>.
            {error && <span className="block mt-2 text-warn">{error}</span>}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => { setConfirmDel(null); setError(''); }} className="btn-ghost text-sm">Cancel</button>
            <button onClick={() => remove(confirmDel, false)} disabled={busy} className="btn !bg-danger text-white text-sm">Delete</button>
            {(confirmDel as any).__needsCascade && (
              <button onClick={() => remove(confirmDel, true)} disabled={busy} className="btn !bg-danger text-white text-sm">Delete subtree</button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─────────────── Subcomponents ─────────────── */

function TreeView({
  tree, categories, productCounts, subtreeCounts, expanded, onToggle, onAddChild, onEdit, onDelete
}: {
  tree: CategoryNode[]; categories: Category[]; productCounts: Record<string, number>; subtreeCounts: Record<string, number>;
  expanded: Record<string, boolean>; onToggle: (id: string) => void;
  onAddChild: (parent: string | null) => void; onEdit: (cat: Category) => void; onDelete: (cat: Category) => void;
}) {
  return (
    <ul className="space-y-1">
      {tree.map(node => (
        <TreeBranch key={node.id} node={node}
          categories={categories} productCounts={productCounts} subtreeCounts={subtreeCounts}
          expanded={expanded} onToggle={onToggle}
          onAddChild={onAddChild} onEdit={onEdit} onDelete={onDelete} />
      ))}
      {tree.length === 0 && (
        <li className="text-center text-muted py-10 text-sm">
          No categories yet — click <span className="text-ink font-semibold">New root category</span> to begin.
        </li>
      )}
    </ul>
  );
}

function TreeBranch(props: any) {
  const { node, expanded, onToggle, categories, productCounts, subtreeCounts, onAddChild, onEdit, onDelete } = props;
  const isOpen = expanded[node.id];
  const hasChildren = node.children.length > 0;
  return (
    <li>
      <CategoryRow node={node} categories={categories} productCount={productCounts[node.id] || 0} subtreeCount={subtreeCounts[node.id] || 0}
        expanded={isOpen} hasChildren={hasChildren} onToggle={() => onToggle(node.id)}
        onAddChild={onAddChild} onEdit={onEdit} onDelete={onDelete} />
      {isOpen && hasChildren && (
        <ul className="ml-3 sm:ml-6 mt-1 pl-3 border-l border-line space-y-1">
          {node.children.map((child: CategoryNode) => (
            <TreeBranch key={child.id} node={child}
              categories={categories} productCounts={productCounts} subtreeCounts={subtreeCounts}
              expanded={expanded} onToggle={onToggle}
              onAddChild={onAddChild} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </li>
  );
}

function CategoryRow({
  node, productCount, subtreeCount, expanded, hasChildren, onToggle, onAddChild, onEdit, onDelete, hideAddChild
}: any) {
  return (
    <div className="group flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-elev/60 transition">
      <button onClick={onToggle} aria-label="Toggle"
        className={`h-6 w-6 grid place-items-center rounded-md text-muted shrink-0 ${hasChildren ? 'hover:bg-elev' : 'opacity-0 pointer-events-none'}`}>
        <Icon.arrow width={12} height={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      <ProductIllustration category={node.id} icon={node.icon} className="h-9 w-9 rounded-xl shrink-0" size={18} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm line-clamp-1">{node.name}</span>
          <span className="text-[10px] text-muted font-mono">{node.id}</span>
          {node.parent === null && <span className="chip bg-brand/10 text-brand">Root</span>}
        </div>
        <div className="text-xs text-muted flex items-center gap-3 mt-0.5">
          {node.blurb && <span className="line-clamp-1">{node.blurb}</span>}
          <span className="shrink-0">· {productCount} direct · {subtreeCount} in subtree</span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition shrink-0">
        {!hideAddChild && (
          <button onClick={() => onAddChild(node.id)} title="Add sub-category"
            className="h-8 w-8 grid place-items-center rounded-lg border border-line hover:bg-brand hover:text-white">
            <Icon.plus width={14} height={14} />
          </button>
        )}
        <button onClick={() => onEdit(node)} title="Edit"
          className="h-8 w-8 grid place-items-center rounded-lg border border-line hover:bg-elev">
          <Icon.edit width={14} height={14} />
        </button>
        <button onClick={() => onDelete(node)} title="Delete"
          className="h-8 w-8 grid place-items-center rounded-lg border border-line hover:bg-danger/10 hover:text-danger">
          <Icon.trash width={14} height={14} />
        </button>
      </div>
    </div>
  );
}

function CategoryForm({
  draft, setDraft, categories, currentId, error
}: {
  draft: Partial<Category>; setDraft: (c: Partial<Category>) => void;
  categories: Category[]; currentId: string | null; error: string;
}) {
  // For "edit", filter out self + own descendants from the parent picker.
  const excluded = new Set<string>();
  if (currentId) {
    descendantIds(currentId, categories).forEach(id => excluded.add(id));
  }
  const tree = buildTree(categories);
  const options = parentOptions(tree, excluded);

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label="Name" full>
        <input className="input" autoFocus value={draft.name || ''} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. USB-C Cables" />
      </Field>
      <Field label="Parent">
        <select className="input" value={draft.parent || ''} onChange={e => setDraft({ ...draft, parent: e.target.value || null })}>
          <option value="">— Root category —</option>
          {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </Field>
      <Field label="Icon">
        <select className="input" value={draft.icon || 'box'} onChange={e => setDraft({ ...draft, icon: e.target.value })}>
          {(['bolt','cable','battery','wireless','plug','car','earbud','headset','speaker','shield','case','camlens','ringlight','tripod','gimbal','chip','stand','box','tag','spark'] as IconKey[]).map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </Field>
      <Field label="Slug / ID (auto if blank)">
        <input className="input font-mono" value={draft.id || ''} onChange={e => setDraft({ ...draft, id: e.target.value })} placeholder="usb-c-cables" disabled={!!currentId} />
      </Field>
      <Field label="Blurb" full>
        <input className="input" value={draft.blurb || ''} onChange={e => setDraft({ ...draft, blurb: e.target.value })} placeholder="Short tagline shown on landing & shop" />
      </Field>
      <Field label="Gradient" full>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mt-1">
          {CATEGORY_GRADIENTS.map(g => (
            <button key={g.label} type="button" onClick={() => setDraft({ ...draft, gradient: g.value })} title={g.label}
              className={`h-10 rounded-xl border-2 transition ${draft.gradient === g.value ? 'border-brand scale-105' : 'border-transparent'}`}
              style={{ background: g.value }} />
          ))}
        </div>
      </Field>

      <div className="sm:col-span-2 flex items-center gap-3 mt-2 p-3 rounded-2xl bg-elev/40">
        <ProductIllustration category={draft.id || 'preview'} icon={draft.icon || 'box'} className="h-14 w-14 rounded-xl" size={28} />
        <div>
          <div className="text-xs text-muted">Preview</div>
          <div className="font-semibold">{draft.name || 'Untitled category'}</div>
          <div className="text-xs text-muted">{draft.blurb || 'No description'}</div>
        </div>
      </div>

      {error && <div className="sm:col-span-2 text-sm text-danger flex items-center gap-2"><Icon.close width={14} height={14} /> {error}</div>}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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

function StatCard({ label, value, icon }: { label: string; value: string; icon: IconKey }) {
  const Glyph = Icon[icon];
  return (
    <div className="card p-5">
      <span className="grid place-items-center h-10 w-10 rounded-xl bg-brand/10 text-brand">
        <Glyph width={18} height={18} />
      </span>
      <div className="mt-4 font-display font-bold text-2xl">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

/* helpers */
function maxDepth(nodes: CategoryNode[]): number {
  if (nodes.length === 0) return 0;
  return 1 + Math.max(0, ...nodes.map(n => maxDepth(n.children)));
}
function parentOptions(tree: CategoryNode[], excluded: Set<string>, prefix = ''): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const n of tree) {
    if (excluded.has(n.id)) continue;
    const label = `${prefix}${n.name}`;
    out.push({ id: n.id, label });
    out.push(...parentOptions(n.children, excluded, `${label} / `));
  }
  return out;
}
