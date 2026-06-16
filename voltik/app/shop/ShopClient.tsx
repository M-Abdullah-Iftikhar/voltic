'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductCard } from '@/components/ProductCard';
import { ProductListRow } from '@/components/ProductListRow';
import { Icon } from '@/components/Icons';
import { EmptyState } from '@/components/EmptyState';
import { RecentlyViewed } from '@/components/RecentlyViewed';
import { FlipGrid } from '@/components/FlipGrid';
import { FilterAwareBlurb } from '@/components/FilterAwareBlurb';
import { buildTree, descendantIds, categoryPath } from '@/lib/categoryTree';
import type { EnrichedProduct, Category, CategoryNode } from '@/lib/types';

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

const SORTS: { key: Sort; label: string; icon: 'spark' | 'arrow' | 'star' | 'refresh' }[] = [
  { key: 'featured',   label: 'Featured',           icon: 'spark' },
  { key: 'price-asc',  label: 'Price: Low → High',  icon: 'arrow' },
  { key: 'price-desc', label: 'Price: High → Low',  icon: 'arrow' },
  { key: 'rating',     label: 'Top rated',          icon: 'star' },
  { key: 'newest',     label: 'Newest',             icon: 'refresh' }
];

export function ShopClient({ products, categories }: { products: EnrichedProduct[]; categories: Category[] }) {
  const sp = useSearchParams();
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState<string>(sp.get('category') || 'all');
  const [query, setQuery]                   = useState<string>(sp.get('q') || '');
  const [sort, setSort]                     = useState<Sort>((sp.get('sort') as Sort) || 'featured');
  const [maxPrice, setMaxPrice]             = useState<number>(200);
  const [minRating, setMinRating]           = useState<number>(0);
  const [view, setView]                     = useState<'grid' | 'list'>('grid');

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

        {/* Active filter chips */}
        <ActiveFilterChips
          activeCategory={activeCategory}
          categoryName={breadcrumb[breadcrumb.length - 1]?.name}
          query={query}
          maxPrice={maxPrice}
          minRating={minRating}
          sort={sort}
          onClearCategory={() => setActiveCategory('all')}
          onClearQuery={() => setQuery('')}
          onClearPrice={() => setMaxPrice(200)}
          onClearRating={() => setMinRating(0)}
          onClearSort={() => setSort('featured')}
          onClearAll={() => {
            setActiveCategory('all'); setQuery(''); setMaxPrice(200); setMinRating(0); setSort('featured');
          }}
        />

        {/* Filter-aware blurb — a one-liner that reads the current filter
            set and writes a short editorial line above the grid. Pure
            heuristic, no LLM — see `FilterAwareBlurb` for the rule set. */}
        <FilterAwareBlurb
          category={activeCategory}
          categoryName={breadcrumb[breadcrumb.length - 1]?.name}
          query={query}
          sort={sort}
          resultCount={filtered.length}
          maxPrice={maxPrice}
        />

        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div className="text-sm text-muted">
            Showing <span className="text-ink font-semibold">{filtered.length}</span> of {products.length} products
          </div>
          <div className="flex items-center gap-2">
            {/* Grid / list toggle */}
            <div className="inline-flex items-center rounded-full border border-line bg-surface p-0.5">
              <button
                onClick={() => setView('grid')}
                aria-pressed={view === 'grid'}
                aria-label="Grid view"
                className={`grid place-items-center h-7 w-7 rounded-full transition ${view === 'grid' ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}
              >
                <Icon.dashboard width={13} height={13} />
              </button>
              <button
                onClick={() => setView('list')}
                aria-pressed={view === 'list'}
                aria-label="List view"
                className={`grid place-items-center h-7 w-7 rounded-full transition ${view === 'list' ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}
              >
                <Icon.list width={13} height={13} />
              </button>
            </div>

            <span className="text-xs text-muted">Sort</span>
            <SortPicker value={sort} onChange={setSort} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            kind="search"
            title="No products match"
            body="Try removing a filter or searching a different term."
            primary={{ href: '/shop', label: 'Reset filters' }}
          />
        ) : view === 'grid' ? (
          <FlipGrid
            signature={`grid:${activeCategory}:${query}:${sort}:${maxPrice}:${minRating}:${filtered.map(p => p.id).join(',')}`}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filtered.map(p => (
              <div key={p.id} data-flip-id={p.id}>
                <ProductCard product={p} />
              </div>
            ))}
          </FlipGrid>
        ) : (
          <FlipGrid
            signature={`list:${activeCategory}:${query}:${sort}:${maxPrice}:${minRating}:${filtered.map(p => p.id).join(',')}`}
            className="space-y-3"
          >
            {filtered.map(p => (
              <div key={p.id} data-flip-id={p.id}>
                <ProductListRow product={p} />
              </div>
            ))}
          </FlipGrid>
        )}

        {/* End-of-grid graphic + recently-viewed strip */}
        {filtered.length > 0 && filtered.length === products.length && (
          <div className="mt-12 text-center text-xs text-muted">
            <Icon.check width={16} height={16} className="text-success mx-auto mb-1.5" />
            You've seen all {products.length} products in the catalog
          </div>
        )}
        {filtered.length > 0 && filtered.length < products.length && (
          <div className="mt-10 text-center text-xs text-muted">
            <Icon.spark width={14} height={14} className="mx-auto mb-1 text-brand" />
            That's everything matching your filters · adjust filters to see more
          </div>
        )}

        <RecentlyViewed catalog={products} title="Recently viewed by you" />
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

