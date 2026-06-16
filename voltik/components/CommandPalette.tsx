'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, type IconKey } from './Icons';

type Action = {
  id: string;
  label: string;
  hint?: string;
  icon: IconKey;
  group: string;
  /** Either a URL to navigate to, or a callback. */
  href?: string;
  onSelect?: () => void;
  /** Optional tags for fuzzy matching. */
  keywords?: string[];
};

interface Props {
  /** Page-specific actions to merge into the default set. */
  extra?: Action[];
}

/**
 * Cmd / Ctrl + K command palette. Mount once per app section (admin) — it
 * registers the global hotkey and overlays the screen with a fuzzy-searchable
 * action list. Pure local state, no deps, full keyboard navigation.
 */
export function CommandPalette({ extra = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const baseActions: Action[] = [
    { id:'nav-dash',    group:'Navigate', icon:'dashboard', label:'Go to Dashboard',  href:'/admin' },
    { id:'nav-prod',    group:'Navigate', icon:'box',       label:'Go to Products',   href:'/admin/products' },
    { id:'nav-orders',  group:'Navigate', icon:'list',      label:'Go to Orders',     href:'/admin/orders' },
    { id:'nav-cust',    group:'Navigate', icon:'users',     label:'Go to Customers',  href:'/admin/customers' },
    { id:'nav-cat',     group:'Navigate', icon:'tag',       label:'Go to Categories', href:'/admin/categories' },
    { id:'nav-store',   group:'Navigate', icon:'globe',     label:'View storefront',  href:'/' },
    { id:'new-product', group:'Create',   icon:'plus',      label:'New product',      href:'/admin/products', keywords:['add', 'sku'] },
    { id:'new-cat',     group:'Create',   icon:'tag',       label:'New category',     href:'/admin/categories' },
    { id:'orders-pend', group:'Filter',   icon:'list',      label:'Pending orders',   href:'/admin/orders?status=pending' },
    { id:'orders-ship', group:'Filter',   icon:'truck',     label:'Shipped orders',   href:'/admin/orders?status=shipped' }
  ];
  const allActions = useMemo(() => [...extra, ...baseActions], [extra]);

  // Cmd/Ctrl + K toggles
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Reset query + cursor when re-opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [open]);

  // Fuzzy filter
  const filtered = useMemo(() => {
    if (!query.trim()) return allActions;
    const q = query.toLowerCase();
    return allActions.filter(a =>
      a.label.toLowerCase().includes(q) ||
      a.hint?.toLowerCase().includes(q) ||
      a.keywords?.some(k => k.toLowerCase().includes(q)) ||
      a.group.toLowerCase().includes(q)
    );
  }, [allActions, query]);

  const grouped = useMemo(() => {
    const m = new Map<string, Action[]>();
    filtered.forEach(a => {
      if (!m.has(a.group)) m.set(a.group, []);
      m.get(a.group)!.push(a);
    });
    return m;
  }, [filtered]);

  // Flatten in render order for keyboard navigation
  const flatList = useMemo(() => {
    const out: Action[] = [];
    grouped.forEach(actions => actions.forEach(a => out.push(a)));
    return out;
  }, [grouped]);

  useEffect(() => {
    if (activeIdx >= flatList.length) setActiveIdx(Math.max(0, flatList.length - 1));
  }, [flatList.length, activeIdx]);

  const runAction = (a: Action) => {
    setOpen(false);
    if (a.onSelect) a.onSelect();
    else if (a.href) router.push(a.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(flatList.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(0, i - 1)); }
    else if (e.key === 'Enter')     { e.preventDefault(); const a = flatList[activeIdx]; if (a) runAction(a); }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] p-4 bg-bg/70 backdrop-blur-md"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="card w-full max-w-xl overflow-hidden animate-slidein"
        onClick={e => e.stopPropagation()}
      >
        {/* Search */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
          <Icon.search width={16} height={16} className="text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
            onKeyDown={onKeyDown}
            placeholder="Type to search products, orders, pages…"
            className="bg-transparent outline-none flex-1 text-sm"
            suppressHydrationWarning
          />
          <kbd className="text-[10px] font-mono text-muted bg-elev px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">
          {flatList.length === 0 ? (
            <p className="text-sm text-muted text-center p-8">No matches for "{query}".</p>
          ) : (
            <ul>
              {Array.from(grouped.entries()).map(([group, actions]) => (
                <li key={group}>
                  <div className="text-[10px] uppercase tracking-wide text-muted font-semibold px-4 pt-3 pb-1">{group}</div>
                  <ul>
                    {actions.map(a => {
                      const idxInFlat = flatList.indexOf(a);
                      const active = idxInFlat === activeIdx;
                      const Glyph = Icon[a.icon];
                      return (
                        <li key={a.id}>
                          <button
                            onMouseEnter={() => setActiveIdx(idxInFlat)}
                            onClick={() => runAction(a)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition ${active ? 'bg-brand/10 text-brand' : 'text-ink hover:bg-elev/50'}`}
                          >
                            <span className={`grid place-items-center h-7 w-7 rounded-lg ${active ? 'bg-brand text-white' : 'bg-elev text-muted'}`}>
                              <Glyph width={14} height={14} />
                            </span>
                            <span className="flex-1">{a.label}</span>
                            {active && (
                              <span className="text-[10px] font-mono text-muted bg-elev px-1.5 py-0.5 rounded">↵</span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-line px-4 py-2 flex items-center justify-between text-[10px] text-muted">
          <span className="flex items-center gap-2">
            <kbd className="font-mono bg-elev px-1 rounded">↑</kbd>
            <kbd className="font-mono bg-elev px-1 rounded">↓</kbd>
            navigate
          </span>
          <span>{flatList.length} actions</span>
        </div>
      </div>
    </div>
  );
}
