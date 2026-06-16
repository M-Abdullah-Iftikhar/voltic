'use client';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

export type RotatingAdTransition = 'fade' | 'slide' | 'cube' | 'stack' | 'flip';

interface Props<T> {
  /** Items to rotate. Each becomes a slide via `renderSlide`. */
  items: T[];
  /** Stable key for diffing — passed to React's `key`. */
  keyOf: (item: T, index: number) => string;
  /** Slide renderer. */
  renderSlide: (item: T, isActive: boolean, index: number) => React.ReactNode;
  /** Transition style. `cube` and `flip` need 3D-capable containers. */
  transition?: RotatingAdTransition;
  /** Milliseconds between rotations. Defaults to 5200. */
  intervalMs?: number;
  /** Optional aspect ratio for the slot, e.g. `16 / 9`. */
  aspectRatio?: number;
  /** Extra Tailwind classes for the wrapping container. */
  className?: string;
  /** Show indicator dots beneath the rotator. Defaults to true. */
  dots?: boolean;
  /** Aria label for the carousel region. */
  label?: string;
  /**
   * Liquid background: animated SVG blob that morphs between two paths
   * tinted by the per-slide gradient. Disabled by default — pass a
   * gradient lookup to enable.
   */
  liquidBackground?: (item: T, index: number) => { from: string; to: string };
  /**
   * Per-pixel parallax depth for the slide content. Renders an inner
   * "drift" layer that translates slightly faster than the background
   * as the user scrolls past. Default 0 (disabled).
   */
  parallax?: number;
  /** Render a "Sound" toggle that fires a soft whoosh on each slide change. */
  sound?: boolean;
}

/**
 * Generic auto-rotating ad slot. Five built-in transition styles — `fade`,
 * `slide`, `cube`, `stack`, `flip` — each defined as a small piece of CSS
 * the slide stack applies. Pauses on hover, on touch interaction, and
 * when the slot is offscreen. Reduced-motion users get a static first slide.
 *
 * Swipe / arrow keys / arrow buttons drive navigation; the same controls
 * also pause auto-rotation for a beat so the user can settle.
 */
