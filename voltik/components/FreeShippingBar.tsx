'use client';
import { Icon } from './Icons';

const FREE_THRESHOLD = 50;

/** Progress towards the free-shipping threshold. Variants:
 *  - `inline`  — full width, used inside cart / drawer
 *  - `compact` — slim line, used in narrow contexts */
export function FreeShippingBar({
  subtotal,
  variant = 'inline'
}: { subtotal: number; variant?: 'inline' | 'compact' }) {
  const pct = Math.min(100, Math.max(0, (subtotal / FREE_THRESHOLD) * 100));
  const remaining = Math.max(0, FREE_THRESHOLD - subtotal);
  const unlocked = remaining === 0 && subtotal > 0;

  const message = unlocked
    ? '🎉 Free shipping unlocked!'
    : subtotal === 0
      ? `Add $${FREE_THRESHOLD.toFixed(2)} of products for free shipping`
      : `Add $${remaining.toFixed(2)} more for free shipping`;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Icon.truck width={14} height={14} className={unlocked ? 'text-success' : 'text-brand'} />
        <span className={`flex-1 truncate ${unlocked ? 'text-success font-semibold' : 'text-muted'}`}>{message}</span>
      </div>
    );
  }

  return (
    <div className="card p-3.5">
      <div className="flex items-center gap-2 text-xs mb-2">
        <Icon.truck width={14} height={14} className={unlocked ? 'text-success' : 'text-brand'} />
        <span className={`flex-1 font-semibold ${unlocked ? 'text-success' : 'text-ink'}`}>{message}</span>
        {!unlocked && <span className="text-muted">${subtotal.toFixed(2)} / ${FREE_THRESHOLD}</span>}
      </div>
      <div className="h-2 rounded-full bg-elev overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: unlocked
              ? 'linear-gradient(90deg, rgb(var(--success)), rgb(var(--brand)))'
              : 'linear-gradient(90deg, rgb(var(--brand)), rgb(var(--brand2)))'
          }}
        />
      </div>
    </div>
  );
}
