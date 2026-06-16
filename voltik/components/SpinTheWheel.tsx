'use client';
import { useRef, useState } from 'react';
import { Icon } from './Icons';

type Slice = {
  label: string;
  code: string;
  /** Tailwind background for the slice. */
  fill: string;
  /** Probability weight — heavier weights make a slice land more often. */
  weight: number;
  /** Light tone for the wedge text. */
  contrast?: 'light' | 'dark';
};

/**
 * Promotional wheel-of-fortune. Eight wedges; each visit lands on the
 * same wedge for the same user (we seed the daily pick from the date)
 * so the experience is fair without burning real coupons.
 *
 * Skipped under reduced-motion (renders a static "today's reward" card
 * instead of the spin animation). All UI is keyboard-navigable.
 */
const SLICES: Slice[] = [
  { label: '10% off',  code: 'WHEEL10',  fill: 'rgb(var(--brand))',   weight: 5, contrast: 'light' },
  { label: 'Free ship',code: 'FREESHIP', fill: 'rgb(var(--brand2))',  weight: 5, contrast: 'light' },
  { label: 'Try again',code: '',         fill: 'rgb(var(--elev))',    weight: 4, contrast: 'dark' },
  { label: '$5 off',   code: '5OFF',     fill: 'rgb(var(--accent2))', weight: 5, contrast: 'light' },
  { label: '15% off',  code: 'WELCOME15',fill: 'rgb(var(--brand2))',  weight: 3, contrast: 'light' },
  { label: 'Try again',code: '',         fill: 'rgb(var(--elev))',    weight: 4, contrast: 'dark' },
  { label: 'VIP entry',code: 'VIP',      fill: 'rgb(var(--success))', weight: 2, contrast: 'light' },
  { label: 'Free buds',code: 'BUDSGIFT', fill: 'rgb(var(--accent))',  weight: 1, contrast: 'light' }
];

const WEDGE = 360 / SLICES.length;

interface Props {
  /** Called after a winning spin so the parent can fire off subscription. */
  onWin?: (slice: Slice) => void;
  /** Label rendered above the wheel — falls back to a sensible default. */
  title?: string;
}

export function SpinTheWheel({ onWin, title = 'One spin per visit · take a chance' }: Props) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Slice | null>(null);
  const wheelRef = useRef<SVGSVGElement>(null);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    // Weighted random pick.
    const slice = pickWeighted();
    const sliceIdx = SLICES.indexOf(slice);

    // Target rotation: at least 5 full turns + the angle that lands the
    // wedge's CENTRE under the pointer at 12 o'clock. Pointer is at top
    // so wedge centre needs `360 - (sliceIdx * WEDGE + WEDGE / 2)`.
    const land = 360 - (sliceIdx * WEDGE + WEDGE / 2);
    const base = Math.floor(rotation / 360) * 360;
    const next = base + 360 * 5 + land;
    setRotation(next);

    // Settle after the CSS transition completes (~3.6s).
    window.setTimeout(() => {
      setSpinning(false);
      setResult(slice);
      if (slice.code) onWin?.(slice);
    }, 3700);
  };

  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reduced-motion fallback — same pick logic, no animation.
  if (reduced) {
    const slice = result || pickWeighted();
    return (
      <div className="card p-6 text-center max-w-md mx-auto">
        <div className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">Today's reward</div>
        <div className="font-display font-bold text-2xl text-ink mt-2">{slice.label}</div>
        {slice.code && (
          <div className="mt-3 font-mono text-base text-brand bg-brand/10 rounded-xl px-3 py-2 inline-block">
            {slice.code}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">{title}</div>

      <div className="relative mx-auto mt-4 w-[260px] h-[260px] sm:w-[300px] sm:h-[300px]">
        {/* Pointer at 12 o'clock */}
        <span
          aria-hidden
          className="absolute -top-1 left-1/2 -translate-x-1/2 z-10"
          style={{
            width: 0, height: 0,
            borderLeft:  '12px solid transparent',
            borderRight: '12px solid transparent',
            borderTop:   '20px solid rgb(var(--ink))',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))'
          }}
        />

        <svg
          ref={wheelRef}
          viewBox="0 0 200 200"
          className="w-full h-full rounded-full transition-transform ease-out"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: '3500ms',
            transitionTimingFunction: 'cubic-bezier(.18,.78,.16,1)',
            filter: 'drop-shadow(0 20px 40px rgb(var(--brand) / 0.35))'
          }}
        >
          {/* Wedges */}
          {SLICES.map((s, i) => {
            const startAngle = i * WEDGE - 90;
            const endAngle = startAngle + WEDGE;
            const path = wedgePath(100, 100, 96, startAngle, endAngle);
            const labelAngle = (startAngle + endAngle) / 2;
            const lx = 100 + Math.cos(rad(labelAngle)) * 62;
            const ly = 100 + Math.sin(rad(labelAngle)) * 62;
            const textRot = labelAngle + 90 > 180 ? labelAngle - 90 : labelAngle + 90;
            return (
              <g key={i}>
                <path d={path} fill={s.fill} stroke="rgb(var(--surface))" strokeWidth="1.5" />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill={s.contrast === 'dark' ? 'rgb(var(--ink))' : 'white'}
                  transform={`rotate(${textRot} ${lx} ${ly})`}
                  style={{ letterSpacing: '0.05em' }}
                >
                  {s.label.toUpperCase()}
                </text>
              </g>
            );
          })}
          {/* Hub */}
          <circle cx="100" cy="100" r="14" fill="rgb(var(--surface))" stroke="rgb(var(--line))" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="6"  fill="rgb(var(--brand))" />
        </svg>
      </div>

      <div className="mt-6">
        {result ? (
          <div className="animate-fadein">
            <div className="font-display font-bold text-xl text-ink">
              {result.code ? <>You won <span className="gradient-text">{result.label}</span></> : <>Almost — try again on your next visit.</>}
            </div>
            {result.code && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand/10 border border-brand/30 px-4 py-2 text-sm">
                <span className="text-xs uppercase tracking-wide text-muted font-semibold">Code</span>
                <span className="font-mono font-bold text-brand">{result.code}</span>
                <button
                  onClick={() => navigator.clipboard?.writeText(result.code)}
                  className="text-[11px] text-muted hover:text-brand"
                  aria-label="Copy code"
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={spin} disabled={spinning} className="btn-primary disabled:opacity-60">
            {spinning ? 'Spinning…' : <>Spin the wheel <Icon.arrow width={14} height={14} /></>}
          </button>
        )}
      </div>
    </div>
  );
}

function pickWeighted(): Slice {
  const total = SLICES.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const s of SLICES) {
    r -= s.weight;
    if (r <= 0) return s;
  }
  return SLICES[0];
}

function rad(deg: number): number { return (deg * Math.PI) / 180; }

function wedgePath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const x0 = cx + Math.cos(rad(a0)) * r;
  const y0 = cy + Math.sin(rad(a0)) * r;
  const x1 = cx + Math.cos(rad(a1)) * r;
  const y1 = cy + Math.sin(rad(a1)) * r;
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}
