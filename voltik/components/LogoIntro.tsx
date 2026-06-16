'use client';
import { useEffect, useState } from 'react';

const SEEN_KEY = 'voltik:logo-intro-seen';

/**
 * One-shot brand intro played on the very first visit per browser.
 *  - A gradient lightning bolt swoops in (rotateY + scale), settles, then
 *    the wordmark fades up underneath.
 *  - Total runtime ~2.6s; auto-dismiss is built in. User can also click
 *    or press any key to skip.
 *  - Mounted from RootLayout so it covers every entry point but never on
 *    return visits, signed-in routes (we already have a session), or
 *    under prefers-reduced-motion.
 */
export function LogoIntro() {
  const [phase, setPhase] = useState<'hidden' | 'enter' | 'settle' | 'exit'>('hidden');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      if (window.sessionStorage.getItem(SEEN_KEY) === '1') return;
      if (window.localStorage.getItem(SEEN_KEY) === '1') return;
    } catch {}

    setPhase('enter');
    const t1 = setTimeout(() => setPhase('settle'), 900);
    const t2 = setTimeout(() => setPhase('exit'), 2100);
    const t3 = setTimeout(() => setPhase('hidden'), 2600);

    try {
      window.sessionStorage.setItem(SEEN_KEY, '1');
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {}

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Skip on click or any key.
  useEffect(() => {
    if (phase === 'hidden') return;
    const skip = () => setPhase('exit');
    document.addEventListener('keydown', skip, { once: true });
    return () => document.removeEventListener('keydown', skip);
  }, [phase]);

  if (phase === 'hidden') return null;

  // Phase-driven transforms — perspective on the parent gives the 3D feel.
  const isEnter  = phase === 'enter';
  const isSettle = phase === 'settle';
  const isExit   = phase === 'exit';

  return (
    <div
      onClick={() => setPhase('exit')}
      aria-hidden
      className={`fixed inset-0 z-[80] grid place-items-center cursor-pointer transition-opacity ${
        isExit ? 'opacity-0 duration-500' : 'opacity-100 duration-200'
      }`}
      style={{ background: 'rgb(var(--bg))', perspective: '900px' }}
    >
      <div className="flex flex-col items-center gap-5">
        <div
          className="relative h-28 w-28 sm:h-36 sm:w-36"
          style={{
            transformStyle: 'preserve-3d',
            transform:
              isEnter  ? 'rotateY(-180deg) scale(0.4) translateY(-20px)' :
              isSettle ? 'rotateY(0deg) scale(1) translateY(0)' :
                         'rotateY(20deg) scale(1.08) translateY(-12px)',
            transition: 'transform 900ms cubic-bezier(.22,1.36,.36,1)',
            filter: 'drop-shadow(0 24px 50px rgb(var(--brand) / 0.45))'
          }}
        >
          {/* Halo */}
          <span
            className={`absolute inset-0 rounded-full ${isSettle ? 'animate-pulseRing' : ''}`}
            style={{
              background: 'radial-gradient(circle, rgb(var(--brand) / 0.35), transparent 65%)',
              filter: 'blur(8px)'
            }}
          />
          <svg viewBox="0 0 100 100" className="relative h-full w-full">
            <defs>
              <linearGradient id="bolt-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"  stopColor="rgb(var(--brand))" />
                <stop offset="60%" stopColor="rgb(var(--brand2))" />
                <stop offset="100%" stopColor="rgb(var(--accent2))" />
              </linearGradient>
            </defs>
            <path
              d="M58 8 L22 56 H44 L36 92 L74 40 H52 L58 8 Z"
              fill="url(#bolt-grad)"
              stroke="rgb(var(--surface))"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>

          {/* Spark trails — drawn after the bolt so they sit on top. */}
          {isSettle && (
            <span aria-hidden className="absolute inset-0 pointer-events-none">
              {[0, 72, 144, 216, 288].map(a => (
                <span
                  key={a}
                  className="absolute left-1/2 top-1/2 h-0.5 w-7 origin-left bg-gradient-to-r from-brand to-transparent rounded-full animate-fadein"
                  style={{ transform: `rotate(${a}deg) translateX(20px)` }}
                />
              ))}
            </span>
          )}
        </div>

        <div
          className="font-display font-bold text-2xl sm:text-3xl gradient-text tracking-tight"
          style={{
            opacity: isEnter ? 0 : 1,
            transform: isEnter ? 'translateY(8px)' : 'translateY(0)',
            transition: 'opacity 500ms ease-out 350ms, transform 500ms ease-out 350ms'
          }}
        >
          Voltik
        </div>
      </div>
    </div>
  );
}
