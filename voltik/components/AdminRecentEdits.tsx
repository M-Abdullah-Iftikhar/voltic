'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon, type IconKey } from './Icons';
import { clearAll, readAll, type RecentEdit, type RecentEditKind } from '@/lib/recentEdits';

const ICON: Record<RecentEditKind, IconKey> = {
  product:    'box',
  order:      'list',
  review:     'star',
  promo:      'spark',
  category:   'tag',
  subscriber: 'heart'
};

/**
 * Sidebar "Recent edits" panel — surfaces the last dozen things the admin
 * touched, with one-click jump back. State lives in localStorage via
 * `lib/recentEdits.ts`. Refreshes on a custom event so any tab in the
 * same browser stays in sync within the session.
 *
 * Rendered as a collapsible card so it stays out of the way until needed.
 */
export function AdminRecentEdits() {
  const [items, setItems] = useState<RecentEdit[]>([]);
  const [open, setOpen]   = useState(true);

  useEffect(() => {
    const refresh = () => setItems(readAll());
    refresh();
    window.addEventListener('voltik:recent-edits', refresh);
    return () => window.removeEventListener('voltik:recent-edits', refresh);
  }, []);

  if (items.length === 0) return null;

  return (
    <aside className="mx-3 mb-3 rounded-2xl border border-line bg-bg/70">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] uppercase tracking-[0.18em] font-semibold text-muted hover:text-ink transition"
      >
        <span className="flex items-center gap-1.5">
          <Icon.refresh width={10} height={10} />
          Recent edits
          <span className="text-[10px] normal-case tracking-normal text-muted/70 font-mono">{items.length}</span>
        </span>
        <Icon.arrow width={10} height={10} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="px-1.5 pb-2 space-y-0.5 max-h-[260px] overflow-y-auto">
          {items.map(item => {
            const Glyph = Icon[ICON[item.kind]] || Icon.spark;
            return (
              <Link
                key={`${item.href}-${item.at}`}
                href={item.href}
                className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-elev transition"
              >
                <span className="grid place-items-center h-6 w-6 rounded-md bg-brand/10 text-brand shrink-0">
                  <Glyph width={11} height={11} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-ink line-clamp-1">{item.title}</div>
                  <div className="text-[10px] text-muted line-clamp-1">
                    {item.sub ? `${item.sub} · ` : ''}{formatRelative(item.at)}
                  </div>
                </div>
                <Icon.arrow width={9} height={9} className="text-muted opacity-0 group-hover:opacity-100 transition" />
              </Link>
            );
          })}
          <button
            onClick={() => clearAll()}
            className="w-full text-[10px] text-muted hover:text-danger pt-1 mt-1 border-t border-line/60"
          >
            Clear history
          </button>
        </div>
      )}
    </aside>
  );
}

function formatRelative(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000)       return 'Just now';
  if (diff < 3_600_000)    return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)   return `${Math.floor(diff / 3_600_000)}h ago`;
  const d = Math.floor(diff / 86_400_000);
  return `${d}d ago`;
}
