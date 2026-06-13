'use client';
import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductCard } from '@/components/ProductCard';
import { Icon } from '@/components/Icons';
import { buildTree, descendantIds, categoryPath } from '@/lib/categoryTree';
import type { EnrichedProduct, Category, CategoryNode } from '@/lib/types';

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

const SORTS: { key: Sort; label: string }[] = [
  { key: 'featured',   label: 'Featured' },
  { key: 'price-asc',  label: 'Price: Low → High' },
  { key: 'price-desc', label: 'Price: High → Low' },
  { key: 'rating',     label: 'Top rated' },
  { key: 'newest',     label: 'Newest' }
];

export function ShopClient({ products, categories }: { products: EnrichedProduct[]; categories: Category[] }) {
  const sp = useSearchParams();
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState<string>(sp.get('category') || 'all');
  const [query, setQuery]                   = useState<string>(sp.get('q') || '');
  const [sort, setSort]                     = useState<Sort>((sp.get('sort') as Sort) || 'featured');
  const [maxPrice, setMaxPrice]             = useState<number>(200);
  const [minRating, setMinRating]           = useState<number>(0);

  const tree = useMemo(() => buildTree(categories), [categories]);

  // Auto-expand the path to the active node so the sidebar reveals it.
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    tree.forEach(r => { init[r.id] = true; });
    return init;
  });
  useEffect(() => {
    if (activeCategory !== 'all') {
      categoryPath(activeCategory, categories).forEach(c => {
        setExpanded(prev => prev[c.id] ? prev : { ...prev, [c.id]: true });
      });
    }
  }, [activeCategory, categories]);

  // URL sync
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory !== 'all') params.set('category', activeCategory);
    if (query) params.set('q', query);
    if (sort !== 'featured') params.set('sort', sort);
    const qs = params.toString();
    router.replace(qs ? `/shop?${qs}` : '/shop', { scroll: false });
  }, [activeCategory, query, sort, router]);

  // For each category, count products in its entire subtree.
  const subtreeCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const c of categories) {
      const subtree = descendantIds(c.id, categories);
      out[c.id] = products.filter(p => subtree.includes(p.category)).length;
    }
    return out;
  }, [products, categories]);

  const filtered = useMemo(() => {
    let rows = products.slice();
    if (activeCategory !== 'all') {
      const subtree = descendantIds(activeCategory, categories);
      rows = rows.filter(p => subtree.includes(p.category));
    }
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    rows = rows.filter(p => p.price <= maxPrice && p.rating >= minRating);

    switch (sort) {
      case 'price-asc':  rows.sort((a, b) => a.price - b.price); break;
      case 'price-desc': rows.sort((a, b) => b.price - a.price); break;
      case 'rating':     rows.sort((a, b) => b.rating - a.rating); break;
      case 'newest':     rows.sort((a, b) => a.id < b.id ? 1 : -1); break;
    }
    return rows;
  }, [products, activeCategory, query, sort, maxPrice, minRating, categories]);

  // Active-category breadcrumb shown above the grid.
  const breadcrumb = activeCategory === 'all' ? [] : categoryPath(activeCategory, categories);

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-8">
      {/* Sidebar */}
      <aside className="space-y-6 lg:sticky lg:top-20 self-start">
        <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2">
          <Icon.search width={16} height={16} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted"
          />
          {query && <button onClick={() => setQuery('')} className="text-muted hover:text-ink"><Icon.close width={14} height={14}/></button>}
        </div>

        {/* Tree-based category filter */}
        <div className="card p-4">
          <h4 className="text-xs uppercase tracking-wide text-muted mb-3 font-semibold">Categories</h4>
          <ul className="space-y-0.5">
            <FilterRow label="All Products" active={activeCategory === 'all'} count={products.length}
              onClick={() => setActiveCategory('all')} depth={0} hasChildren={false} expanded={false} onToggle={() => {}} />
            {tree.map(node => (
              <CategoryBranch key={node.id} node={node}
                active={activeCategory} onSelect={setActiveCategory}
                counts={subtreeCounts} expanded={expanded}
                onToggle={(id) => setExpanded(e => ({ ...e, [id]: !e[id] }))} />
            ))}
          </ul>
        </div>

        {/* Price */}
        <div className="card p-4">
          <h4 className="text-xs uppercase tracking-wide text-muted mb-3 font-semibold">Max price</h4>
          <input
            type="range" min={5} max={200} step={5}
            value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-brand"
          />
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-muted">$5</span>
            <span className="font-semibold text-ink">${maxPrice}</span>
            <span className="text-muted">$200+</span>
          </div>
        </div>

        {/* Rating */}
        <div className="card p-4">
          <h4 className="text-xs uppercase tracking-wide text-muted mb-3 font-semibold">Minimum rating</h4>
          <div className="flex gap-1.5 flex-wrap">
            {[0, 4, 4.5, 4.8].map(r => (
              <button
                key={r}
                onClick={() => setMinRating(r)}
                className={`chip border ${minRating === r ? 'bg-brand text-white border-brand' : 'border-line text-muted hover:text-ink'}`}
              >
                {r === 0 ? 'Any' : `${r}+ ★`}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Results */}
      <section>
        {breadcrumb.length > 0 && (
          <nav className="text-xs text-muted mb-4 flex items-center gap-1 flex-wrap">
            <button onClick={() => setActiveCategory('all')} className="hover:text-ink">Shop</button>
            {breadcrumb.map((c, i) => (
              <span key={c.id} className="flex items-center gap-1">
                <span>/</span>
                {i < breadcrumb.length - 1 ? (
                  <button onClick={() => setActiveCategory(c.id)} className="hover:text-ink">{c.name}</button>
                ) : (
                  <span className="text-ink font-semibold">{c.name}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div className="text-sm text-muted">
            Showing <span className="text-ink font-semibold">{filtered.length}</span> of {products.length} products
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
            >
              {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <Icon.search width={32} height={32} className="mx-auto text-muted" />
            <h3 className="font-display font-bold text-xl mt-3">No matches</h3>
            <p className="text-sm text-muted mt-1">Try a different category, search term, or price range.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}

/* ─── Tree filter rows ──────────────────────────────────────────────── */

function CategoryBranch({ node, active, onSelect, counts, expanded, onToggle }: {
  node: CategoryNode; active: string; onSelect: (id: string) => void;
  counts: Record<string, number>; expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const isOpen = expanded[node.id];
  const hasChildren = node.children.length > 0;
  return (
    <li>
      <FilterRow label={node.name}
        active={active === node.id}
        count={counts[node.id] || 0}
        onClick={() => onSelect(node.id)}
        depth={node.depth}
        hasChildren={hasChildren}
        expanded={isOpen}
        onToggle={() => onToggle(node.id)} />
      {isOpen && hasChildren && (
        <ul className="space-y-0.5">
          {node.children.map(child => (
            <CategoryBranch key={child.id} node={child}
              active={active} onSelect={onSelect}
              counts={counts} expanded={expanded} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </li>
  );
}

function FilterRow({ label, active, count, onClick, depth, hasChildren, expanded, onToggle }: {
  label: string; active: boolean; count: number; onClick: () => void;
  depth: number; hasChildren: boolean; expanded: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center" style={{ paddingLeft: depth * 12 }}>
      {hasChildren ? (
        <button onClick={onToggle} aria-label="Toggle"
          className="h-6 w-6 grid place-items-center rounded-md text-muted hover:bg-elev shrink-0">
          <Icon.arrow width={10} height={10} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      ) : <span className="w-6 shrink-0" />}
      <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition ${active ? 'bg-brand/10 text-brand font-semibold' : 'text-muted hover:text-ink hover:bg-elev'}`}
      >
        <span className="truncate">{label}</span>
        <span className={`text-xs ${active ? 'text-brand' : 'text-muted'}`}>{count}</span>
      </button>
    </div>
  );
}
