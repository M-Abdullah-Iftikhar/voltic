/**
 * Tiny inline sparkline. Pure SVG, no deps. Accepts an array of points
 * and renders a gradient area + line, scaled to the container.
 */
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  color?: string;          // CSS color or var() — defaults to brand
  showLastDot?: boolean;
}

export function Sparkline({
  data, width = 96, height = 28,
  className = '', color = 'rgb(var(--brand))', showLastDot = true
}: SparklineProps) {
  if (!data.length) {
    return <div className={`${className}`} style={{ width, height }} aria-hidden />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const pad = 2;
  const innerH = height - pad * 2;

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = pad + innerH - ((v - min) / range) * innerH;
    return [x, y] as const;
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
  const last = points[points.length - 1];
  const gradId = `spark-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {showLastDot && (
        <circle cx={last[0]} cy={last[1]} r="2.5" fill="rgb(var(--surface))" stroke={color} strokeWidth="1.4" />
      )}
    </svg>
  );
}

/** Compact "+12.4%" trend pill showing period-over-period change. */
export function TrendBadge({ current, previous, suffix }: { current: number; previous: number; suffix?: string }) {
  if (previous === 0 && current === 0) {
    return <span className="chip bg-elev text-muted">No change</span>;
  }
  if (previous === 0) {
    return <span className="chip bg-success/15 text-success">New</span>;
  }
  const delta = ((current - previous) / Math.abs(previous)) * 100;
  const positive = delta >= 0;
  const sign = positive ? '↑' : '↓';
  const style = positive ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger';
  return (
    <span className={`chip ${style}`}>
      {sign} {Math.abs(delta).toFixed(1)}%{suffix ? ` ${suffix}` : ''}
    </span>
  );
}
