'use client';
import { useMemo, useRef, useState } from 'react';

type Point = { date: string; total: number };

interface Props {
  data: Point[];
  /** Optional named annotations rendered at fixed dates (e.g. campaign markers). */
  annotations?: { date: string; label: string }[];
  /**
   * Optional comparison series of the same length as `data`. When supplied,
   * the chart renders a dashed grey line for the previous period and the
   * tooltip surfaces a delta vs. the current period.
   */
  comparison?: Point[];
  /** Friendly labels for the two periods (e.g. "This week" / "Last week"). */
  compareLabels?: { current: string; previous: string };
}

/**
 * Hover-aware revenue chart. Tracks the cursor, snaps to the nearest
 * data point, and surfaces a tooltip with the day's total. Peak day and
 * lowest day get permanent badges so the chart tells a story even before
 * you hover. SSR-safe — points are deterministic from props.
 *
 * When `comparison` is passed, an overlaid dashed line shows the previous
 * period's curve and the tooltip surfaces the period-over-period delta.
 */
export function RevenueChart({
  data, annotations = [], comparison, compareLabels = { current: 'Current', previous: 'Previous' }
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  const { peakIdx, lowIdx, min, max } = useMemo(() => {
    if (data.length === 0) return { peakIdx: -1, lowIdx: -1, min: 0, max: 0 };
    let peak = 0, low = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i].total > data[peak].total) peak = i;
      if (data[i].total < data[low].total)  low  = i;
    }
    // Compare series can lift the max — scale both lines against the same axis.
    const compMax = (showCompare && comparison)
      ? comparison.reduce((m, p) => Math.max(m, p.total), 0)
      : 0;
    return {
      peakIdx: peak,
      lowIdx: low,
      min: data[low].total,
      max: Math.max(data[peak].total, compMax)
    };
  }, [data, comparison, showCompare]);

  if (data.length === 0) {
    return <div className="text-sm text-muted py-12 text-center">No orders yet.</div>;
  }

  const W = 600, H = 200, pad = 24;
  const sx = (i: number) => pad + (i * (W - pad * 2)) / Math.max(1, data.length - 1);
  const sy = (v: number) => H - pad - ((v) / Math.max(max, 1)) * (H - pad * 2);
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${sy(d.total)}`).join(' ');
  const area = `${path} L ${sx(data.length - 1)} ${H - pad} L ${sx(0)} ${H - pad} Z`;

  // Build the comparison path against the same axis.
  const compPath = (showCompare && comparison && comparison.length > 0)
    ? comparison.map((d, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${sy(d.total)}`).join(' ')
    : null;

  const onMove = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const xInView = pad + xRatio * (W - pad * 2);
    // Find nearest index by x coordinate.
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < data.length; i++) {
      const d = Math.abs(sx(i) - xInView);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    setHoverIdx(best);
  };

  // Annotations rendered as small vertical lines + labels at given dates.
  const annPoints = annotations
    .map(a => ({ ann: a, idx: data.findIndex(d => d.date === a.date) }))
    .filter(({ idx }) => idx >= 0);

  const hovered = hoverIdx != null ? data[hoverIdx] : null;
  // Tooltip position — keep it clamped so it doesn't overflow the card.
  const tooltipX = hovered ? Math.min(W - 110, Math.max(0, sx(hoverIdx!) - 55)) : 0;
  const tooltipY = hovered ? Math.max(8, sy(hovered.total) - 56) : 0;

  return (
    <div className="mt-5 relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-48 overflow-visible cursor-crosshair"
        onPointerMove={onMove}
        onPointerLeave={() => setHoverIdx(null)}
        role="img"
        aria-label="Revenue trend chart"
      >
        <defs>
          <linearGradient id="rev-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"  stopColor="rgb(var(--brand))"  stopOpacity="0.55" />
            <stop offset="100%" stopColor="rgb(var(--brand))" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="rev-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgb(var(--brand))" />
            <stop offset="100%" stopColor="rgb(var(--brand2))" />
          </linearGradient>
        </defs>

        {/* horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line key={t} x1={pad} x2={W - pad} y1={H - pad - t * (H - pad * 2)} y2={H - pad - t * (H - pad * 2)}
                stroke="rgb(var(--line))" strokeDasharray="3 3" opacity="0.6" />
        ))}

        {/* campaign markers */}
        {annPoints.map(({ ann, idx }) => (
          <g key={ann.date}>
            <line x1={sx(idx)} x2={sx(idx)} y1={pad} y2={H - pad}
                  stroke="rgb(var(--accent2))" strokeWidth="1" strokeDasharray="2 4" opacity="0.7" />
            <text x={sx(idx)} y={pad - 6} textAnchor="middle" fontSize="9" fill="rgb(var(--accent2))" fontWeight="600">
              {ann.label}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#rev-area)" />

        {/* Comparison line — rendered under the current path so the brand
            colour stays dominant. Dashed neutral so it reads as context. */}
        {compPath && (
          <path
            d={compPath}
            fill="none"
            stroke="rgb(var(--muted))"
            strokeWidth="2"
            strokeDasharray="4 5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
        )}

        <path d={path} fill="none" stroke="url(#rev-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* hover crosshair */}
        {hoverIdx != null && (
          <g>
            <line x1={sx(hoverIdx)} x2={sx(hoverIdx)} y1={pad} y2={H - pad}
                  stroke="rgb(var(--brand))" strokeWidth="1" opacity="0.4" />
            <circle cx={sx(hoverIdx)} cy={sy(data[hoverIdx].total)} r="6"
                    fill="rgb(var(--brand))" stroke="rgb(var(--surface))" strokeWidth="2" />
          </g>
        )}

        {/* permanent data points */}
        {data.map((d, i) => {
          const isPeak = i === peakIdx && data.length > 1 && d.total > 0;
          const isLow  = i === lowIdx  && data.length > 1 && peakIdx !== lowIdx;
          return (
            <g key={d.date}>
              <circle
                cx={sx(i)}
                cy={sy(d.total)}
                r={isPeak ? 5 : 4}
                fill="rgb(var(--surface))"
                stroke={isPeak ? 'rgb(var(--success))' : isLow ? 'rgb(var(--warn))' : 'rgb(var(--brand))'}
                strokeWidth="2"
              />
              <text x={sx(i)} y={H - 4} textAnchor="middle" fontSize="10" fill="rgb(var(--muted))">{d.date.slice(5)}</text>
              {isPeak && (
                <g transform={`translate(${sx(i)} ${sy(d.total) - 14})`}>
                  <rect x="-22" y="-12" width="44" height="14" rx="7" fill="rgb(var(--success))" />
                  <text x="0" y="-2" textAnchor="middle" fontSize="9" fill="white" fontWeight="700">PEAK</text>
                </g>
              )}
              {isLow && (
                <g transform={`translate(${sx(i)} ${sy(d.total) + 18})`}>
                  <rect x="-18" y="-10" width="36" height="14" rx="7" fill="rgb(var(--warn))" />
                  <text x="0" y="0" textAnchor="middle" fontSize="9" fill="white" fontWeight="700">LOW</text>
                </g>
              )}
            </g>
          );
        })}

        {/* tooltip */}
        {hovered && (
          <g transform={`translate(${tooltipX} ${tooltipY - (showCompare && comparison ? 14 : 0)})`} pointerEvents="none">
            <rect width="138" height={showCompare && comparison ? 58 : 42} rx="8" fill="rgb(var(--surface))" stroke="rgb(var(--line))" />
            <text x="10" y="16" fontSize="10" fill="rgb(var(--muted))">{hovered.date}</text>
            <text x="10" y="34" fontSize="14" fill="rgb(var(--ink))" fontWeight="700">
              ${hovered.total.toFixed(0)}
            </text>
            {showCompare && comparison?.[hoverIdx!] && (
              <>
                <text x="10" y="48" fontSize="10" fill="rgb(var(--muted))">
                  {compareLabels.previous}: ${comparison[hoverIdx!].total.toFixed(0)}
                </text>
                {(() => {
                  const prev = comparison[hoverIdx!].total;
                  const delta = hovered.total - prev;
                  const pct = prev > 0 ? (delta / prev) * 100 : 0;
                  const tone = delta >= 0 ? 'rgb(var(--success))' : 'rgb(var(--danger))';
                  return (
                    <text x="128" y="48" fontSize="10" fill={tone} fontWeight="700" textAnchor="end">
                      {delta >= 0 ? '+' : ''}{pct.toFixed(0)}%
                    </text>
                  );
                })()}
              </>
            )}
          </g>
        )}
      </svg>

      <div className="flex items-center justify-between gap-3 text-xs text-muted mt-2 px-2 flex-wrap">
        <div className="flex items-center gap-4">
          <span><span className="inline-block h-1.5 w-1.5 rounded-full bg-warn align-middle mr-1" /> Min ${min.toFixed(0)}</span>
          <span><span className="inline-block h-1.5 w-1.5 rounded-full bg-success align-middle mr-1" /> Max ${max.toFixed(0)}</span>
        </div>
        {comparison && comparison.length > 0 && (
          <button
            type="button"
            onClick={() => setShowCompare(s => !s)}
            aria-pressed={showCompare}
            className={`chip border transition ${showCompare ? 'bg-brand/10 border-brand text-brand' : 'border-line text-muted hover:text-ink'}`}
          >
            <span className={`inline-block h-1 w-3 rounded-full ${showCompare ? 'bg-muted' : 'bg-line'}`} style={{ borderTop: '1px dashed currentColor' }} />
            Compare vs {compareLabels.previous.toLowerCase()}
          </button>
        )}
      </div>
    </div>
  );
}