export function RotatingAd<T>({
  items, keyOf, renderSlide,
  transition = 'fade', intervalMs = 5200, aspectRatio,
  className = '', dots = true, label = 'Featured ads',
  liquidBackground, parallax = 0, sound = false
}: Props<T>) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [parallaxY, setParallaxY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchX = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const uid = useId();
  const morphFromId = `liquid-from-${uid.replace(/[^a-z0-9]/gi, '')}`;
  const morphToId   = `liquid-to-${uid.replace(/[^a-z0-9]/gi, '')}`;

  const next = useCallback(() => setIdx(i => (i + 1) % items.length), [items.length]);
  const prev = useCallback(() => setIdx(i => (i - 1 + items.length) % items.length), [items.length]);

  // Auto-rotate.
  useEffect(() => {
    if (paused || items.length <= 1) return;
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const t = setInterval(next, intervalMs);
    return () => clearInterval(t);
  }, [paused, items.length, intervalMs, next]);

  // Pause when offscreen.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setPaused(p => !entry.isIntersecting ? true : p && false), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Parallax: track the container's scroll position relative to viewport
  // and feed it to the drift layer. RAF-throttled so we don't burn CPU.
  useEffect(() => {
    if (!parallax) return;
    const el = containerRef.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let frame: number | null = null;
    const onScroll = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // Map -vh..vh to a parallax range; negative = scrolled past top.
        const ratio = (rect.top + rect.height / 2 - vh / 2) / vh;
        setParallaxY(Math.max(-1, Math.min(1, ratio)) * parallax);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [parallax]);

  // Slide-change whoosh. Two-note Web Audio chime; gated behind a user
  // toggle since auto-playing audio is hostile. AudioContext is lazy so
  // the rotator stays inert on browsers that block audio (Safari quirks).
  const playWhoosh = useCallback(() => {
    if (!soundOn) return;
    if (typeof window === 'undefined') return;
    try {
      if (!audioCtxRef.current) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        audioCtxRef.current = new AC();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const t = ctx.currentTime;
      // Brief swept sine — falls from 880 Hz to 440 Hz over ~180ms.
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.18);
      gain.gain.setValueAtTime(0.00001, t);
      gain.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.00001, t + 0.22);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.26);
    } catch { /* swallow */ }
  }, [soundOn]);

  // Fire the whoosh whenever the slide index moves.
  const prevIdxRef = useRef(idx);
  useEffect(() => {
    if (prevIdxRef.current !== idx) {
      playWhoosh();
      prevIdxRef.current = idx;
    }
  }, [idx, playWhoosh]);

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) dx > 0 ? prev() : next();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
  };

  if (items.length === 0) return null;

  const needs3D = transition === 'cube' || transition === 'flip';

  const tone = liquidBackground ? liquidBackground(items[idx], idx) : null;

  return (
    <div className={className}>
      <div
        ref={containerRef}
        tabIndex={0}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onKeyDown={onKeyDown}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        className="relative overflow-hidden rounded-3xl focus:outline-none"
        style={{
          aspectRatio: aspectRatio ? String(aspectRatio) : undefined,
          perspective: needs3D ? '1200px' : undefined
        }}
      >
        {/* Liquid morphing background — two SVG blob paths interpolate via
            the smil-style attribute morph, tinted by the active slide. */}
        {tone && (
          <svg
            aria-hidden
            viewBox="0 0 600 400"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full opacity-90 transition-opacity duration-700"
          >
            <defs>
              <linearGradient id={morphFromId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"   stopColor={tone.from} />
                <stop offset="100%" stopColor={tone.to} />
              </linearGradient>
            </defs>
            <path
              fill={`url(#${morphFromId})`}
              // Key on idx so React rebuilds the SMIL animation each slide,
              // morphing from the previous blob to the new one over ~900ms.
              key={idx}
            >
              <animate
                attributeName="d"
                dur="900ms"
                fill="freeze"
                values={`${BLOBS[(idx + BLOBS.length - 1) % BLOBS.length]};${BLOBS[idx % BLOBS.length]}`}
              />
            </path>
          </svg>
        )}

        {/* Optional sound toggle — sits in the corner, opt-in. */}
        {sound && items.length > 1 && (
          <button
            type="button"
            onClick={() => setSoundOn(s => !s)}
            aria-pressed={soundOn}
            aria-label={soundOn ? 'Mute slide whoosh' : 'Unmute slide whoosh'}
            className="absolute top-3 right-3 z-20 h-8 w-8 grid place-items-center rounded-full bg-bg/60 backdrop-blur-sm border border-line text-ink hover:bg-bg/80 transition"
          >
            {soundOn ? <SoundOnIcon /> : <SoundOffIcon />}
          </button>
        )}

        <div
          className="relative h-full w-full"
          style={{
            transformStyle: needs3D ? 'preserve-3d' : undefined,
            // Parallax: the inner stack rides on top, drifting faster
            // than the background by the configured pixel amount.
            transform: parallax ? `translateY(${-parallaxY}px)` : undefined,
            transition: parallax ? 'transform 120ms ease-out' : undefined
          }}
        >
          {items.map((item, i) => {
            const isActive = i === idx;
            const offset = i - idx;
            return (
              <div
                key={keyOf(item, i)}
                aria-hidden={!isActive}
                className="absolute inset-0"
                style={styleFor(transition, isActive, offset, items.length)}
              >
                {renderSlide(item, isActive, i)}
              </div>
            );
          })}
        </div>
      </div>

      {dots && items.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Show ad ${i + 1}`}
              aria-current={i === idx ? 'true' : undefined}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? 'w-7 bg-brand' : 'w-1.5 bg-line hover:bg-muted'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Per-transition slide style. Distance/depth values are tuned so the
 * resulting motion reads consistently across the five presets at any
 * container size. All transitions land on the same final state when
 * `isActive` is true — only the path into and out of view differs.
 */
/**
 * Tiny library of blob paths that the liquid background interpolates
 * between. Each path is normalised to the same viewBox so the SMIL
 * `<animate>` can morph attribute-d cleanly between any two entries.
 * Crafted to feel like a "drop", "cloud", "wave", "leaf", and "lens" so
 * the shape personality changes with each slide.
 */
const BLOBS = [
  'M40,90 C80,40 200,30 320,80 C460,140 540,60 580,180 C610,290 460,360 320,330 C160,300 60,360 30,260 C10,180 20,140 40,90 Z',
  'M70,140 C110,40 280,40 380,100 C480,160 560,140 580,240 C600,340 420,360 280,320 C160,290 30,330 30,240 C30,180 50,180 70,140 Z',
  'M30,180 C90,80 210,80 300,140 C400,200 540,100 580,210 C610,310 460,360 320,340 C180,320 60,340 30,280 C10,240 10,210 30,180 Z',
  'M60,100 C140,40 260,60 360,120 C460,180 560,160 570,260 C580,360 420,360 290,320 C160,290 70,360 40,260 C20,200 30,160 60,100 Z',
  'M50,170 C120,60 260,50 360,110 C460,170 580,140 580,240 C580,340 440,360 300,320 C160,290 60,340 30,260 C10,210 30,210 50,170 Z'
];

function SoundOnIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 L6 9 H3 v6 h3 l5 4 z" />
      <path d="M15.5 8.5a4 4 0 0 1 0 7" />
      <path d="M18.5 5.5a8 8 0 0 1 0 13" />
    </svg>
  );
}
function SoundOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 L6 9 H3 v6 h3 l5 4 z" />
      <line x1="22" y1="9"  x2="16" y2="15" />
      <line x1="16" y1="9"  x2="22" y2="15" />
    </svg>
  );
}

function styleFor(
  kind: RotatingAdTransition,
  isActive: boolean,
  offset: number,
  total: number
): React.CSSProperties {
  // Choose the shortest signed offset so wrap-around transitions feel right.
  const wrappedOffset = offset > total / 2 ? offset - total : offset < -total / 2 ? offset + total : offset;
  const base: React.CSSProperties = {
    transition: 'transform 700ms cubic-bezier(.22,.78,.16,1), opacity 600ms ease-out',
    willChange: 'transform, opacity',
    pointerEvents: isActive ? 'auto' : 'none'
  };

  switch (kind) {
    case 'fade':
      return { ...base, opacity: isActive ? 1 : 0 };
    case 'slide':
      return {
        ...base,
        opacity: isActive ? 1 : 0,
        transform: isActive ? 'translateX(0)' : `translateX(${wrappedOffset > 0 ? 100 : -100}%)`
      };
    case 'cube':
      return {
        ...base,
        opacity: Math.abs(wrappedOffset) <= 1 ? 1 : 0,
        transformOrigin: 'center center',
        transform: isActive
          ? 'rotateY(0) translateZ(0)'
          : `rotateY(${wrappedOffset > 0 ? -90 : 90}deg) translateZ(0)`
      };
    case 'stack':
      return {
        ...base,
        opacity: isActive ? 1 : Math.abs(wrappedOffset) === 1 ? 0.5 : 0,
        transform: isActive
          ? 'translateY(0) scale(1)'
          : `translateY(${wrappedOffset > 0 ? 18 : -18}px) scale(${1 - Math.min(Math.abs(wrappedOffset) * 0.04, 0.12)})`,
        zIndex: isActive ? 30 : 30 - Math.abs(wrappedOffset)
      };
    case 'flip':
      return {
        ...base,
        opacity: Math.abs(wrappedOffset) <= 1 ? 1 : 0,
        transformOrigin: 'center center',
        transform: isActive
          ? 'rotateX(0)'
          : `rotateX(${wrappedOffset > 0 ? -90 : 90}deg)`,
        backfaceVisibility: 'hidden'
      };
  }
}
