'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icons';

export interface WidgetSlot {
  /** Stable id used for ordering persistence. */
  id: string;
  /** Display label rendered in the drag handle. */
  label: string;
  /** The widget content. */
  content: React.ReactNode;
}

type Density = 'compact' | 'comfortable';

const ORDER_KEY   = 'voltik:dashboard-order';
const DENSITY_KEY = 'voltik:dashboard-density';

/**
 * Reorderable, density-aware wrapper for the admin dashboard widgets.
 *
 *   - HTML5 drag-and-drop reorders the list; order persists in localStorage
 *     so a returning admin sees their layout immediately.
 *   - A compact / comfortable toggle scales padding, font-size and gaps
 *     for data-dense days vs scrollable-tour days.
 *
 * Children supply slots; the layout owns the order + density state and
 * exposes a small toolbar above the grid.
 */
export function DashboardLayout({ slots }: { slots: WidgetSlot[] }) {
  const slotMap = useMemo(() => new Map(slots.map(s => [s.id, s])), [slots]);
  const defaultOrder = slots.map(s => s.id);
  const [order, setOrder]     = useState<string[]>(defaultOrder);
  const [density, setDensity] = useState<Density>('comfortable');
  const [dragId, setDragId]   = useState<string | null>(null);
  const [overId, setOverId]   = useState<string | null>(null);
  const dragNode = useRef<HTMLElement | null>(null);

  // Restore persisted order + density on mount. If a stored id is no longer
  // present (a widget was renamed/removed), keep the default order intact.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ORDER_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as string[];
        const filtered = stored.filter(id => slotMap.has(id));
        const missing  = defaultOrder.filter(id => !filtered.includes(id));
        if (filtered.length > 0) setOrder([...filtered, ...missing]);
      }
      const d = window.localStorage.getItem(DENSITY_KEY) as Density | null;
      if (d === 'compact' || d === 'comfortable') setDensity(d);
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(ORDER_KEY, JSON.stringify(order)); } catch {}
  }, [order]);
  useEffect(() => {
    try { window.localStorage.setItem(DENSITY_KEY, density); } catch {}
  }, [density]);

  const onDragStart = (id: string) => (e: React.DragEvent) => {
    setDragId(id);
    dragNode.current = e.currentTarget as HTMLElement;
    e.dataTransfer.effectAllowed = 'move';
    // Ghost image — use the card itself so the drop site is obvious.
    if (dragNode.current) e.dataTransfer.setDragImage(dragNode.current, 20, 20);
  };
  const onDragOver = (id: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragId && id !== overId) setOverId(id);
  };
  const onDrop = (id: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragId || dragId === id) return;
    setOrder(prev => {
      const next = prev.filter(x => x !== dragId);
      const idx = next.indexOf(id);
      next.splice(idx < 0 ? next.length : idx, 0, dragId);
      return next;
    });
    setDragId(null);
    setOverId(null);
  };
  const onDragEnd = () => { setDragId(null); setOverId(null); };

  const reset = () => setOrder(defaultOrder);

  const pad = density === 'compact' ? 'gap-3' : 'gap-5';

  return (
    <div className={density === 'compact' ? 'voltik-dense' : 'voltik-roomy'}>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="text-[11px] text-muted">
          <Icon.spark width={11} height={11} className="inline-block text-brand align-middle mr-1.5" />
          Drag any widget by its handle to rearrange. Layout saves automatically.
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="text-[11px] text-muted hover:text-ink underline-offset-2 hover:underline"
          >
            Reset order
          </button>
          <div role="radiogroup" aria-label="Layout density" className="inline-flex items-center gap-0.5 rounded-full border border-line bg-bg/60 p-0.5">
            <button
              role="radio"
              aria-checked={density === 'compact'}
              onClick={() => setDensity('compact')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
                density === 'compact' ? 'bg-surface shadow-soft text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              Compact
            </button>
            <button
              role="radio"
              aria-checked={density === 'comfortable'}
              onClick={() => setDensity('comfortable')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
                density === 'comfortable' ? 'bg-surface shadow-soft text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              Roomy
            </button>
          </div>
        </div>
      </div>

      <div className={`flex flex-col ${pad}`}>
        {order.map(id => {
          const slot = slotMap.get(id);
          if (!slot) return null;
          const isDragging = dragId === id;
          const isOver     = overId === id && dragId !== id;
          return (
            <div
              key={id}
              draggable
              onDragStart={onDragStart(id)}
              onDragOver={onDragOver(id)}
              onDrop={onDrop(id)}
              onDragEnd={onDragEnd}
              className={`relative group transition ${isDragging ? 'opacity-50' : ''} ${isOver ? 'ring-2 ring-brand rounded-3xl' : ''}`}
            >
              {/* Drag handle pill — only revealed on hover/focus so it doesn't
                  clutter the day-to-day dashboard view. */}
              <div className="absolute -top-2.5 left-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition pointer-events-none">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] uppercase tracking-wide font-semibold text-muted shadow-soft">
                  <Icon.arrow width={9} height={9} className="rotate-90" />
                  {slot.label}
                </span>
              </div>
              {slot.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
