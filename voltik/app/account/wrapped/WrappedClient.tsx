'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon, type IconKey } from '@/components/Icons';

interface Metrics {
  spent: number;
  itemsBought: number;
  saved: number;
  orderCount: number;
  reviewCount: number;
  helpfulTotal: number;
  topCategory: { id: string; count: number } | null;
  topDow: string | null;
  topReviewTitle: string | null;
}

interface Slide {
  bg: string;            // CSS gradient
  icon: IconKey;
  kicker: string;
  big: string;
  body: string;
  sub?: string;
}

/**
 * Spotify-Wrapped-style 12-month recap. One slide per metric; auto-
 * advances every ~5s with a snake progress bar across the top. Click
 * anywhere advances; click → pauses + reveals controls.
 *
 * If the user is brand-new (no orders, no reviews), we render a friendly
 * "your wrapped is still loading" card instead of empty stats.
 */
export function WrappedClient({ userName, metrics }: { userName: string; metrics: Metrics }) {
  const slides = buildSlides(userName, metrics);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-advance the slideshow. Stops once we hit the last slide so the
  // CTA stays put; pauses on user interaction.
  useEffect(() => {
    if (paused) return;
    if (idx >= slides.length - 1) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const t = setTimeout(() => setIdx(i => i + 1), 5200);
    return () => clearTimeout(t);
  }, [idx, slides.length, paused]);

  // Keyboard nav so the wrapped feels like a Stories deck.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') setIdx(i => Math.min(slides.length - 1, i + 1));
      if (e.key === 'ArrowLeft')                   setIdx(i => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <main className="container-x py-20">
        <div className="card max-w-md mx-auto p-10 text-center">
          <Icon.spark className="mx-auto text-brand" width={32} height={32} />
          <h2 className="font-display font-bold text-xl mt-4">Your wrapped is still warming up.</h2>
          <p className="text-sm text-muted mt-2">
            Place a few orders or leave a review and we'll cook up a recap.
          </p>
          <Link href="/shop" className="btn-primary mt-6 inline-flex text-sm">
            Browse the shop <Icon.arrow width={12} height={12} />
          </Link>
        </div>
      </main>
    );
  }

  const slide = slides[idx];
  const isLast = idx === slides.length - 1;

  return (
    <main className="fixed inset-0 z-[60] grid place-items-center p-4 sm:p-8 overflow-hidden" style={{ background: 'rgb(var(--bg))' }}>
      <div className="w-full max-w-md aspect-[9/16] sm:aspect-[3/4] relative">
        {/* Top progress bars — one segment per slide */}
        <div className="absolute top-3 inset-x-3 z-10 flex gap-1.5">
          {slides.map((_, i) => (
            <span key={i} className="flex-1 h-1 rounded-full bg-white/15 overflow-hidden">
              <span
                className="block h-full bg-white origin-left"
                style={{
                  transform: `scaleX(${i < idx ? 1 : i === idx ? (paused ? 0.5 : 1) : 0})`,
                  transition: i === idx && !paused
                    ? 'transform 5200ms linear'
                    : 'transform 200ms ease-out'
                }}
              />
            </span>
          ))}
        </div>

        {/* Slide canvas — tap to advance, hold to pause */}
        <div
          onClick={() => setIdx(i => Math.min(slides.length - 1, i + 1))}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
          className="relative h-full w-full rounded-3xl overflow-hidden text-white cursor-pointer select-none animate-fadein"
          style={{ background: slide.bg }}
          key={idx}
        >
          {/* Brand mark */}
          <div className="absolute top-6 left-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-semibold opacity-80">
            <span className="grid place-items-center h-7 w-7 rounded-lg bg-white/15 backdrop-blur-sm">
              <Icon.bolt width={12} height={12} />
            </span>
            Voltik · 12 months
          </div>

          {/* Slide body */}
          <div className="absolute inset-0 grid place-items-center px-8">
            <div className="text-center">
              <SlideIcon icon={slide.icon} />
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold opacity-80 mt-6">
                {slide.kicker}
              </div>
              <div
                className="font-display font-black mt-3 leading-none"
                style={{ fontSize: 'clamp(54px, 13vw, 92px)', letterSpacing: '-0.04em' }}
              >
                {slide.big}
              </div>
              <p className="text-sm sm:text-base mt-5 leading-relaxed max-w-xs mx-auto opacity-90">
                {slide.body}
              </p>
              {slide.sub && (
                <div className="text-[11px] uppercase tracking-[0.18em] font-semibold mt-6 opacity-70">
                  {slide.sub}
                </div>
              )}
            </div>
          </div>

          {/* Final-slide footer with CTAs */}
          {isLast && (
            <div className="absolute inset-x-6 bottom-6 flex gap-2">
              <Link href="/shop" className="flex-1 grid place-items-center rounded-full bg-white text-ink py-2.5 text-sm font-semibold">
                Keep shopping
              </Link>
              <Link href="/account" className="flex-1 grid place-items-center rounded-full bg-white/15 backdrop-blur-sm py-2.5 text-sm font-semibold">
                Back to dashboard
              </Link>
            </div>
          )}

          {/* Hint on the first slide so it doesn't feel mysterious */}
          {idx === 0 && (
            <div className="absolute inset-x-0 bottom-6 text-center text-[10px] uppercase tracking-[0.18em] opacity-70">
              Tap to continue · ← → to navigate
            </div>
          )}
        </div>

        {/* Close — top right outside the card area */}
        <Link
          href="/account"
          aria-label="Close wrapped"
          className="absolute top-3 right-3 z-20 grid place-items-center h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
          onClick={e => e.stopPropagation()}
        >
          <Icon.close width={12} height={12} />
        </Link>
      </div>
    </main>
  );
}

