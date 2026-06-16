'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './Icons';
import { haptic } from '@/lib/haptics';

const TRIGGER = 72;   // pixels of pull before the refresh fires
const MAX = 120;      // visual cap on the indicator drag distance

/**
 * Touch-only pull-to-refresh. Listens at the window level; when the user
 * pulls down past TRIGGER while the document is already at scrollTop=0,
 * we fire a router.refresh() and reset.
 *
 * The indicator renders only while the gesture is active. On non-touch
 * devices (no `(hover:none)`) we don't even attach listeners.
 *
 * Mount it once near the top of a route — it'll cover the whole route.
 */
export function PullToRefresh() {
  const router = useRouter();
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
    if (!isTouch) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const onStart = (e: TouchEvent) => {
      // Only engage when we're actually at the top of the document.
      if (window.scrollY > 2) { startY.current = null; return; }
      startY.current = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) { setPull(0); return; }
      // Rubber-band so the bar always feels resistant past trigger.
      const eased = Math.min(MAX, dy * 0.6);
      setPull(eased);
    };
    const onEnd = async () => {
      if (startY.current == null) return;
      const traveled = pull;
      startY.current = null;
      if (traveled >= TRIGGER && !refreshing) {
        haptic('success');
        setRefreshing(true);
        // Snap the indicator to TRIGGER while the refresh fires.
        setPull(TRIGGER);
        // router.refresh() is sync from our side; give a brief settle so
        // the indicator doesn't flicker for one-frame routes.
        router.refresh();
        setTimeout(() => {
          setRefreshing(false);
          setPull(0);
        }, 700);
      } else {
        setPull(0);
      }
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove',  onMove,  { passive: true });
    document.addEventListener('touchend',   onEnd);
    document.addEventListener('touchcancel', onEnd);
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove',  onMove);
      document.removeEventListener('touchend',   onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [pull, refreshing, router]);

  if (pull === 0 && !refreshing) return null;

  const progress = Math.min(1, pull / TRIGGER);
  const armed = pull >= TRIGGER;

  return (
    <div
      aria-hidden={!refreshing}
      role="status"
      className="fixed inset-x-0 top-0 z-[55] flex justify-center pointer-events-none"
      style={{ transform: `translateY(${pull - 16}px)`, transition: refreshing ? 'transform 200ms ease-out' : undefined }}
    >
      <div
        className="rounded-full bg-surface border border-line shadow-soft px-3 py-2 flex items-center gap-2 text-xs"
        style={{ opacity: progress }}
      >
        <span
          className={`grid place-items-center h-5 w-5 rounded-full text-brand ${refreshing ? 'animate-spin' : ''}`}
          style={{ transform: refreshing ? undefined : `rotate(${progress * 180}deg)` }}
        >
          <Icon.refresh width={12} height={12} />
        </span>
        <span className="text-ink font-semibold">
          {refreshing ? 'Refreshing…' : armed ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>
    </div>
  );
}
