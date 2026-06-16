'use client';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';
import type { EnrichedProduct } from '@/lib/types';

interface Props {
  product: EnrichedProduct;
}

type ARStatus = 'idle' | 'preview' | 'unsupported';

/**
 * "View in your room" affordance. The plan is WebXR via `<model-viewer>`
 * once we publish per-SKU glTF / USDZ — Apple's Quick Look (USDZ) handles
 * iOS, Google's Scene Viewer (glTF) covers Android, and WebXR fills
 * desktop. Until those assets land, the button opens a stand-in preview
 * modal that explains what AR will look like and lets the user walk
 * through it on a synthesised room background.
 *
 * The component is only rendered for product categories where AR
 * actually makes sense — cases, mounts, stands and audio.
 */
export function ARViewButton({ product }: Props) {
  const [status, setStatus] = useState<ARStatus>('idle');
  const [arSupported, setArSupported] = useState<boolean | null>(null);

  // Feature-detect on mount so we can tell the user honestly whether
  // their device can do the real thing yet.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    const ua = navigator.userAgent;
    // Quick Look + Scene Viewer aren't on `navigator` — but their
    // platforms are predictable enough from the UA string for a
    // first-touch hint. The real `model-viewer` lookup happens once
    // it's wired in.
    const isIOS     = /iPhone|iPad/.test(ua);
    const isAndroid = /Android/i.test(ua);
    const hasXR    = 'xr' in navigator;
    setArSupported(isIOS || isAndroid || hasXR);
  }, []);

  const open = () => setStatus('preview');
  const close = () => setStatus('idle');

  // Restrict to categories where AR actually adds something. A USB-C
  // cable in your room is just a cable on the floor.
  const cat = product.category.toLowerCase();
  const eligible = /case|cover|stand|mount|tripod|gimbal|speaker|headphone|headset|earbud|audio/.test(cat) || /case|stand|speaker|mount/.test(product.name.toLowerCase());
  if (!eligible) return null;

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-full border border-line bg-surface hover:border-brand/40 hover:bg-elev/60 transition text-xs font-semibold text-ink"
        aria-label="View this product in your room with AR"
      >
        <span className="grid place-items-center h-5 w-5 rounded-full bg-gradient-to-br from-brand to-brand2 text-white">
          <Icon.dashboard width={11} height={11} />
        </span>
        View in your room
        <span className={`chip !text-[9px] ${arSupported ? 'bg-success/15 text-success' : 'bg-elev text-muted'}`}>
          {arSupported === null ? 'Detect…' : arSupported ? 'AR ready' : 'Preview only'}
        </span>
      </button>

      {status === 'preview' && (
        <ARPreviewModal product={product} arSupported={arSupported ?? false} onClose={close} />
      )}
    </>
  );
}

/**
 * Stand-in modal — shows a synthesised "room" with the product floated
 * into place. Drops in real AR via `<model-viewer src="…glb">` and an
 * `ar` attribute once 3D assets ship.
 */
function ARPreviewModal({
  product, arSupported, onClose
}: {
  product: EnrichedProduct;
  arSupported: boolean;
  onClose: () => void;
}) {
  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="View in your room"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4 animate-fadein"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-card"
        style={{ animation: 'zoomIn 320ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        {/* Synthesised "room" — warm gradient floor + cool wall, plus a
            soft shadow on the floor where the product is "resting". */}
        <div
          className="relative h-[480px]"
          style={{
            background:
              'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 55%, #94a3b8 56%, #64748b 100%)'
          }}
        >
          {/* Window light spill */}
          <div aria-hidden className="absolute -top-10 left-10 w-32 h-44 bg-white/40 rotate-6 blur-2xl" />
          {/* Floor seam */}
          <div aria-hidden className="absolute inset-x-0 top-[55%] h-px bg-black/15" />

          {/* Product "placed" in the room */}
          <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-700 font-semibold mb-2">
              {product.brand} · {product.name}
            </div>
            <div className="w-44 h-44 mx-auto rounded-2xl bg-white/85 backdrop-blur-sm border border-white/60 shadow-2xl grid place-items-center">
              <div className="text-slate-800 grid place-items-center" aria-hidden>
                <Icon.box width={88} height={88} />
              </div>
            </div>
            {/* Soft ground shadow */}
            <div aria-hidden className="mx-auto mt-2 w-40 h-3 bg-black/25 blur-md rounded-full" />
          </div>

          {/* Reticule overlay so it reads as an AR camera */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
            <defs>
              <pattern id="ar-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgb(15 23 42 / 0.08)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect x="0" y="280" width="100%" height="200" fill="url(#ar-grid)" opacity="0.5" />
          </svg>

          {/* Corner brackets */}
          {[
            'top-3 left-3 border-t border-l',
            'top-3 right-3 border-t border-r',
            'bottom-3 left-3 border-b border-l',
            'bottom-3 right-3 border-b border-r'
          ].map((c, i) => (
            <span key={i} aria-hidden className={`absolute h-5 w-5 border-white/90 ${c}`} />
          ))}
        </div>

        {/* Footer strip */}
        <div className="bg-surface p-4 sm:p-5 flex flex-wrap items-center gap-3 justify-between">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">AR preview</div>
            <p className="text-sm text-ink mt-0.5 line-clamp-2">
              {arSupported
                ? 'Your device supports AR — drop the 3D model in once it ships and this opens straight into your camera.'
                : 'Your device can\'t do native AR yet — preview only for now. We surface the 3D model on supported phones.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost text-xs"
            >
              Close
            </button>
            <button
              type="button"
              disabled
              className="btn-primary text-xs opacity-50 cursor-not-allowed"
              title="3D model coming once asset pipeline ships"
            >
              <Icon.spark width={11} height={11} /> Launch AR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