/* ─── Sort picker with visual icons ─────────────────────────────────── */

function SortPicker({ value, onChange }: { value: Sort; onChange: (s: Sort) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = SORTS.find(s => s.key === value) || SORTS[0];

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm hover:border-brand/40 transition"
      >
        <SortIcon kind={current.key} />
        <span className="text-ink font-medium">{current.label}</span>
        <Icon.arrow width={11} height={11} className={`text-muted transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Sort products"
          className="absolute z-40 right-0 mt-2 w-56 card p-1 animate-slidein"
        >
          {SORTS.map(s => {
            const active = s.key === value;
            return (
              <li key={s.key}>
                <button
                  role="option"
                  aria-selected={active}
                  onClick={() => { onChange(s.key); setOpen(false); }}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-left transition ${active ? 'bg-brand/10 text-brand' : 'text-ink hover:bg-elev'}`}
                >
                  <SortIcon kind={s.key} />
                  <span className="flex-1">{s.label}</span>
                  {active && <Icon.check width={12} height={12} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SortIcon({ kind }: { kind: Sort }) {
  // Rotate the arrow to indicate price direction; star/refresh/spark speak for themselves.
  if (kind === 'price-asc')  return <Icon.arrow width={12} height={12} className="text-brand rotate-90" />;
  if (kind === 'price-desc') return <Icon.arrow width={12} height={12} className="text-brand -rotate-90" />;
  if (kind === 'rating')     return <Icon.star    width={12} height={12} className="text-warn" />;
  if (kind === 'newest')     return <Icon.refresh width={12} height={12} className="text-success" />;
  return <Icon.spark width={12} height={12} className="text-brand" />;
}

/* ─── Active filter chips ───────────────────────────────────────────── */

function ActiveFilterChips({
  activeCategory, categoryName, query, maxPrice, minRating, sort,
  onClearCategory, onClearQuery, onClearPrice, onClearRating, onClearSort, onClearAll
}: {
  activeCategory: string; categoryName?: string; query: string; maxPrice: number;
  minRating: number; sort: Sort;
  onClearCategory: () => void; onClearQuery: () => void; onClearPrice: () => void;
  onClearRating: () => void; onClearSort: () => void; onClearAll: () => void;
}) {
  const chips: { key: string; label: string; onClear: () => void }[] = [];
  if (activeCategory !== 'all') chips.push({ key: 'cat',    label: categoryName || activeCategory, onClear: onClearCategory });
  if (query)                    chips.push({ key: 'q',      label: `“${query}”`,                   onClear: onClearQuery });
  if (maxPrice < 200)           chips.push({ key: 'price',  label: `≤ $${maxPrice}`,               onClear: onClearPrice });
  if (minRating > 0)            chips.push({ key: 'rating', label: `${minRating}+ ★`,              onClear: onClearRating });
  if (sort !== 'featured')      chips.push({ key: 'sort',   label: `Sort: ${SORTS.find(s => s.key === sort)?.label}`, onClear: onClearSort });

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4 animate-slidein">
      <span className="text-xs uppercase tracking-wide text-muted font-semibold">Active filters</span>
      {chips.map(c => (
        <button
          key={c.key}
          onClick={c.onClear}
          className="chip bg-brand/10 text-brand hover:bg-brand/20 transition"
        >
          {c.label}
          <Icon.close width={10} height={10} className="ml-1" />
        </button>
      ))}
      <button onClick={onClearAll} className="text-xs text-muted hover:text-danger underline-offset-2 hover:underline">
        Clear all
      </button>
    </div>
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
