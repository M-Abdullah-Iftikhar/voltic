import { Icon, type IconKey } from './Icons';

interface Stat {
  icon: IconKey;
  label: string;
  value: string;
  sub: string;
  tone: 'brand' | 'success' | 'warn' | 'accent';
}

interface Props {
  /** Total dollars saved vs `oldPrice` across delivered + shipped + processing orders. */
  saved: number;
  /** Upvotes received on this user's reviews. */
  helpfulVotes: number;
  /** How many products this user has reviewed at least once. */
  reviewedProducts: number;
  /** ISO date or formatted label of when the user joined. */
  memberSince: string;
}

/**
 * "Your impact" — a feel-good roll-up that gives signed-in shoppers a
 * sense of contribution back to the storefront. Pure presentational
 * component; the calculations happen in the parent server page so we
 * can read the raw order + review data once.
 */
export function TotalImpactWidget({ saved, helpfulVotes, reviewedProducts, memberSince }: Props) {
  // Don't bother showing if there's nothing positive to say yet.
  if (saved === 0 && helpfulVotes === 0 && reviewedProducts === 0) return null;

  const stats: Stat[] = [
    {
      icon: 'bolt',
      label: 'Saved with deals',
      value: `$${saved.toFixed(0)}`,
      sub: saved > 0 ? 'vs. original pricing' : 'No discounts taken yet',
      tone: 'success'
    },
    {
      icon: 'heart',
      label: 'Upvotes earned',
      value: helpfulVotes.toLocaleString(),
      sub: helpfulVotes > 0 ? `${helpfulVotes === 1 ? 'shopper' : 'shoppers'} found your reviews helpful` : 'Write a review to start',
      tone: 'brand'
    },
    {
      icon: 'star',
      label: 'Products reviewed',
      value: reviewedProducts.toLocaleString(),
      sub: reviewedProducts > 0 ? 'Helping the next shopper decide' : 'Your turn — review one',
      tone: 'warn'
    }
  ];

  return (
    <section
      className="relative card p-5 sm:p-6 overflow-hidden"
      aria-label="Your impact on the Voltik community"
    >
      {/* Decorative gradient mesh */}
      <div
        aria-hidden
        className="absolute -top-10 -right-10 h-48 w-48 rounded-full pointer-events-none opacity-50"
        style={{ background: 'radial-gradient(circle, rgb(var(--brand) / 0.35), transparent 65%)' }}
      />
      <div
        aria-hidden
        className="absolute -bottom-12 -left-10 h-48 w-48 rounded-full pointer-events-none opacity-50"
        style={{ background: 'radial-gradient(circle, rgb(var(--accent2) / 0.3), transparent 65%)' }}
      />

      <div className="relative flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">Your impact</div>
          <h3 className="font-display font-bold text-xl text-ink mt-1">
            What you've contributed to Voltik
          </h3>
          <p className="text-xs text-muted mt-1">Member since {memberSince}.</p>
        </div>
      </div>

      <div className="relative grid sm:grid-cols-3 gap-3">
        {stats.map(s => {
          const Glyph = Icon[s.icon];
          return (
            <div key={s.label} className="rounded-2xl bg-bg/60 backdrop-blur-sm border border-line/70 p-4 flex items-start gap-3">
              <span className={`grid place-items-center h-9 w-9 rounded-xl shrink-0 ${TONE_BG[s.tone]} ${TONE_FG[s.tone]}`}>
                <Glyph width={15} height={15} />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted font-semibold">{s.label}</div>
                <div className="font-display font-bold text-xl text-ink mt-0.5">{s.value}</div>
                <div className="text-[11px] text-muted mt-0.5 line-clamp-2">{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const TONE_BG: Record<Stat['tone'], string> = {
  brand:   'bg-brand/12',
  success: 'bg-success/12',
  warn:    'bg-warn/12',
  accent:  'bg-accent2/15'
};
const TONE_FG: Record<Stat['tone'], string> = {
  brand:   'text-brand',
  success: 'text-success',
  warn:    'text-warn',
  accent:  'text-accent2'
};
