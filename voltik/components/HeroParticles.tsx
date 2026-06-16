'use client';
import { useMemo } from 'react';

/**
 * Pure-CSS particle field — 18 drifting dots that fade and float
 * independently. Renders nothing under prefers-reduced-motion so the
 * hero stays calm for users who asked us to slow down.
 *
 * Each dot's animation params are seeded once at mount so they don't
 * resync on every render.
 */
export function HeroParticles({ count = 18, className = '' }: { count?: number; className?: string }) {
  // Deterministic-feeling but client-only seed: PRNG keyed by index so
  // hydration is consistent across re-renders.
  const dots = useMemo(() => Array.from({ length: count }, (_, i) => {
    const seed = (i + 1) * 9301 + 49297;
    const rand = (n: number) => ((seed * (n + 1)) % 233280) / 233280;
    return {
      left:     rand(1) * 100,
      top:      rand(2) * 100,
      size:     2 + Math.floor(rand(3) * 5),         // 2-6px
      driftX:   (rand(4) - 0.5) * 60,                 // -30..+30px
      driftY:   -40 - rand(5) * 80,                  // upward, 40-120px
      duration: 10 + rand(6) * 14,                   // 10-24s
      delay:    -rand(7) * 14,                        // negative so they start staggered
      opacity:  0.18 + rand(8) * 0.35
    };
  }), [count]);

  return (
    <div
      aria-hidden
      className={`absolute inset-0 pointer-events-none overflow-hidden motion-reduce:hidden ${className}`}
    >
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-brand"
          style={{
            left: `${d.left}%`,
            top:  `${d.top}%`,
            width:  `${d.size}px`,
            height: `${d.size}px`,
            opacity: d.opacity,
            animation: `particleDrift ${d.duration}s ease-in-out ${d.delay}s infinite`,
            // CSS vars consumed by the keyframe — let each dot have its own drift.
            ['--dx' as string]: `${d.driftX}px`,
            ['--dy' as string]: `${d.driftY}px`
          }}
        />
      ))}
      <style jsx>{`
        @keyframes particleDrift {
          0%   { transform: translate(0, 0)            scale(0.6); opacity: 0; }
          15%  {                                         opacity: 0.55; }
          85%  { transform: translate(var(--dx), var(--dy)) scale(1);   opacity: 0.55; }
          100% { transform: translate(var(--dx), var(--dy)) scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
