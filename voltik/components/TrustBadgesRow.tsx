import Link from 'next/link';
import { Icon, type IconKey } from './Icons';

interface Badge {
  icon: IconKey;
  /** Headline rendered on one line. */
  title: string;
  /** Sub-line; describes what the badge guarantees. */
  sub: string;
  /** Where the badge links to so users can read the fine print. */
  href: string;
}

const DEFAULTS: Badge[] = [
  { icon: 'truck',   title: 'Free shipping', sub: 'On orders over $50', href: '/shipping' },
  { icon: 'refresh', title: '30-day returns', sub: 'No questions asked', href: '/returns' },
  { icon: 'shield',  title: '2-year warranty', sub: 'Replacement, not repair', href: '/warranty' }
];

/**
 * Trust badges that sit directly under the Add-to-cart panel on product
 * detail pages. Three at-a-glance commitments that link to the fine
 * print so curious buyers can read more without abandoning the page.
 *
 * Designed compact enough to fit between the CTA and the bundle
 * suggestion without crowding either.
 */
export function TrustBadgesRow({ badges = DEFAULTS }: { badges?: Badge[] }) {
  return (
    <ul className="mt-4 grid grid-cols-3 gap-2" aria-label="Voltik commitments">
      {badges.map(b => {
        const Glyph = Icon[b.icon];
        return (
          <li key={b.title}>
            <Link
              href={b.href}
              className="group block h-full rounded-xl border border-line/70 bg-surface px-3 py-2.5 sm:px-3.5 sm:py-3 hover:border-brand/40 hover:bg-elev/60 transition"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="grid place-items-center h-7 w-7 rounded-lg shrink-0 transition"
                  style={{ background: 'linear-gradient(135deg,rgb(var(--brand)/0.18),rgb(var(--brand2)/0.18))', color: 'rgb(var(--brand))' }}
                >
                  <Glyph width={13} height={13} />
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-ink leading-tight">
                  {b.title}
                </span>
              </div>
              <span className="block text-[10px] sm:text-[11px] text-muted mt-1 line-clamp-1">{b.sub}</span>
              <span className="block text-[10px] text-brand opacity-0 group-hover:opacity-100 transition mt-0.5">
                Read details →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
