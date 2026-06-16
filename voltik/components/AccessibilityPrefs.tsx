'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { brandSound, getSoundEnabled, setSoundEnabled } from '@/lib/brandSound';

type FontScale = 'sm' | 'md' | 'lg';
type Contrast  = 'normal' | 'high';

const FONT_KEY    = 'voltik:font-scale';
const CONTRAST_KEY = 'voltik:contrast';
const FONT_SCALES: Record<FontScale, number> = { sm: 0.92, md: 1, lg: 1.12 };
const FONT_LABELS: Record<FontScale, string> = { sm: 'Compact (92%)', md: 'Default (100%)', lg: 'Large (112%)' };

/**
 * Floating accessibility menu — bottom-left corner, opens a panel with
 * font-size scaler and high-contrast toggle. Choices persist in
 * localStorage and apply as soon as the page loads (via a small inline
 * script in `<head>` to avoid a flash of un-themed content).
 *
 * Apply via CSS:
 *   html { font-size: calc(16px * var(--font-scale, 1)); }
 *   html.contrast-high { ... overrides in globals.css ... }
 */
export function AccessibilityPrefs() {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState<FontScale>('md');
  const [contrast, setContrast] = useState<Contrast>('normal');
  const [sound, setSound] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSound(getSoundEnabled());
  }, []);

  // Restore from storage on mount.
  useEffect(() => {
    try {
      const f = window.localStorage.getItem(FONT_KEY) as FontScale | null;
      const c = window.localStorage.getItem(CONTRAST_KEY) as Contrast | null;
      if (f && f in FONT_SCALES) setScale(f);
      if (c === 'high') setContrast('high');
    } catch {}
  }, []);

  // Apply whenever the controls move. Document root carries the CSS hooks.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--font-scale', String(FONT_SCALES[scale]));
    try { window.localStorage.setItem(FONT_KEY, scale); } catch {}
  }, [scale]);

  useEffect(() => {
    const root = document.documentElement;
    if (contrast === 'high') root.classList.add('contrast-high');
    else                     root.classList.remove('contrast-high');
    try { window.localStorage.setItem(CONTRAST_KEY, contrast); } catch {}
  }, [contrast]);

  // Click-outside + Escape to close.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey  = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="fixed bottom-3 left-3 z-[55] print:hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="voltik-a11y-panel"
        aria-label="Accessibility preferences"
        title="Accessibility preferences"
        className="grid place-items-center h-11 w-11 rounded-full border border-line bg-surface text-ink hover:bg-elev shadow-soft transition"
      >
        <Icon.shield width={16} height={16} />
      </button>

      {open && (
        <div
          id="voltik-a11y-panel"
          role="dialog"
          aria-label="Accessibility preferences"
          className="absolute bottom-14 left-0 w-72 card p-4 animate-slidein"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="font-display font-bold text-sm">Accessibility</h3>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted hover:text-ink">
              <Icon.close width={12} height={12} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-1.5">Text size</div>
              <div role="radiogroup" aria-label="Text size" className="grid grid-cols-3 gap-1.5">
                {(['sm', 'md', 'lg'] as const).map(s => (
                  <button
                    key={s}
                    role="radio"
                    aria-checked={scale === s}
                    onClick={() => setScale(s)}
                    className={`rounded-xl border px-2 py-2 transition ${
                      scale === s
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-line text-muted hover:text-ink hover:bg-elev'
                    }`}
                  >
                    <span className={`block font-semibold ${s === 'sm' ? 'text-xs' : s === 'md' ? 'text-sm' : 'text-base'}`}>A</span>
                    <span className="text-[10px] text-muted block mt-0.5">
                      {s === 'sm' ? '92%' : s === 'md' ? '100%' : '112%'}
                    </span>
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-muted mt-1">{FONT_LABELS[scale]}</div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-1.5">Contrast</div>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 cursor-pointer hover:bg-elev transition">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">High contrast</span>
                  <span className="block text-[11px] text-muted">Stronger borders, bolder text, no glow.</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={contrast === 'high'}
                  onClick={() => setContrast(c => c === 'high' ? 'normal' : 'high')}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition ${
                    contrast === 'high' ? 'bg-brand border-brand' : 'bg-elev border-line'
                  }`}
                  aria-label="Toggle high contrast"
                >
                  <span
                    aria-hidden
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      contrast === 'high' ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-1.5">Brand sound</div>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 cursor-pointer hover:bg-elev transition">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">UI chime</span>
                  <span className="block text-[11px] text-muted">A short ping on add-to-cart + order placed.</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={sound}
                  onClick={() => {
                    const next = !sound;
                    setSound(next);
                    setSoundEnabled(next);
                    // Preview the chime when turning it on — uses the user
                    // gesture from this click to unlock the AudioContext.
                    if (next) brandSound('success');
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition ${
                    sound ? 'bg-brand border-brand' : 'bg-elev border-line'
                  }`}
                  aria-label="Toggle UI chime"
                >
                  <span
                    aria-hidden
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      sound ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
            </div>

            <button
              onClick={() => {
                setScale('md'); setContrast('normal');
                setSound(false); setSoundEnabled(false);
              }}
              className="w-full text-[11px] text-muted hover:text-ink transition"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
