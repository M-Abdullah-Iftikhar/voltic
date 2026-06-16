/**
 * Thin shim over the Web Vibration API. All calls are no-ops when:
 *   - Server side (no `navigator`)
 *   - Browser doesn't expose `navigator.vibrate` (Safari, most desktops)
 *   - User has expressed a reduced-motion preference (we extend reduced
 *     motion to mean "reduced sensory feedback in general")
 *
 * Pattern presets keep the call site short and consistent. If you reach
 * for a longer custom pattern, pass it directly to `vibrate()`.
 */

export type HapticKind = 'tap' | 'success' | 'warning' | 'error';

const PATTERNS: Record<HapticKind, number | number[]> = {
  tap:     10,
  success: [10, 40, 10],
  warning: [16, 32, 16],
  error:   [24, 28, 24, 28, 24]
};

function canVibrate(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (typeof navigator.vibrate !== 'function') return false;
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  } catch { /* no matchMedia — fine, fall through */ }
  return true;
}

/** Play a preset haptic. Safe to call from anywhere, including SSR. */
export function haptic(kind: HapticKind): void {
  if (!canVibrate()) return;
  try { navigator.vibrate(PATTERNS[kind]); } catch { /* ignore */ }
}

/** Pass a raw pattern for one-off uses. */
export function vibrate(pattern: number | number[]): void {
  if (!canVibrate()) return;
  try { navigator.vibrate(pattern); } catch { /* ignore */ }
}
