'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { haptic } from '@/lib/haptics';

interface Bolt {
  id: number;
  x: number;       // 0..100 (percent of board width)
  y: number;       // 0..100 (percent of board height)
  vy: number;      // falling speed
  caught: boolean;
}

/**
 * "Catch the bolts" mini-game shown while the order is being placed.
 * Lightweight: state lives in one RAF loop, board is a flex container,
 * bolts are absolute-positioned spans. Auto-stops when the parent flips
 * out of the loading state — caller controls visibility.
 *
 * Honours prefers-reduced-motion (renders a static loader) and pauses on
 * blur so the tab doesn't keep spawning bolts in the background.
 */
export function BoltCatcherGame({ active }: { active: boolean }) {
  const [bolts, setBolts] = useState<Bolt[]>([]);
  const [score, setScore] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [hint, setHint] = useState(true);
  const boardRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<number | null>(null);
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextId = useRef(1);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Game loop — gravity + sweep.
  useEffect(() => {
    if (!active || reduced) return;

    const loop = () => {
      setBolts(prev => prev
        .map(b => b.caught ? b : ({ ...b, y: b.y + b.vy }))
        .filter(b => !b.caught && b.y < 110));
      tickRef.current = requestAnimationFrame(loop);
    };
    tickRef.current = requestAnimationFrame(loop);

    spawnTimer.current = setInterval(() => {
      // Don't pile up forever — cap at 6 on screen.
      setBolts(prev => prev.length >= 6 ? prev : [
        ...prev,
        {
          id: nextId.current++,
          x: 10 + Math.random() * 80,
          y: -10 - Math.random() * 10,
          vy: 0.7 + Math.random() * 0.6,
          caught: false
        }
      ]);
    }, 900);

    return () => {
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
      if (spawnTimer.current) clearInterval(spawnTimer.current);
    };
  }, [active, reduced]);

  // Pause everything when the tab loses focus (saves battery on long order writes).
  useEffect(() => {
    const onHide = () => {
      if (tickRef.current) { cancelAnimationFrame(tickRef.current); tickRef.current = null; }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  const catchBolt = (id: number) => {
    setHint(false);
    setBolts(prev => prev.map(b => b.id === id ? { ...b, caught: true } : b));
    setScore(s => s + 1);
    haptic('tap');
  };

  if (reduced) {
    return (
      <div className="grid place-items-center py-12">
        <div className="grid place-items-center h-12 w-12 rounded-full text-white animate-pulseRing"
             style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}>
          <Icon.bolt width={22} height={22} />
        </div>
        <p className="text-sm text-muted mt-4">Placing your order…</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">While you wait</div>
          <div className="font-display font-bold text-base text-ink">Catch the bolts ⚡</div>
        </div>
        <div className="rounded-full bg-brand/10 text-brand font-mono font-bold text-sm px-3 py-1.5">
          {score}
        </div>
      </div>

      <div
        ref={boardRef}
        className="relative w-full aspect-[5/3] rounded-2xl overflow-hidden border border-line bg-mesh"
        aria-label="Bolt catcher game board"
      >
        {hint && bolts.length === 0 && (
          <p className="absolute inset-0 grid place-items-center text-xs text-muted">
            Tap each bolt as it falls.
          </p>
        )}
        {bolts.map(b => (
          <button
            key={b.id}
            type="button"
            onClick={() => catchBolt(b.id)}
            aria-label="Catch bolt"
            className={`absolute h-9 w-9 rounded-full grid place-items-center text-white transition-transform ${b.caught ? 'scale-150 opacity-0' : ''}`}
            style={{
              left: `${b.x}%`,
              top:  `${b.y}%`,
              transform: 'translate(-50%, -50%)',
              background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--accent2)))',
              boxShadow: '0 6px 16px -4px rgb(var(--brand) / 0.65)',
              transitionDuration: b.caught ? '320ms' : '0s',
              touchAction: 'manipulation'
            }}
          >
            <Icon.bolt width={14} height={14} />
          </button>
        ))}
      </div>

      <p className="text-[11px] text-muted mt-3 italic">
        Don't worry — your order is being placed in the background.
      </p>
    </div>
  );
}