function SlideIcon({ icon }: { icon: IconKey }) {
  const Glyph = Icon[icon];
  return (
    <span className="inline-grid place-items-center h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-sm">
      <Glyph width={26} height={26} />
    </span>
  );
}

function buildSlides(name: string, m: Metrics): Slide[] {
  const out: Slide[] = [];
  const firstName = name.split(/\s+/)[0] || 'You';

  // 1. Welcome.
  out.push({
    bg: 'linear-gradient(135deg, #0a0e1a 0%, #1d1240 60%, #4c1d95 100%)',
    icon: 'spark',
    kicker: `Hey ${firstName}`,
    big: 'Your year, plugged in.',
    body: 'Twelve months of Voltik — what you bought, what you saved, what you said. Tap through to see your stats.',
    sub: 'Made just for you ⚡'
  });

  if (m.orderCount > 0) {
    out.push({
      bg: 'linear-gradient(160deg, #0c4a6e 0%, #1e3a8a 50%, #6b21a8 100%)',
      icon: 'list',
      kicker: 'You placed',
      big: m.orderCount.toLocaleString(),
      body: `${m.orderCount === 1 ? 'order' : 'orders'} this year — that's ${m.itemsBought.toLocaleString()} item${m.itemsBought === 1 ? '' : 's'} actually shipped.`,
      sub: 'Restock unlocked'
    });
  }

  if (m.spent > 0) {
    out.push({
      bg: 'linear-gradient(135deg, #6d28d9 0%, #db2777 60%, #f59e0b 100%)',
      icon: 'bolt',
      kicker: 'Total damage',
      big: `$${Math.round(m.spent).toLocaleString()}`,
      body: m.saved > 0
        ? `You spent $${Math.round(m.spent).toLocaleString()} on accessories — and saved $${Math.round(m.saved).toLocaleString()} with deals along the way.`
        : 'Worth every cent. Your devices are running on Voltik-quality power.',
      sub: m.saved > 0 ? `Saved $${Math.round(m.saved).toLocaleString()} in deals` : undefined
    });
  }

  if (m.topCategory) {
    out.push({
      bg: 'linear-gradient(135deg, #155e75 0%, #0891b2 50%, #14b8a6 100%)',
      icon: 'box',
      kicker: 'Your obsession',
      big: m.topCategory.id,
      body: `You came back to ${m.topCategory.id} ${m.topCategory.count} time${m.topCategory.count === 1 ? '' : 's'}. We see you — and we're shipping more of it soon.`,
      sub: 'Top category'
    });
  }

  if (m.topDow) {
    out.push({
      bg: 'linear-gradient(150deg, #be185d 0%, #c026d3 50%, #4f46e5 100%)',
      icon: 'refresh',
      kicker: 'When you shop',
      big: m.topDow,
      body: `Most of your orders dropped on a ${m.topDow}. Mark your calendar — that's "treat yourself" o'clock.`,
      sub: 'Day of the week'
    });
  }

  if (m.reviewCount > 0) {
    out.push({
      bg: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 60%, #ec4899 100%)',
      icon: 'star',
      kicker: 'You wrote',
      big: `${m.reviewCount}`,
      body: m.helpfulTotal > 0
        ? `${m.reviewCount} review${m.reviewCount === 1 ? '' : 's'} — and ${m.helpfulTotal} shopper${m.helpfulTotal === 1 ? '' : 's'} found ${m.reviewCount === 1 ? 'it' : 'them'} useful.`
        : `${m.reviewCount} review${m.reviewCount === 1 ? '' : 's'} dropped into the wild. Future shoppers thank you.`,
      sub: m.topReviewTitle ? `Top review: "${m.topReviewTitle}"` : undefined
    });
  }

  // Outro — always render.
  out.push({
    bg: 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 55%, #f97316 100%)',
    icon: 'heart',
    kicker: 'See you next year',
    big: 'Thanks ⚡',
    body: 'For trusting us with your charging, your cases, and your soundtrack. Here\'s to another year of plug-and-play.',
    sub: 'Voltik · Engineered to charge'
  });

  // If the only slides we have are welcome + outro, there's nothing
  // meaningful to recap — the page handles this above by rendering the
  // friendly fallback.
  return out.length <= 2 ? [] : out;
}
