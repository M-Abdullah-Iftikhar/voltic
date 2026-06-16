/**
 * Tiny Web-Audio "brand ping" — a two-note ascending chime synthesised at
 * call time so we ship no audio assets. Defaults to off because audio is
 * an opt-in experience; users flip a stored boolean from the UI to enable.
 *
 * Behaviour:
 *   - Sound is gated by a localStorage flag (`voltik:sound`).
 *   - Disabled under prefers-reduced-motion (we extend reduced motion to
 *     mean reduced sensory feedback, same policy as the haptics shim).
 *   - All calls are no-ops if the AudioContext can't be constructed
 *     (some Firefox builds, locked iframes, no-audio environments).
 */

const STORAGE_KEY = 'voltik:sound';

type Tone = 'success' | 'tap' | 'error';

let ctx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  } catch {
    return null;
  }
}

function isEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Public toggle — call from a settings UI. Persists across sessions. */
export function setSoundEnabled(on: boolean): void {
  try { window.localStorage.setItem(STORAGE_KEY, on ? '1' : '0'); } catch {}
  // Browsers require a user gesture to unlock the AudioContext; tucking
  // a resume() into the toggle handler covers most setups.
  if (on) {
    const c = ensureCtx();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
  }
}

export function getSoundEnabled(): boolean {
  return isEnabled();
}

/**
 * Play a one-shot brand chime. Two short stacked sine notes at 720 Hz +
 * 1080 Hz with a quick envelope so it reads as a single "ping" — short
 * enough that repeated successes don't pile up.
 */
export function brandSound(tone: Tone = 'success'): void {
  if (!isEnabled()) return;
  const c = ensureCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});

  const now = c.currentTime;
  const notes = TONE_PATTERNS[tone];

  for (const note of notes) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.hz, now + note.start);
    // Envelope: fast attack, exponential decay. Final value can't be zero
    // for `exponentialRampToValueAtTime`, so we use a tiny floor.
    gain.gain.setValueAtTime(0.00001, now + note.start);
    gain.gain.exponentialRampToValueAtTime(0.18 * note.gain, now + note.start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + note.start + note.dur);

    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now + note.start);
    osc.stop(now + note.start + note.dur + 0.02);
  }
}

const TONE_PATTERNS: Record<Tone, { hz: number; start: number; dur: number; gain: number }[]> = {
  success: [
    { hz: 720,  start: 0,    dur: 0.22, gain: 1.0 },
    { hz: 1080, start: 0.07, dur: 0.20, gain: 0.85 }
  ],
  tap: [
    { hz: 980,  start: 0, dur: 0.08, gain: 0.6 }
  ],
  error: [
    { hz: 320,  start: 0,    dur: 0.18, gain: 1.0 },
    { hz: 280,  start: 0.10, dur: 0.22, gain: 0.9 }
  ]
};
