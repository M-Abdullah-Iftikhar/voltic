import { Icon, type IconKey } from './Icons';

interface Props {
  /** kept for API back-compat; no longer affects the visual */
  category?: string;
  icon: string;
  size?: number;
  rounded?: string;
  className?: string;
}

/**
 * Product visual.
 * One neutral surface for every product, everywhere on the site —
 * no per-category color bombs. Icon is shown in a muted tone so it
 * reads as a clean wireframe rather than a flashy badge.
 *
 * Styling lives in `.illus` (see globals.css) so changing the palette
 * site-wide is a single CSS edit.
 */
export function ProductIllustration({
  icon,
  size = 96,
  rounded = 'rounded-2xl',
  className = ''
}: Props) {
  const Glyph = Icon[(icon as IconKey)] || Icon.box;
  return (
    <div className={`illus ${rounded} flex items-center justify-center ${className}`}>
      <Glyph width={size} height={size} strokeWidth={1.25} />
    </div>
  );
}
