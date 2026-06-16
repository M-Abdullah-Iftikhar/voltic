'use client';
import { useEffect, useRef } from 'react';

/**
 * Confetti burst. Pure canvas, no deps. Mount with a unique `trigger`
 * value — every change of `trigger` plays a fresh burst from the
 * supplied (or centred) origin.
 *
 *   const [burst, setBurst] = useState(0);
 *   <Confetti trigger={burst} />
 *   <button onClick={() => setBurst(b => b + 1)}>Celebrate</button>
 */
interface ConfettiProps {
  trigger: number;
  origin?: { x: number; y: number };   // viewport pixels; defaults to centre-top
  /** Alternative to `origin` — read the element's bounding-rect at burst time. */
  originRef?: React.RefObject<HTMLElement | null>;
  count?: number;
  durationMs?: number;
}

type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  rotation: number; rotSpeed: number;
  size: number; color: string; shape: 'rect' | 'circle';
  life: number;
};

const COLORS = [
  'rgb(var(--brand))', 'rgb(var(--brand2))', 'rgb(var(--accent))',
  'rgb(var(--success))', 'rgb(var(--warn))'
];

export function Confetti({ trigger, origin, originRef, count = 130, durationMs = 2200 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (trigger === 0) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    ctx.scale(dpr, dpr);

    // Resolve burst origin: explicit > element ref > viewport top-centre.
    let ox = origin?.x ?? innerWidth / 2;
    let oy = origin?.y ?? innerHeight * 0.35;
    if (!origin && originRef?.current) {
      const r = originRef.current.getBoundingClientRect();
      ox = r.left + r.width / 2;
      oy = r.top  + r.height / 2;
    }

    const parts: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
      const speed = 6 + Math.random() * 9;
      parts.push({
        x: ox, y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.35,
        size: 5 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        life: 1
      });
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / durationMs;
      if (t >= 1) {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        return;
      }
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of parts) {
        p.vy += 0.28;          // gravity
        p.vx *= 0.992;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.life = 1 - t;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [trigger, origin, originRef, count, durationMs]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none z-[9998]"
    />
  );
}
