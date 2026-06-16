'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import { SpecHoverHalo } from './SpecHoverHalo';
import type { EnrichedProduct } from '@/lib/types';

type Tab = 'angle' | 'spin' | 'video';

interface Angle {
  /** Label that goes under the thumbnail and in the click-to-zoom modal. */
  label: string;
  /** Tailwind transform applied to the illustration — fakes a camera angle. */
  transform: string;
  /** Background tint so the angle reads as a different shot, not just a rotation. */
  bg: string;
}

const ANGLES: Angle[] = [
  { label: 'Front',  transform: 'rotate(0deg) scale(1)',                        bg: 'from-bg to-elev' },
  { label: 'Detail', transform: 'rotate(0deg) scale(1.35) translate(0px, 8px)', bg: 'from-elev to-bg' },
  { label: 'Tilt',   transform: 'perspective(800px) rotateY(18deg) rotateX(6deg) scale(0.9)', bg: 'from-brand/10 to-bg' },
  { label: 'Back',   transform: 'perspective(800px) rotateY(-30deg) scale(0.85)',             bg: 'from-bg to-brand2/10' }
];

const SPIN_FRAMES = 24;

/**
 * Composite product gallery. One component covers four discrete design
 * tasks because they share the same canvas:
 *
 *   • Multi-image gallery — four "angles" derived by transforming the
 *     existing illustration; each gets its own thumbnail.
 *   • Click-to-zoom — clicking the hero opens a fullscreen modal with
 *     a smooth scale-in.
 *   • Pan + zoom on hover — sweeping the cursor over the hero shifts
 *     transform-origin and bumps the scale to 2× for an Amazon-style
 *     magnifier.
 *   • 360° spin view — a tab that scrubs through 24 rotateY frames as
 *     the user drags horizontally.
 *
 * Real product photos will slot in by replacing `<ProductIllustration>`
 * with `<Image>` and feeding `angles` from the catalogue; the
 * surrounding zoom + spin behaviour stays the same.
 */
