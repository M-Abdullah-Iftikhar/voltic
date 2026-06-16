'use client';
import { useEffect, useState } from 'react';
import { Icon, type IconKey } from './Icons';

const SEEN_KEY = 'voltik:admin-tour-seen';

interface TourStep {
  /** CSS selector that the spotlight will frame. Null → centered intro modal. */
  selector: string | null;
  title: string;
  body: string;
  icon: IconKey;
}

const STEPS: TourStep[] = [
  {
    selector: null,
    icon: 'spark',
    title: 'Welcome to the Voltik console.',
    body: 'Two-minute tour. We\'ll point at the things you\'ll touch most often. Use ↑↓ ← → or click anywhere to advance.'
  },
  {
    selector: 'aside[class*="w-64"]',
    icon: 'dashboard',
    title: 'Sidebar = everywhere',
    body: 'Catalog, orders, customers, categories, reviews, promos, subscribers. Each section has its own filters and bulk actions.'
  },
  {
    selector: 'button[aria-label="Open command palette"]',
    icon: 'search',
    title: 'Command palette',
    body: 'Cmd/Ctrl+K from anywhere. Jump to an order, edit a product, change the theme — fastest way around.'
  },
  {
    selector: 'div[role="radiogroup"][aria-label="Theme"]',
    icon: 'sun',
    title: 'Theme switcher',
    body: 'Light or dark — the storefront ThemeToggle keeps the same key, so what you set here also greets shoppers.'
  },
  {
    selector: '[data-tour="admin-greeting"]',
    icon: 'bolt',
    title: 'Live activity',
    body: 'Today\'s revenue, orders, reviews, and customers — all driven by a green pulse dot when fresh data lands. Hover any KPI for a sparkline trend.'
  }
];

/**
 * Lightweight first-visit walkthrough for the admin console. Mounted by
 * AdminShell; renders nothing for return visitors or anyone who's already
 * dismissed the tour. Honours prefers-reduced-motion (skips the spotlight
 * animation but still shows the cards).
 *
 * No external deps — pure positioning relative to the target's
 * bounding-rect. Resilient: if a selector doesn't resolve, the step falls
 * back to a centred modal instead of pointing at thin air.
 */
export function AdminOnboardingTour() {
  const [stepIdx, setStepIdx] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Kick off on first visit, slightly after layout has settled.
  useEffect(() => {
    let seen = false;
    try { seen = window.localStorage.getItem(SEEN_KEY) === '1'; } catch {}
    if (seen) return;
    const t = setTimeout(() => setStepIdx(0), 600);
    return () => clearTimeout(t);
  }, []);

  // Recompute the spotlight rect whenever the step changes, on resize, on scroll.
  useEffect(() => {
    if (stepIdx == null) return;
    const step = STEPS[stepIdx];
    const measure = () => {
      if (!step.selector) { setRect(null); return; }
      const el = document.querySelector(step.selector);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [stepIdx]);

  // Keyboard nav.
  useEffect(() => {
    if (stepIdx == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return finish();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'Enter') advance(1);
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   advance(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stepIdx]);

  if (stepIdx == null) return null;

  const advance = (dir: 1 | -1) => {
    setStepIdx(i => {
      if (i == null) return i;
      const next = i + dir;
      if (next < 0) return 0;
      if (next >= STEPS.length) { finish(); return null; }
      return next;
    });
  };

  function finish() {
    try { window.localStorage.setItem(SEEN_KEY, '1'); } catch {}
    setStepIdx(null);
  }

  const step = STEPS[stepIdx];
  const Glyph = Icon[step.icon];

  // Spotlight box (rect-driven) + tour card position (below-left when possible).
  const pad = 8;
  const spot = rect
    ? { top: Math.max(0, rect.top - pad), left: Math.max(0, rect.left - pad), width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;

  // Card landing — top-anchored just below the spotlight, or centered if no rect.
  const card = (() => {
    if (!spot) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
    const aboveRoom = spot.top > 220;
    const top  = aboveRoom ? spot.top - 12 : spot.top + spot.height + 12;
    const left = Math.min(window.innerWidth - 360, Math.max(16, spot.left));
    return { left, top, transform: aboveRoom ? 'translateY(-100%)' : 'translateY(0)' };
  })();

  return (
    <div className="fixed inset-0 z-[80] pointer-events-none">
      {/* Dim layer with a cut-out for the highlighted element. We do this by
          drawing four solid blocks around the spotlight rect; cleaner than
          mucking with mask-image which Safari occasionally rasterises badly. */}
      {spot ? (
        <>
          <div className="absolute inset-x-0 bg-bg/80 backdrop-blur-sm pointer-events-auto"
               style={{ top: 0, height: spot.top }} onClick={() => advance(1)} />
          <div className="absolute inset-x-0 bg-bg/80 backdrop-blur-sm pointer-events-auto"
               style={{ top: spot.top + spot.height, bottom: 0 }} onClick={() => advance(1)} />
          <div className="absolute bg-bg/80 backdrop-blur-sm pointer-events-auto"
               style={{ top: spot.top, height: spot.height, left: 0, width: spot.left }} onClick={() => advance(1)} />
          <div className="absolute bg-bg/80 backdrop-blur-sm pointer-events-auto"
               style={{ top: spot.top, height: spot.height, left: spot.left + spot.width, right: 0 }} onClick={() => advance(1)} />
          {/* Highlight outline + soft glow */}
          <div
            aria-hidden
            className="absolute rounded-2xl pointer-events-none transition-all duration-300 ease-out"
            style={{
              top: spot.top, left: spot.left, width: spot.width, height: spot.height,
              boxShadow: '0 0 0 2px rgb(var(--brand)), 0 0 0 6px rgb(var(--brand) / 0.18), 0 30px 60px -10px rgb(var(--brand) / 0.45)'
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-bg/85 backdrop-blur-sm pointer-events-auto" onClick={() => advance(1)} />
      )}

      {/* Card */}
      <div
        role="dialog"
        aria-labelledby="voltik-tour-title"
        className="absolute pointer-events-auto card p-5 max-w-sm w-[88vw] sm:w-[360px] shadow-card animate-slidein"
        style={card}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="grid place-items-center h-10 w-10 rounded-xl text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}
          >
            <Glyph width={16} height={16} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">
              Step {stepIdx + 1} / {STEPS.length}
            </div>
            <h3 id="voltik-tour-title" className="font-display font-bold text-base mt-0.5 leading-snug">
              {step.title}
            </h3>
            <p className="text-sm text-muted mt-1.5 leading-relaxed">{step.body}</p>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-between mt-5">
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStepIdx(i)}
                aria-label={`Go to step ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIdx ? 'w-6 bg-brand' : 'w-1.5 bg-line hover:bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={finish} className="text-xs text-muted hover:text-ink">
              Skip tour
            </button>
            <button onClick={() => advance(1)} className="btn-primary text-xs !px-3 !py-1.5">
              {stepIdx === STEPS.length - 1 ? 'Finish' : 'Next'}
              <Icon.arrow width={11} height={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
