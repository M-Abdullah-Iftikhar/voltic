'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { haptic } from '@/lib/haptics';

interface Prize {
  label: string;
  code: string;
  /** Probability weight; heavier = more likely. */
  weight: number;
}

const PRIZES: Prize[] = [
  { label: '10% off',  code: 'WHEEL10',  weight: 5 },
  { label: 'Free shipping', code: 'FREESHIP', weight: 5 },
  { label: '$5 off',   code: '5OFF',     weight: 4 },
  { label: '15% off',  code: 'WELCOME15',weight: 3 },
  { label: 'VIP entry',code: 'VIP',      weight: 1 }
];

const REVEAL_THRESHOLD = 0.55;   // 55% scratched away → auto-reveal

/**
 * Canvas-backed scratch card. The top layer is a metallic gradient that
 * the user drags away with touch/mouse; underneath sits the prize text
 * plus a copy chip. Once the cleared area passes REVEAL_THRESHOLD we
 * fade the overlay out entirely.
 *
 * Reduced-motion users get a static "today's reward" panel — no
 * scratching motion required.
 */
export function ScratchCard({ onReveal }: { onReveal?: (prize: Prize) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scratchingRef = useRef(false);
  const [prize] = useState<Prize>(() => pickWeighted());
  const [revealed, setRevealed] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Paint the metallic top once the canvas mounts.
  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width  = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.scale(dpr, dpr);

    // Brushed-foil gradient.
    const g = ctx.createLinearGradient(0, 0, cssW, cssH);
    g.addColorStop(0,  '#a3a8b4');
    g.addColorStop(0.5,'#cdd2dd');
    g.addColorStop(1,  '#7a8194');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cssW, cssH);

    // "Scratch here ⚡" hint overlay.
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '600 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Scratch to reveal ⚡', cssW / 2, cssH / 2);
  }, [reduced]);

  const scratchAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Eraser brush — `destination-out` carves a transparent hole.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();

    // Sample a downscaled snapshot once every ~5 strokes to measure
    // cleared area without burning CPU on each pointermove.
    if (Math.random() < 0.2 && !revealed) checkReveal(ctx, canvas);
  };

  const checkReveal = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const sampleStep = 18;          // px between samples (post-scale)
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;
    let cleared = 0;
    let total   = 0;
    for (let y = 0; y < h; y += sampleStep * dpr) {
      for (let x = 0; x < w; x += sampleStep * dpr) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        if (pixel[3] < 16) cleared++;
        total++;
      }
    }
    if (cleared / total >= REVEAL_THRESHOLD) {
      setRevealed(true);
      haptic('success');
      onReveal?.(prize);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    scratchingRef.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    scratchAt(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!scratchingRef.current) return;
    scratchAt(e.clientX, e.clientY);
  };
  const onPointerUp = () => { scratchingRef.current = false; };

  if (reduced) {
    return (
      <div className="card p-6 text-center">
        <div className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">Today's scratch</div>
        <div className="font-display font-bold text-2xl mt-2 gradient-text">{prize.label}</div>
        <div className="mt-3 font-mono text-sm text-brand bg-brand/10 rounded-xl px-3 py-2 inline-block">
          {prize.code}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-xs mx-auto select-none">
      <div className="relative aspect-[5/3] rounded-2xl overflow-hidden border border-line bg-surface">
        {/* Prize layer */}
        <div className="absolute inset-0 grid place-items-center text-center px-4 bg-mesh">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">You won</div>
            <div className="font-display font-bold text-2xl mt-1 gradient-text">{prize.label}</div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand/10 border border-brand/30 px-3 py-1 text-xs">
              <span className="font-mono font-bold text-brand">{prize.code}</span>
              <button
                onClick={() => navigator.clipboard?.writeText(prize.code)}
                className="text-[10px] text-muted hover:text-brand"
                aria-label="Copy code"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Scratch layer — fades out once revealed */}
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          aria-label="Scratch card — drag to reveal"
          className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${revealed ? 'opacity-0 pointer-events-none' : 'opacity-100 cursor-grab active:cursor-grabbing'}`}
          style={{ touchAction: 'none' }}
        />
      </div>

      {!revealed && (
        <p className="text-[11px] text-muted mt-3 text-center">
          <Icon.spark width={10} height={10} className="inline-block text-brand align-middle mr-1" />
          Drag your finger or cursor across the foil to reveal the code.
        </p>
      )}
    </div>
  );
}

function pickWeighted(): Prize {
  const total = PRIZES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of PRIZES) {
    r -= p.weight;
    if (r <= 0) return p;
  }
  return PRIZES[0];
}
