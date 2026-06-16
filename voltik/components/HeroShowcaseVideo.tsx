'use client';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';

/**
 * 15-second "showcase video" stand-in that layers behind the hero copy.
 * Real footage drops in by replacing the gradient layers with a `<video
 * autoPlay muted loop playsInline>` element pulling from a CDN — the
 * surrounding overlay + controls survive the swap.
 *
 * We can't ship raw .mp4 in this repo, so the layer is generated
 * entirely in CSS: three drifting gradient blobs + a subtle scanline
 * sweep. The motion is paused by default for users with
 * `prefers-reduced-motion`; the corner mute / play button surfaces the
 * play-state so the choice stays visible.
 */
export function HeroShowcaseVideo() {
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    if (mq.matches) setPlaying(false);
    const onChange = () => {
      setReduced(mq.matches);
      if (mq.matches) setPlaying(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const state = playing ? 'running' : 'paused';

  return (
    <>
      {/* The "footage" — three drifting hue-rotating layers + a scanline */}
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -inset-10"
          style={{
            background:
              'radial-gradient(40% 50% at 30% 20%, rgb(var(--brand) / 0.45), transparent 60%),' +
              'radial-gradient(50% 60% at 80% 30%, rgb(var(--brand2) / 0.35), transparent 60%),' +
              'radial-gradient(60% 70% at 50% 90%, rgb(var(--accent2) / 0.35), transparent 60%)',
            animation: 'productVideoBg 15s ease-in-out infinite alternate',
            animationPlayState: state
          }}
        />
        <div
          className="absolute -inset-10"
          style={{
            background:
              'radial-gradient(30% 40% at 70% 50%, rgb(var(--accent) / 0.35), transparent 65%),' +
              'radial-gradient(35% 45% at 20% 70%, rgb(var(--brand) / 0.3), transparent 65%)',
            mixBlendMode: 'plus-lighter',
            animation: 'productVideoPan 15s ease-in-out infinite alternate',
            animationPlayState: state,
            animationDelay: '-4s'
          }}
        />
        {/* Scanline sweep — the "broadcast" tell */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: 'repeating-linear-gradient(180deg, transparent 0 2px, rgb(255 255 255 / .03) 2px 3px)'
          }}
        />
        {/* Subtle vignette */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(80% 60% at 50% 30%, transparent, rgb(0 0 0 / 0.55))' }}
        />
      </div>

      {/* Corner pill so the user knows it's playing + has a kill switch */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <span className="chip bg-bg/70 backdrop-blur text-ink !text-[10px] tabular-nums">
          <span className={`h-1.5 w-1.5 rounded-full ${playing ? 'bg-danger animate-pulse' : 'bg-muted'}`} />
          {playing ? 'Live · 00:15' : reduced ? 'Reduced motion' : 'Paused'}
        </span>
        <button
          type="button"
          onClick={() => setPlaying(p => !p)}
          aria-label={playing ? 'Pause showcase' : 'Play showcase'}
          className="grid place-items-center h-8 w-8 rounded-full bg-bg/70 backdrop-blur text-ink hover:bg-bg"
        >
          {playing
            ? <Icon.minus width={12} height={12} />
            : <span className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-current ml-0.5" />}
        </button>
      </div>
    </>
  );
}
