/**
 * Lightweight client-side log of things the admin recently touched. We
 * write to localStorage so the panel is instant and survives reloads
 * without server work — fine for "what was I just doing" UX, even if
 * the same admin from another device wouldn't see the same list.
 */

export type RecentEditKind =
  | 'product' | 'order' | 'review' | 'promo' | 'category' | 'subscriber';

export interface RecentEdit {
  kind: RecentEditKind;
  /** Human-friendly title rendered as the headline. */
  title: string;
  /** Optional one-line context (sku, status change, etc.). */
  sub?: string;
  /** Where clicking the entry takes the admin back. */
  href: string;
  /** Timestamp the action was committed (ms). */
  at: number;
}

const KEY = 'voltik:admin-recent-edits';
const MAX = 12;

/** Append a new edit to the log. Same href+kind dedupes within 5 min. */
export function recordEdit(edit: Omit<RecentEdit, 'at'>): void {
  if (typeof window === 'undefined') return;
  try {
    const list = readAll();
    const now = Date.now();
    const recentDupe = list.findIndex(e =>
      e.href === edit.href && e.kind === edit.kind && now - e.at < 5 * 60_000);
    if (recentDupe !== -1) list.splice(recentDupe, 1);
    list.unshift({ ...edit, at: now });
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    // Tell any open panels to refresh — we dispatch a small custom event
    // because storage events don't fire in the same tab.
    window.dispatchEvent(new CustomEvent('voltik:recent-edits'));
  } catch { /* swallow */ }
}

export function readAll(): RecentEdit[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentEdit[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearAll(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent('voltik:recent-edits'));
  } catch { /* swallow */ }
}