export function ProductGallery({ product }: { product: EnrichedProduct }) {
  const [tab, setTab] = useState<Tab>('angle');
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState({ x: 50, y: 50, on: false });
  const [modalOpen, setModalOpen] = useState(false);
  const [spin, setSpin] = useState(0);
  const spinDragRef = useRef<{ x: number; start: number } | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);
  // Touch / coarse-pointer devices skip the hover-zoom — on a phone a
  // tap that drags before release would briefly magnify, then open the
  // modal on release. Cleaner to just route taps straight to the modal.
  const [coarsePointer, setCoarsePointer] = useState(false);

  // Respect reduced-motion — kill the auto-tilt and hover-zoom for
  // users who asked for stillness. Click-to-zoom still works.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);

    const coarse = window.matchMedia('(pointer: coarse)');
    setCoarsePointer(coarse.matches);
    const onCoarse = () => setCoarsePointer(coarse.matches);
    coarse.addEventListener('change', onCoarse);

    return () => {
      mq.removeEventListener('change', onChange);
      coarse.removeEventListener('change', onCoarse);
    };
  }, []);

  // Close the zoom modal on Escape.
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Skip the hover-magnifier on touch devices and reduced-motion.
    // Mobile users get the click-to-zoom modal instead.
    if (reduced || coarsePointer) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width)  * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    setZoom({ x, y, on: true });
  };

  // 360° spin: drag horizontally, each ~8px equals one frame so a
  // half-screen swipe gets you about three-quarters around.
  const startSpin = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    spinDragRef.current = { x: e.clientX, start: spin };
  };
  const moveSpin = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!spinDragRef.current) return;
    const dx = e.clientX - spinDragRef.current.x;
    const frames = Math.round(dx / 8);
    setSpin(((spinDragRef.current.start + frames) % SPIN_FRAMES + SPIN_FRAMES) % SPIN_FRAMES);
  };
  const endSpin = () => { spinDragRef.current = null; };

  const angle = ANGLES[active];

  return (
    <div>
      {/* Tab strip */}
      <div className="inline-flex items-center rounded-full border border-line bg-surface p-0.5 mb-3 text-xs">
        {([
          { id: 'angle', label: 'Angles' },
          { id: 'spin',  label: '360° spin' },
          { id: 'video', label: 'Video' }
        ] as { id: Tab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`px-3 py-1.5 rounded-full transition ${tab === t.id ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Hero canvas */}
      {tab === 'angle' && (
        <>
          <div
            ref={heroRef}
            onPointerMove={onPointerMove}
            onPointerLeave={() => setZoom(z => ({ ...z, on: false }))}
            onClick={() => setModalOpen(true)}
            role="button"
            aria-label="Open zoom view"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setModalOpen(true); } }}
            className={`relative group rounded-3xl bg-gradient-to-br ${angle.bg} aspect-square cursor-zoom-in overflow-hidden`}
            style={{ transition: 'background 400ms ease' }}
          >
            <div
              aria-hidden
              className="absolute inset-0 grid place-items-center"
              style={{
                transform: zoom.on && !reduced ? `scale(2)` : angle.transform,
                transformOrigin: `${zoom.x}% ${zoom.y}%`,
                transition: zoom.on ? 'transform 60ms ease-out' : 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <ProductIllustration category={product.category} icon={product.icon} className="h-full w-full" size={260} />
            </div>
            <SpecHoverHalo features={product.features || []} />

            {/* Magnifier badge — appears on hover so users know zoom is
                live. Hidden on touch since the magnifier itself is
                disabled there; touch users get a "tap to zoom" hint
                anchored to the same spot. */}
            <div className={`absolute top-3 right-3 chip bg-bg/80 backdrop-blur text-ink !text-[10px] transition-opacity ${coarsePointer ? 'opacity-70' : zoom.on && !reduced ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`}>
              <Icon.search width={10} height={10} />
              <span className="hidden sm:inline">{coarsePointer ? 'Tap to zoom' : '2× magnifier · click for full'}</span>
              <span className="sm:hidden">{coarsePointer ? 'Tap' : '2×'}</span>
            </div>
          </div>

          {/* Thumbnail strip */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {ANGLES.map((a, i) => (
              <button
                key={a.label}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                aria-pressed={i === active}
                aria-label={`Angle ${a.label}`}
                className={`relative rounded-xl border overflow-hidden transition ${i === active ? 'border-brand ring-2 ring-brand/20' : 'border-line hover:border-brand/40'}`}
              >
                <div className={`bg-gradient-to-br ${a.bg} aspect-square grid place-items-center`}>
                  <div style={{ transform: a.transform }} className="origin-center">
                    <ProductIllustration category={product.category} icon={product.icon} className="" size={42} />
                  </div>
                </div>
                <span className="absolute bottom-1 inset-x-0 text-center text-[9px] uppercase tracking-wider font-semibold text-muted">{a.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {tab === 'spin' && (
        <>
          <div
            onPointerDown={startSpin}
            onPointerMove={moveSpin}
            onPointerUp={endSpin}
            onPointerCancel={endSpin}
            className="relative rounded-3xl bg-gradient-to-br from-elev to-bg aspect-square overflow-hidden cursor-ew-resize select-none touch-pan-y"
            role="slider"
            aria-label="Drag to rotate 360°"
            aria-valuemin={0}
            aria-valuemax={SPIN_FRAMES - 1}
            aria-valuenow={spin}
          >
            <div
              aria-hidden
              className="absolute inset-0 grid place-items-center"
              style={{
                transform: `perspective(900px) rotateY(${(spin / SPIN_FRAMES) * 360}deg)`,
                transition: spinDragRef.current ? 'none' : 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <ProductIllustration category={product.category} icon={product.icon} className="h-full w-full" size={240} />
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 chip bg-bg/80 backdrop-blur text-ink !text-[10px]">
              <Icon.arrow width={10} height={10} className="rotate-180" /> Drag · {Math.round((spin / SPIN_FRAMES) * 360)}° <Icon.arrow width={10} height={10} />
            </div>
          </div>
          <div className="mt-4 h-1.5 rounded-full bg-elev overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand to-brand2 transition-all duration-150" style={{ width: `${(spin / (SPIN_FRAMES - 1)) * 100}%` }} />
          </div>
          <p className="text-[11px] text-muted mt-2">
            360° spin generated from a single illustration for now — real product photogrammetry slots in once a /spin/ frame set ships per SKU.
          </p>
        </>
      )}

      {tab === 'video' && (
        <VideoPanel product={product} reduced={reduced} />
      )}

      {modalOpen && (
        <ZoomModal product={product} onClose={() => setModalOpen(false)} initialAngle={active} />
      )}
    </div>
  );
}

/**
 * Programmatic "video" stand-in — a 15-second looping CSS animation
 * that pans, zooms and tilts the product illustration to give the
 * surface the feel of a real product clip until the studio assets ship.
 *
 * Honours `prefers-reduced-motion` by freezing on the first frame and
 * surfacing the play-state toggle so the user can opt in to motion.
 */
function VideoPanel({ product, reduced }: { product: EnrichedProduct; reduced: boolean }) {
  const [playing, setPlaying] = useState(!reduced);
  const playState = playing ? 'running' : 'paused';
  return (
    <div className="relative rounded-3xl bg-gradient-to-br from-bg to-elev aspect-square overflow-hidden">
      {/* Animated lighting sweep behind the product */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(40% 60% at 50% 30%, rgb(var(--brand) / .35), transparent 70%),' +
            'radial-gradient(50% 60% at 70% 70%, rgb(var(--brand2) / .35), transparent 70%)',
          animation: 'productVideoBg 15s ease-in-out infinite alternate',
          animationPlayState: playState
        }}
      />
      {/* The "subject" — a transformed illustration that pans + zooms */}
      <div
        className="absolute inset-0 grid place-items-center"
        style={{
          animation: 'productVideoPan 15s ease-in-out infinite alternate',
          animationPlayState: playState
        }}
      >
        <ProductIllustration category={product.category} icon={product.icon} className="h-[70%] w-[70%]" size={220} />
      </div>

      {/* Faux progress bar — fills over the loop duration */}
      <div className="absolute bottom-3 inset-x-3 h-1 rounded-full bg-bg/60 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand to-brand2"
          style={{
            animation: 'productVideoProgress 15s linear infinite',
            animationPlayState: playState
          }}
        />
      </div>

      {/* Play / pause + timecode */}
      <div className="absolute top-3 left-3 chip bg-bg/80 backdrop-blur text-ink !text-[10px] tabular-nums">
        00:15 loop
      </div>
      <button
        type="button"
        onClick={() => setPlaying(p => !p)}
        aria-label={playing ? 'Pause preview' : 'Play preview'}
        className="absolute top-3 right-3 grid place-items-center h-9 w-9 rounded-full bg-bg/80 backdrop-blur text-ink hover:bg-bg transition"
      >
        {playing
          ? <span className="flex items-center gap-0.5"><span className="w-1 h-3 bg-current rounded-sm" /><span className="w-1 h-3 bg-current rounded-sm" /></span>
          : <span className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-current ml-0.5" />}
      </button>

      <div className="absolute bottom-7 inset-x-0 text-center px-6">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted font-semibold">15-second loop</p>
        <p className="text-[11px] text-muted mt-0.5">
          Generated from the illustration for now — real studio video drops in once we shoot per SKU.
        </p>
      </div>
    </div>
  );
}

function ZoomModal({
  product, initialAngle, onClose
}: {
  product: EnrichedProduct;
  initialAngle: number;
  onClose: () => void;
}) {
  const [active, setActive] = useState(initialAngle);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product image zoom"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm grid place-items-center px-4 py-6 animate-fadein"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative max-w-4xl w-full max-h-[90vh] aspect-square bg-gradient-to-br from-bg to-elev rounded-3xl overflow-hidden"
        style={{ animation: 'zoomIn 280ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 grid place-items-center h-9 w-9 rounded-full bg-bg/80 backdrop-blur text-ink hover:bg-bg"
        >
          <Icon.close width={14} height={14} />
        </button>

        <div className="absolute inset-0 grid place-items-center" style={{ transform: ANGLES[active].transform, transition: 'transform 360ms cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <ProductIllustration category={product.category} icon={product.icon} className="h-[80%] w-[80%]" size={420} />
        </div>

        {/* Angle selector inside the modal */}
        <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2">
          {ANGLES.map((a, i) => (
            <button
              key={a.label}
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold transition ${i === active ? 'bg-brand text-white' : 'bg-bg/70 text-muted hover:text-ink'}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
