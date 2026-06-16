'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';

export interface SavedView<T> {
  /** Stable id assigned at creation; we never let users edit this. */
  id: string;
  name: string;
  /** Caller-provided state snapshot. Stored as JSON. */
  state: T;
}

interface Props<T> {
  /** Unique per-page key so different admin tables don't share views. */
  storageKey: string;
  /** Built-in views shipped with the app — non-deletable. */
  presets?: SavedView<T>[];
  /** Current state — snapshot when the user clicks "Save". */
  currentState: T;
  /** Apply a view by handing the state back to the parent. */
  onApply: (state: T) => void;
  /** Optional label rendered before the chips ("Views"). */
  label?: string;
}

/**
 * Saved views pill row. Click a view to apply it; "Save current" snapshots
 * whatever the caller passes in `currentState`. Views persist in
 * localStorage keyed by `storageKey` so each admin table has its own set.
 *
 * Presets ship as read-only chips; user-created views are deletable.
 * Keeps a soft cap of 12 user views so the UI doesn't sprawl.
 */
export function SavedViews<T>({
  storageKey, presets = [], currentState, onApply, label = 'Views'
}: Props<T>) {
  const [views, setViews]   = useState<SavedView<T>[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName]     = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setViews(JSON.parse(raw) as SavedView<T>[]);
    } catch { /* ignore */ }
  }, [storageKey]);

  useEffect(() => {
    if (adding) setTimeout(() => inputRef.current?.focus(), 0);
  }, [adding]);

  const persist = (next: SavedView<T>[]) => {
    setViews(next);
    try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    persist([...views.slice(0, 11), { id, name: trimmed, state: currentState }]);
    setName('');
    setAdding(false);
    setActiveId(id);
  };

  const remove = (id: string) => {
    persist(views.filter(v => v.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const apply = (v: SavedView<T>) => {
    setActiveId(v.id);
    onApply(v.state);
  };

  const all = [...presets, ...views];
  if (all.length === 0 && !adding) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted">{label}</span>
        <button onClick={() => setAdding(true)} className="chip border border-dashed border-line text-muted hover:text-brand hover:border-brand">
          <Icon.plus width={10} height={10} /> Save current
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs flex-wrap">
      <span className="text-muted uppercase tracking-wide font-semibold">{label}</span>
      {presets.map(v => (
        <button
          key={v.id}
          onClick={() => apply(v)}
          aria-pressed={activeId === v.id}
          className={`chip border transition ${activeId === v.id ? 'bg-brand text-white border-brand' : 'border-line text-muted hover:text-ink'}`}
        >
          <Icon.spark width={10} height={10} /> {v.name}
        </button>
      ))}
      {views.map(v => (
        <span key={v.id} className={`chip border transition pr-1 ${activeId === v.id ? 'bg-brand text-white border-brand' : 'border-line text-muted hover:text-ink'}`}>
          <button onClick={() => apply(v)} className="flex items-center gap-1.5">
            <Icon.list width={10} height={10} /> {v.name}
          </button>
          <button
            onClick={() => remove(v.id)}
            aria-label={`Remove view ${v.name}`}
            className="ml-1.5 h-4 w-4 grid place-items-center rounded-full hover:bg-current/10 opacity-60 hover:opacity-100"
          >
            <Icon.close width={9} height={9} />
          </button>
        </span>
      ))}
      {adding ? (
        <span className="inline-flex items-center gap-1.5">
          <input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')  save();
              if (e.key === 'Escape') { setAdding(false); setName(''); }
            }}
            placeholder="View name"
            className="rounded-full border border-line bg-bg px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50 w-32"
            maxLength={28}
          />
          <button onClick={save} className="chip bg-brand text-white">Save</button>
          <button onClick={() => { setAdding(false); setName(''); }} className="text-muted hover:text-ink">
            <Icon.close width={11} height={11} />
          </button>
        </span>
      ) : (
        <button onClick={() => setAdding(true)} className="chip border border-dashed border-line text-muted hover:text-brand hover:border-brand">
          <Icon.plus width={10} height={10} /> Save current
        </button>
      )}
    </div>
  );
}
