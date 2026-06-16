'use client';
import { useEffect, useRef } from 'react';

interface Props {
  children: React.ReactNode;
  /** Max tilt in degrees on each axis. 6° feels luxurious, 12° feels arcade. */
  maxTilt?: number;
  /** CSS class applied to the wrapping div. */
  className?: string;
  /** Glare highlight that follows the cursor — adds the premium-card feel. */
  glare?: boolean;
}

/**
 * Mouse-tracking 3D tilt wrapper. Rotates the child along X/Y based on
 * cursor position; springs back smoothly on leave. Honours
 * prefers-reduced-motion (renders the child untouched) and disables the
 * effect on touch devices where there's no hover state to read.
 */
export function TiltCard({ children, maxTilt = 8, className = '', glare = true }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none)').matches;
    if (reduced || isTouch) return;

    const onMove = (e: PointerEvent) => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const rect = wrap.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;     // 0..1
        const y = (e.clientY - rect.top)  / rect.height;    // 0..1
        const rotY = (x - 0.5) *  maxTilt * 2;              // left-right
        const rotX = (0.5 - y) *  maxTilt * 2;              // up-down (inverted)
        inner.style.transform = `perspective(800px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
        if (glareRef.current) {
          glareRef.current.style.opacity = '0.55';
          glareRef.current.style.background =
            `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.7), transparent 45%)`;
        }
      });
    };

    const onLeave = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      inner.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)';
      if (glareRef.current) glareRef.current.style.opacity = '0';
    };

    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerleave', onLeave);
    return () => {
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerleave', onLeave);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [maxTilt]);

  return (
    <div ref={wrapRef} className={className} style={{ perspective: '800px' }}>
      <div
        ref={innerRef}
        className="relative transition-transform duration-200 ease-out will-change-transform"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
        {glare && (
          <span
            ref={glareRef}
            aria-hidden
            className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
            style={{ opacity: 0, mixBlendMode: 'overlay' }}
          />
        )}
      </div>
    </div>
  );
}
