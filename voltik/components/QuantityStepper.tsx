'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { haptic } from '@/lib/haptics';

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Quantity stepper with a direction-aware spring.
 *  - Tapping + plays an "up" overshoot on the readout; tapping − plays
 *    a "down" squish. The bump animation is keyed by the change tick so
 *    React replays it each press.
 *  - Hold the button to repeat (250ms initial, 80ms steady) — handy when
 *    moving from 1 to 12.
 *  - The pressed button gets a brand ring while the gesture is live, so
 *    keyboard and touch users both see the affordance.
 */
export function QuantityStepper({
  value, onChange, min = 1, max = 99, size = 'md', className = ''
}: QuantityStepperProps) {
  const [bumpKey, setBumpKey] = useState(0);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [pressed, setPressed] = useState<'inc' | 'dec' | null>(null);
  const lastValue = useRef(value);
  const skipFirst = useRef(true);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (skipFirst.current) { skipFirst.current = false; lastValue.current = value; return; }
    if (value !== lastValue.current) {
      setDirection(value > lastValue.current ? 'up' : 'down');
      setBumpKey(k => k + 1);
      lastValue.current = value;
    }
  }, [value]);

  const dec = () => {
    if (value <= min) return;
    haptic('tap');
    onChange(Math.max(min, value - 1));
  };
  const inc = () => {
    if (value >= max) return;
    haptic('tap');
    onChange(Math.min(max, value + 1));
  };

  /** Start the press: fire once, then repeat on a slowed loop. */
  const startHold = (which: 'inc' | 'dec') => {
    setPressed(which);
    const step = which === 'inc' ? inc : dec;
    step();
    holdTimer.current = setTimeout(function tick() {
      step();
      holdTimer.current = setTimeout(tick, 80);
    }, 250);
  };
  const endHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setPressed(null);
  };

  useEffect(() => () => { if (holdTimer.current) clearTimeout(holdTimer.current); }, []);

  const tone = size === 'sm' ? 'text-[11px]' : 'text-xs';
  const cell = size === 'sm' ? 'px-2 py-1' : 'px-2.5 py-1.5';
  const iconPx = size === 'sm' ? 11 : 12;

  return (
    <div className={`flex items-center rounded-full border border-line bg-surface overflow-hidden select-none ${className}`}>
      <button
        type="button"
        onPointerDown={() => startHold('dec')}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onPointerCancel={endHold}
        disabled={value <= min}
        aria-label="Decrease"
        className={`${cell} relative hover:bg-elev disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
          pressed === 'dec' ? 'ring-2 ring-brand/40 bg-brand/10 text-brand' : ''
        }`}
      >
        <Icon.minus width={iconPx} height={iconPx} />
      </button>
      <span
        key={bumpKey}
        className={`${tone} font-semibold min-w-[28px] text-center px-2 inline-block tabular-nums ${
          direction === 'up' ? 'voltik-bump-up' : 'voltik-bump-down'
        }`}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onPointerDown={() => startHold('inc')}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onPointerCancel={endHold}
        disabled={value >= max}
        aria-label="Increase"
        className={`${cell} relative hover:bg-elev disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
          pressed === 'inc' ? 'ring-2 ring-brand/40 bg-brand/10 text-brand' : ''
        }`}
      >
        <Icon.plus width={iconPx} height={iconPx} />
      </button>
    </div>
  );
}
