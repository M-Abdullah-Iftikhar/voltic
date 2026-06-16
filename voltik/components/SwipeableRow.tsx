'use client';
import { useRef, useState } from 'react';
import { Icon, type IconKey } from './Icons';
import { haptic } from '@/lib/haptics';

interface Action {
  icon: IconKey;
  label: string;
  onClick: () => void;
  /** Tailwind classes for the action background — pair with the row's tone. */
  bg: string;
}

interface Props {
  children: React.ReactNode;
  /** Right-side reveal action — typically Delete. */
  primary: Action;
  /** Optional left-side reveal action — typically Save for later. */
  secondary?: Action;
  className?: string;
}

const REVEAL = 84;       // pixels of slide before the action exposes
const COMMIT = 140;      // past this on release we auto-fire the action

/**
 * Touch-only swipe wrapper. Left-swipe past `REVEAL` exposes the primary
 * action; right-swipe (if `secondary` is supplied) exposes the second.
 * Past `COMMIT` on touch-end the action auto-fires — feels native.
 *
 * Mouse / desktop users ignore the gesture; the existing on-card buttons
 * still work. No-op under prefers-reduced-motion.
 */
export function SwipeableRow({ children, primary, secondary, className = '' }: Props) {
  const [dx, setDx] = useState(0);
  const [active, setActive] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const horizontal = useRef<boolean | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    horizontal.current = null;
    setActive(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const x = e.touches[0].clientX - startX.current;
    const y = e.touches[0].clientY - startY.current;

    // Lock to the dominant axis on first move. Vertical wins → bail out.
    if (horizontal.current === null) {
      if (Math.abs(x) < 6 && Math.abs(y) < 6) return;
      horizontal.current = Math.abs(x) > Math.abs(y);
    }
    if (!horizontal.current) return;

    // Clamp left/right based on which side has an action.
    const min = primary   ? -REVEAL * 1.5 : 0;
    const max = secondary ?  REVEAL * 1.5 : 0;
    const clamped = Math.max(min, Math.min(max, x));
    setDx(clamped);
  };

  const onTouchEnd = () => {
    if (Math.abs(dx) >= COMMIT) {
      // Commit — fire the action and snap back. Haptic confirms the swipe
      // succeeded, mirroring native iOS row-actions.
      haptic(dx < 0 ? 'warning' : 'success');
      if (dx < 0 && primary)        primary.onClick();
      else if (dx > 0 && secondary) secondary.onClick();
    }
    setDx(0);
    setActive(false);
    horizontal.current = null;
  };

  // Reveal flags drive the icon scale + label opacity on the action backgrounds.
  const showPrimary   = dx < -REVEAL * 0.5;
  const showSecondary = dx >  REVEAL * 0.5;

  return (
    <div className={`relative ${className}`}>
      {/* Right action (Delete) — visible when swiping left. */}
      {primary && (
        <div
          aria-hidden={!showPrimary}
          className={`absolute inset-y-0 right-0 flex items-center justify-end pr-5 rounded-2xl ${primary.bg}`}
          style={{ width: Math.max(REVEAL, Math.abs(Math.min(dx, 0)) + 4) }}
        >
          <span className={`flex items-center gap-1.5 text-white transition-opacity ${showPrimary ? 'opacity-100' : 'opacity-50'}`}>
            <ActionIcon icon={primary.icon} />
            <span className={`text-xs font-semibold ${showPrimary ? 'inline' : 'hidden'}`}>{primary.label}</span>
          </span>
        </div>
      )}

      {/* Left action (Save) — visible when swiping right. */}
      {secondary && (
        <div
          aria-hidden={!showSecondary}
          className={`absolute inset-y-0 left-0 flex items-center justify-start pl-5 rounded-2xl ${secondary.bg}`}
          style={{ width: Math.max(REVEAL, Math.max(0, dx) + 4) }}
        >
          <span className={`flex items-center gap-1.5 text-white transition-opacity ${showSecondary ? 'opacity-100' : 'opacity-50'}`}>
            <ActionIcon icon={secondary.icon} />
            <span className={`text-xs font-semibold ${showSecondary ? 'inline' : 'hidden'}`}>{secondary.label}</span>
          </span>
        </div>
      )}

      {/* Foreground row — slides with the gesture. */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${dx}px)`,
          transition: active ? 'none' : 'transform 260ms cubic-bezier(.22,1.36,.36,1)',
          touchAction: 'pan-y'
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ActionIcon({ icon }: { icon: IconKey }) {
  const Glyph = Icon[icon];
  return (
    <span className="grid place-items-center h-7 w-7 rounded-full bg-white/15">
      <Glyph width={14} height={14} />
    </span>
  );
}
