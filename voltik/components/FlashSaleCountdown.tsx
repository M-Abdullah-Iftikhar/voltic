'use client';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';

interface FlashSaleCountdownProps {
  /** Target Date or ISO string. If unset, ends at next midnight UTC. */
  endsAt?: Date | string;
  /** Extra Tailwind classes for the wrapping pill. */
  className?: string;
  /** Tone: light (chip on light card) or accent (white on gradient). */
  tone?: 'light' | 'accent';
  label?: string;
}

/**
 * Live countdown pill. Ticks every second on the client; renders nothing
 * on first paint so SSR + first client paint can't mismatch. Reaches 00:00
 * and stops without flipping negative.
 */
export function FlashSaleCountdown({
  endsAt, className = '', tone = 'light', label = 'Ends in'
}: FlashSaleCountdownProps) {
  const [target, setTarget] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const t = endsAt
      ? new Date(endsAt).getTime()
      : nextMidnightUTC();
    setTarget(t);
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (target == null || now == null) return null;
  const remaining = Math.max(0, target - now);

  const hours   = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  const ended = remaining === 0;

  const baseTone = tone === 'accent'
    ? 'bg-ink text-bg'
    : 'bg-danger/15 text-danger';

  return (
    <span
      role="timer"
      aria-live="polite"
      aria-label={ended ? 'Sale ended' : `${hours} hours ${minutes} minutes ${seconds} seconds remaining`}
      className={`inline-flex items-center gap-1.5 chip ${baseTone} ${className}`}
    >
      <Icon.refresh width={11} height={11} className={ended ? '' : 'animate-spin-slow'} />
      {ended ? 'Sale ended' : (
        <>
          {label}
          <span className="font-mono tabular-nums font-bold">{pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
        </>
      )}
    </span>
  );
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
function nextMidnightUTC(): number {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
}
