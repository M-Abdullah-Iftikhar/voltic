'use client';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';
import type { Review } from '@/lib/types';

interface Photo {
  /** Stable id so the lightbox can route back into the gallery. */
  id: string;
  /** Gradient seed driving the synthetic backdrop. */
  hue: number;
  /** Aspect ratio shaped by the seed so the row isn't perfectly even. */
  aspect: '1/1' | '4/5' | '4/3';
}

/**
 * Photo strip for an individual review. We don't have UGC uploads in the
 * schema yet, so the strip synthesises 0-4 placeholder "photos" from the
 * review id — same review, same photo set, every render. Drop in real
 * URLs by extending `Review` with `photos?: string[]` and threading them
 * here.
 *
 * Reviews with a high helpful count get the largest photo strips so the
 * mosaic reads as "trusted shoppers also documented their experience"
 * rather than a uniform block of placeholders.
 */
export function ReviewPhotos({ review }: { review: Review }) {
  const photos = derivePhotos(review);
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="mt-3 flex gap-2 flex-wrap">
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setLightbox(i)}
            aria-label={`Open review photo ${i + 1} of ${photos.length}`}
            className={`relative rounded-xl overflow-hidden border border-line/60 hover:border-brand/40 transition group ${aspectClass(p.aspect)}`}
            style={{ width: 72, background: photoBg(p.hue) }}
          >
            <span aria-hidden className="absolute inset-0 grid place-items-center text-white/80">
              <Icon.box width={28} height={28} />
            </span>
            <span aria-hidden className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition" />
          </button>
        ))}
        <span className="text-[10px] text-muted self-end pb-1">
          {photos.length} photo{photos.length === 1 ? '' : 's'} from {review.userName}
        </span>
      </div>

      {lightbox !== null && (
        <Lightbox
          photos={photos}
          start={lightbox}
          reviewer={review.userName}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

function Lightbox({
  photos, start, reviewer, onClose
}: {
  photos: Photo[];
  start: number;
  reviewer: string;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(start);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  setIdx(i => (i - 1 + photos.length) % photos.length);
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % photos.length);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [photos.length, onClose]);

  const photo = photos[idx];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo from ${reviewer}`}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur grid place-items-center p-4 animate-fadein"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative max-w-2xl w-full"
        style={{ animation: 'zoomIn 280ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <div
          className="aspect-square rounded-3xl overflow-hidden grid place-items-center text-white/85"
          style={{ background: photoBg(photo.hue) }}
        >
          <Icon.box width={160} height={160} />
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 grid place-items-center h-9 w-9 rounded-full bg-bg/80 backdrop-blur text-ink hover:bg-bg"
        >
          <Icon.close width={14} height={14} />
        </button>

        {/* Caption */}
        <div className="text-center mt-3 text-white">
          <div className="text-[10px] uppercase tracking-[0.18em] opacity-70 font-semibold">Photo {idx + 1} of {photos.length}</div>
          <div className="text-sm mt-1">From {reviewer}</div>
        </div>

        {photos.length > 1 && (
          <>
            <button
              onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
              aria-label="Previous"
              className="absolute top-1/2 -translate-y-1/2 -left-2 sm:-left-12 grid place-items-center h-10 w-10 rounded-full bg-bg/80 backdrop-blur text-ink hover:bg-bg"
            >
              <Icon.arrow width={14} height={14} className="rotate-180" />
            </button>
            <button
              onClick={() => setIdx(i => (i + 1) % photos.length)}
              aria-label="Next"
              className="absolute top-1/2 -translate-y-1/2 -right-2 sm:-right-12 grid place-items-center h-10 w-10 rounded-full bg-bg/80 backdrop-blur text-ink hover:bg-bg"
            >
              <Icon.arrow width={14} height={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function aspectClass(a: Photo['aspect']) {
  if (a === '4/5') return 'aspect-[4/5]';
  if (a === '4/3') return 'aspect-[4/3]';
  return 'aspect-square';
}

function photoBg(hue: number) {
  return `
    radial-gradient(60% 80% at 30% 30%, hsl(${hue} 70% 60% / .85), transparent 60%),
    radial-gradient(60% 80% at 70% 70%, hsl(${(hue + 70) % 360} 65% 50% / .75), transparent 65%),
    linear-gradient(180deg, hsl(${(hue + 210) % 360} 35% 18%), hsl(${(hue + 240) % 360} 40% 10%))
  `;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function derivePhotos(review: Review): Photo[] {
  // Only a fraction of reviews get photos — keeps the section honest.
  // High-helpful reviews are biased toward having photos so the social
  // proof reads as "people who put time into their reviews show their
  // setup".
  const seed = hash(review.id || review.userId || review.userName || 'r');
  const helpful = review.helpfulCount || 0;
  const photoCount = seed % 10 < (helpful >= 5 ? 7 : 4) ? 1 + (seed % 4) : 0;
  if (photoCount === 0) return [];

  return Array.from({ length: photoCount }, (_, i) => {
    const inner = (seed >> (i * 4)) & 0xff;
    const aspect: Photo['aspect'] = (inner % 3 === 0) ? '4/5' : (inner % 3 === 1) ? '4/3' : '1/1';
    return {
      id: `${review.id}-p${i}`,
      hue: (seed + i * 47) % 360,
      aspect
    };
  });
}
