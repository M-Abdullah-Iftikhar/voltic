interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
  /** Optional uniqueness key — defaults to name. Use email to keep colour
   *  stable even when a user updates their display name. */
  seed?: string;
}

/** Per-user gradient + initials avatar. The colour pair is picked
 *  deterministically from a hashed seed so the same user always gets
 *  the same gradient across pages. */
export function Avatar({ name, size = 36, className = '', seed }: AvatarProps) {
  const initials = (name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map(s => s[0])
    .join('')
    .toUpperCase();

  const palette = PALETTES[hashIndex(seed || name, PALETTES.length)];

  return (
    <span
      className={`grid place-items-center rounded-full text-white font-bold shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, size * 0.4),
        background: palette
      }}
      aria-label={name}
    >
      {initials}
    </span>
  );
}

/** Quick string → bucket. Stable across reloads, server + client. */
function hashIndex(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % mod;
}

/** Eight on-brand palettes — all balanced against silver cards in
 *  both themes. Avoid hue extremes that clash with the brand identity. */
const PALETTES = [
  'linear-gradient(135deg,#0ea5e9,#7c3aed)',   // brand classic — cyan → violet
  'linear-gradient(135deg,#06b6d4,#3b82f6)',   // cyan-blue
  'linear-gradient(135deg,#7c3aed,#ec4899)',   // violet-pink
  'linear-gradient(135deg,#10b981,#22d3ee)',   // mint-cyan
  'linear-gradient(135deg,#f59e0b,#ef4444)',   // amber-red (warm)
  'linear-gradient(135deg,#0ea5e9,#10b981)',   // cyan-mint
  'linear-gradient(135deg,#8b5cf6,#0ea5e9)',   // purple-sky
  'linear-gradient(135deg,#f97316,#ec4899)'    // orange-magenta
];
