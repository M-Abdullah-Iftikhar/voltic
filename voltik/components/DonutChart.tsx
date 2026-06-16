interface Slice {
  label: string;
  value: number;
  /** CSS color or rgb-var fragment. Falls back to a brand palette. */
  color?: string;
}

interface DonutChartProps {
  slices: Slice[];
  size?: number;
  /** thickness of the ring (0..1 of radius) */
  thickness?: number;
  /** Central headline / value (e.g. "247") */
  centerLabel?: string;
  /** Central sub-label (e.g. "orders") */
  centerSub?: string;
}

const FALLBACK = [
  'rgb(var(--brand))',
  'rgb(var(--brand2))',
  'rgb(var(--success))',
  'rgb(var(--warn))',
  'rgb(var(--danger))',
  'rgb(var(--accent))'
];

/** Pure-SVG donut chart with a legend. No dependencies. */
export function DonutChart({
  slices, size = 180, thickness = 0.22,
  centerLabel, centerSub
}: DonutChartProps) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;
  const innerR = r * (1 - thickness);

  if (total === 0) {
    return (
      <div className="text-sm text-muted text-center py-8" style={{ minHeight: size }}>
        No data yet.
      </div>
    );
  }

  let startAngle = -Math.PI / 2;   // 12 o'clock

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Donut chart">
          {slices.map((s, i) => {
            if (s.value === 0) return null;
            const sliceAngle = (s.value / total) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;
            const color = s.color || FALLBACK[i % FALLBACK.length];

            const path = describeRing(cx, cy, r, innerR, startAngle, endAngle);
            startAngle = endAngle;

            return (
              <path key={s.label} d={path} fill={color} stroke="rgb(var(--surface))" strokeWidth="2" />
            );
          })}
        </svg>
        {(centerLabel || centerSub) && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="text-center">
              {centerLabel && <div className="font-display font-bold text-2xl leading-none">{centerLabel}</div>}
              {centerSub   && <div className="text-[10px] uppercase tracking-wide text-muted mt-1">{centerSub}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <ul className="space-y-2 text-sm flex-1 min-w-[120px]">
        {slices.map((s, i) => {
          const pct = total ? Math.round((s.value / total) * 100) : 0;
          const color = s.color || FALLBACK[i % FALLBACK.length];
          return (
            <li key={s.label} className="flex items-center gap-2">
              <span aria-hidden className="inline-block h-3 w-3 rounded-sm" style={{ background: color }} />
              <span className="capitalize text-ink flex-1">{s.label}</span>
              <span className="text-muted tabular-nums text-xs">{s.value}</span>
              <span className="text-muted tabular-nums text-xs w-9 text-right">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Build an annular sector path (donut slice). All angles in radians,
 *  measured from the 12-o'clock position clockwise. */
function describeRing(
  cx: number, cy: number, rOuter: number, rInner: number,
  startAngle: number, endAngle: number
): string {
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  const xOuterStart = cx + rOuter * Math.cos(startAngle);
  const yOuterStart = cy + rOuter * Math.sin(startAngle);
  const xOuterEnd   = cx + rOuter * Math.cos(endAngle);
  const yOuterEnd   = cy + rOuter * Math.sin(endAngle);

  const xInnerStart = cx + rInner * Math.cos(endAngle);
  const yInnerStart = cy + rInner * Math.sin(endAngle);
  const xInnerEnd   = cx + rInner * Math.cos(startAngle);
  const yInnerEnd   = cy + rInner * Math.sin(startAngle);

  return [
    `M ${xOuterStart} ${yOuterStart}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${xOuterEnd} ${yOuterEnd}`,
    `L ${xInnerStart} ${yInnerStart}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${xInnerEnd} ${yInnerEnd}`,
    'Z'
  ].join(' ');
}
