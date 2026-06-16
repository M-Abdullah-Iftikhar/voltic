'use client';
import { useMemo, useState } from 'react';
import { Icon } from './Icons';
import type { Order } from '@/lib/types';

/**
 * GitHub-style 12-week order heat-map. Each column is a week, each row a
 * day of the week. Cell colour intensity follows the count of non-cancelled
 * orders that day. Hover a cell to see the exact date + numbers.
 */
export function OrderHeatmap({ orders, weeks = 12 }: { orders: Order[]; weeks?: number }) {
  const grid = useMemo(() => buildGrid(orders, weeks), [orders, weeks]);
  const [hover, setHover] = useState<{ date: string; count: number; revenue: number } | null>(null);

  const maxCount = grid.maxCount;
  // 5 intensity buckets — 0 (empty), 1, 2, 3, 4.
  const intensity = (count: number) => {
    if (count === 0) return 0;
    if (maxCount <= 1) return 4;
    const pct = count / maxCount;
    if (pct > 0.75) return 4;
    if (pct > 0.5)  return 3;
    if (pct > 0.25) return 2;
    return 1;
  };

  const totals = grid.cells.reduce(
    (acc, d) => ({ orders: acc.orders + d.count, revenue: acc.revenue + d.revenue, days: acc.days + (d.count > 0 ? 1 : 0) }),
    { orders: 0, revenue: 0, days: 0 }
  );

  const dayLabels = ['Mon', 'Wed', 'Fri'];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <div>
          <h3 className="font-display font-bold text-lg">Orders heat-map</h3>
          <p className="text-xs text-muted mt-0.5">Last {weeks} weeks · click a day for details.</p>
        </div>
        <div className="text-xs text-muted flex items-center gap-3">
          <span><span className="text-ink font-semibold">{totals.orders}</span> orders</span>
          <span><span className="text-ink font-semibold">${totals.revenue.toFixed(0)}</span> revenue</span>
          <span><span className="text-ink font-semibold">{totals.days}</span>/{weeks * 7} active days</span>
        </div>
      </div>

      <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
        {/* Day labels column */}
        <div className="flex flex-col justify-between text-[10px] text-muted shrink-0 pt-3.5 pb-1 pr-1">
          {dayLabels.map(l => <span key={l}>{l}</span>)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Month labels row */}
          <div className="flex gap-1 mb-1 text-[10px] text-muted">
            {grid.monthMarkers.map((m, i) => (
              <span key={i} className="w-3" style={{ flex: '0 0 12px' }}>
                {m || ''}
              </span>
            ))}
          </div>

          <div role="grid" aria-label="Daily order activity" className="flex gap-1">
            {/* Each column = one week */}
            {Array.from({ length: weeks }, (_, w) => (
              <div key={w} className="flex flex-col gap-1">
                {Array.from({ length: 7 }, (_, d) => {
                  const cell = grid.cells[w * 7 + d];
                  if (!cell) return <span key={d} className="block h-3 w-3 rounded-sm bg-elev/40" />;
                  const bucket = intensity(cell.count);
                  const isHovered = hover?.date === cell.date;
                  return (
                    <button
                      key={d}
                      type="button"
                      onMouseEnter={() => setHover(cell)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(cell)}
                      onBlur={() => setHover(null)}
                      aria-label={`${cell.date}: ${cell.count} order${cell.count === 1 ? '' : 's'}`}
                      className={`block h-3 w-3 rounded-sm transition-transform hover:scale-[1.4] focus:scale-[1.4] focus:outline-none ${
                        BUCKET_BG[bucket]
                      } ${isHovered ? 'ring-1 ring-brand' : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend + hover detail */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map(b => (
            <span key={b} className={`block h-3 w-3 rounded-sm ${BUCKET_BG[b]}`} />
          ))}
          <span>More</span>
        </div>
        <div className="min-h-[18px] text-right">
          {hover ? (
            <span className="text-ink font-medium flex items-center gap-2 justify-end">
              <Icon.spark width={11} height={11} className="text-brand" />
              {hover.date} · {hover.count} order{hover.count === 1 ? '' : 's'}
              {hover.revenue > 0 && <> · <span className="gradient-text font-bold">${hover.revenue.toFixed(0)}</span></>}
            </span>
          ) : (
            <span className="italic">Hover a cell for details</span>
          )}
        </div>
      </div>
    </div>
  );
}

const BUCKET_BG: Record<number, string> = {
  0: 'bg-elev/60',
  1: 'bg-brand/30',
  2: 'bg-brand/55',
  3: 'bg-brand/80',
  4: 'bg-brand'
};

type Cell = { date: string; count: number; revenue: number };

function buildGrid(orders: Order[], weeks: number) {
  // Build a date-keyed bucket for the last `weeks * 7` days, ending today.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Snap "today" to its weekday and walk back to the Monday of the earliest week.
  // Use ISO weekday: 0..6 starting Monday.
  const isoWeekday = (today.getDay() + 6) % 7;        // Mon=0..Sun=6
  const startOffset = (weeks - 1) * 7 + isoWeekday;

  const cells: Cell[] = [];
  const monthMarkers: (string | null)[] = [];
  for (let w = 0; w < weeks; w++) {
    let marker: string | null = null;
    for (let d = 0; d < 7; d++) {
      const offset = startOffset - (w * 7 + d);
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const key = date.toISOString().slice(0, 10);
      cells.push({ date: key, count: 0, revenue: 0 });
      if (d === 0 && date.getDate() <= 7) {
        marker = date.toLocaleDateString(undefined, { month: 'short' });
      }
    }
    monthMarkers.push(marker);
  }

  // Index cells for O(1) lookup, then fold orders in.
  const byDate = new Map<string, Cell>();
  for (const c of cells) byDate.set(c.date, c);

  let maxCount = 0;
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const cell = byDate.get(o.date);
    if (!cell) continue;
    cell.count += 1;
    cell.revenue += o.total;
    if (cell.count > maxCount) maxCount = cell.count;
  }

  return { cells, monthMarkers, maxCount };
}
