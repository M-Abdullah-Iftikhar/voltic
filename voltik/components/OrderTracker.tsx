import { Icon } from './Icons';
import type { OrderStatus } from '@/lib/types';

const STEPS: { key: OrderStatus; label: string; iconKey: keyof typeof Icon }[] = [
  { key: 'pending',    label: 'Placed',     iconKey: 'check' },
  { key: 'processing', label: 'Packing',    iconKey: 'box'   },
  { key: 'shipped',    label: 'Shipped',    iconKey: 'truck' },
  { key: 'delivered',  label: 'Delivered',  iconKey: 'check' }
];

/**
 * Visual delivery tracker. The truck slides along a curved route line
 * to the position matching the current order status; completed stops
 * fill in with the success colour. Pure SVG, no deps.
 */
export function OrderTracker({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="card p-6 flex items-center gap-3 text-danger">
        <Icon.close width={18} height={18} />
        <div>
          <div className="font-semibold">This order was cancelled</div>
          <div className="text-xs text-muted">If this was unexpected, contact support.</div>
        </div>
      </div>
    );
  }

  const stepIdx = Math.max(0, STEPS.findIndex(s => s.key === status));
  // Truck position: 0..1 mapped to 4 evenly-spaced stops.
  const progress = stepIdx / (STEPS.length - 1);

  // SVG canvas (viewBox units). Stops sit on a gentle bezier curve.
  const W = 600, H = 110;
  const stops = STEPS.map((_, i) => {
    const t = i / (STEPS.length - 1);
    const x = 50 + t * (W - 100);
    const y = 56 + Math.sin(t * Math.PI) * -8;     // very gentle arc
    return { x, y };
  });
  const truck = pointOnPolyline(stops, progress);
  const pathD = stops
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-base">Delivery progress</h3>
        <span className="chip bg-brand/10 text-brand capitalize">{status}</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32" aria-hidden>
        <defs>
          <linearGradient id="route-done" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%"  stopColor="rgb(var(--success))" />
            <stop offset="100%" stopColor="rgb(var(--brand))" />
          </linearGradient>
        </defs>

        {/* base route — dashed */}
        <path d={pathD} fill="none" stroke="rgb(var(--line))" strokeWidth="3" strokeDasharray="5 6" strokeLinecap="round" />

        {/* completed portion — filled overlay using a clip-path so it
            tracks the same path geometry as the dashed base */}
        <defs>
          <clipPath id="done-clip">
            <rect x="0" y="0" width={50 + progress * (W - 100)} height={H} />
          </clipPath>
        </defs>
        <path d={pathD} fill="none" stroke="url(#route-done)" strokeWidth="4" strokeLinecap="round" clipPath="url(#done-clip)" />

        {/* stops */}
        {stops.map((p, i) => {
          const done = i <= stepIdx;
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="11" fill={done ? 'rgb(var(--success))' : 'rgb(var(--surface))'} stroke={done ? 'rgb(var(--success))' : 'rgb(var(--line))'} strokeWidth="2.5" />
              {done && (
                <path
                  d={`M ${p.x - 4} ${p.y} l 3 3 l 5 -6`}
                  fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
              )}
              <text x={p.x} y={p.y + 30} textAnchor="middle" fontSize="11" fontWeight="600"
                fill={done ? 'rgb(var(--ink))' : 'rgb(var(--muted))'}>
                {STEPS[i].label}
              </text>
            </g>
          );
        })}

        {/* moving truck */}
        <g
          transform={`translate(${truck.x - 18}, ${truck.y - 36})`}
          style={{ transition: 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          {/* exhaust puff */}
          <circle cx="-2" cy="22" r="3" fill="rgb(var(--muted))" opacity="0.25" />
          <circle cx="-7" cy="20" r="2" fill="rgb(var(--muted))" opacity="0.18" />
          {/* truck body */}
          <rect x="0" y="6" width="22" height="16" rx="3" fill="rgb(var(--brand))" />
          <rect x="22" y="11" width="12" height="11" rx="2" fill="rgb(var(--brand2))" />
          <rect x="24" y="13" width="6" height="5" rx="1" fill="rgb(var(--surface))" opacity="0.85" />
          <circle cx="6" cy="24" r="3.5" fill="rgb(var(--ink))" />
          <circle cx="6" cy="24" r="1.5" fill="rgb(var(--surface))" />
          <circle cx="28" cy="24" r="3.5" fill="rgb(var(--ink))" />
          <circle cx="28" cy="24" r="1.5" fill="rgb(var(--surface))" />
          {/* bolt logo on side */}
          <path d="M 8 11 l -2 4 h 2 l -1 3 l 3 -4 h -2 l 1 -3 z" fill="white" />
        </g>
      </svg>
    </div>
  );
}

/** Walk a series of straight segments, return the point `t` fraction
 *  (0..1) of the way along the total polyline length. */
function pointOnPolyline(points: { x: number; y: number }[], t: number) {
  if (points.length === 0) return { x: 0, y: 0 };
  if (t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];

  const segs = [] as { from: { x: number; y: number }; to: { x: number; y: number }; len: number }[];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const len = Math.hypot(dx, dy);
    segs.push({ from: points[i], to: points[i + 1], len });
    total += len;
  }

  const target = total * t;
  let walked = 0;
  for (const s of segs) {
    if (walked + s.len >= target) {
      const localT = (target - walked) / s.len;
      return {
        x: s.from.x + (s.to.x - s.from.x) * localT,
        y: s.from.y + (s.to.y - s.from.y) * localT
      };
    }
    walked += s.len;
  }
  return points[points.length - 1];
}
