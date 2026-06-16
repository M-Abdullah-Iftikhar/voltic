'use client';
import { useEffect, useRef } from 'react';

/**
 * Wraps a child and overlays a soft circular "spotlight" gradient that
 * follows the cursor while hovering. Pure CSS via a tracked radial-
 * gradient — no canvas, no perf cost. Disabled on touch / reduced-motion.
 */
export function SpotlightCursor({
  children,
  size = 320,
  color = 'rgb(var(--brand) / 0.20)',
  className = ''
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const glow = glowRef.current;
    if (!wrap || !glow) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none)').matches;
    if (reduced || isTouch) return;

    let frame: number | null = null;
    const onMove = (e: PointerEvent) => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = wrap.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        glow.style.background = `radial-gradient(${size}px circle at ${x}px ${y}px, ${color}, transparent 60%)`;
        glow.style.opacity = '1';
      });
    };
    const onLeave = () => {
      if (frame) cancelAnimationFrame(frame);
      glow.style.opacity = '0';
    };

    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerleave', onLeave);
    return () => {
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [size, color]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {children}
      <div
        ref={glowRef}
        aria-hidden
        className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-200"
        style={{ opacity: 0, mixBlendMode: 'plus-lighter' }}
      />
    </div>
  );
}
