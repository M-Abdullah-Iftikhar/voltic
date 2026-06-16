import { Icon, type IconKey } from './Icons';

interface AchievementsProps {
  orders: number;
  reviews: number;
  favorites: number;
  spent: number;
  since: string;     // ISO date
}

type Badge = {
  key: string;
  label: string;
  icon: IconKey;
  unlocked: boolean;
  progress?: { current: number; goal: number };
  description: string;
  /** Tone classes for the unlocked badge surface. */
  tone: string;
};

/** A small achievement / loyalty system. Pure derivation from existing
 *  user stats — no extra DB needed yet. Locked badges still render but
 *  in greyscale with a hint about how to unlock. */
export function Achievements({ orders, reviews, favorites, spent, since }: AchievementsProps) {
  const accountDate = new Date(since);
  const monthsActive = Math.max(0, Math.floor((Date.now() - accountDate.getTime()) / (30 * 86_400_000)));

  const badges: Badge[] = [
    {
      key: 'first-order',
      label: 'First Order',
      icon: 'box',
      unlocked: orders >= 1,
      progress: orders === 0 ? { current: 0, goal: 1 } : undefined,
      description: orders >= 1 ? 'You placed your first Voltik order' : 'Place an order to unlock',
      tone: 'bg-brand/15 text-brand'
    },
    {
      key: 'first-review',
      label: 'Voice of the Community',
      icon: 'star',
      unlocked: reviews >= 1,
      progress: reviews === 0 ? { current: 0, goal: 1 } : undefined,
      description: reviews >= 1 ? `${reviews} review${reviews === 1 ? '' : 's'} written` : 'Write a review to unlock',
      tone: 'bg-warn/15 text-warn'
    },
    {
      key: 'wishlist-champ',
      label: 'Wishlist Champion',
      icon: 'heart',
      unlocked: favorites >= 5,
      progress: favorites < 5 ? { current: favorites, goal: 5 } : undefined,
      description: favorites >= 5 ? `${favorites} products favourited` : `${favorites} / 5 favourites`,
      tone: 'bg-danger/15 text-danger'
    },
    {
      key: 'big-spender',
      label: 'Big Spender',
      icon: 'bolt',
      unlocked: spent >= 500,
      progress: spent < 500 ? { current: Math.floor(spent), goal: 500 } : undefined,
      description: spent >= 500 ? `$${spent.toFixed(0)} all-time spend` : `$${spent.toFixed(0)} / $500 spent`,
      tone: 'bg-brand2/15 text-brand2'
    },
    {
      key: 'loyal-three',
      label: 'Loyal Three',
      icon: 'trending',
      unlocked: orders >= 3,
      progress: orders < 3 ? { current: orders, goal: 3 } : undefined,
      description: orders >= 3 ? `${orders} successful orders` : `${orders} / 3 orders`,
      tone: 'bg-success/15 text-success'
    },
    {
      key: 'voltik-veteran',
      label: 'Voltik Veteran',
      icon: 'shield',
      unlocked: monthsActive >= 6,
      progress: monthsActive < 6 ? { current: monthsActive, goal: 6 } : undefined,
      description: monthsActive >= 6 ? `${monthsActive} months with Voltik` : `${monthsActive} / 6 months active`,
      tone: 'bg-accent/15 text-accent'
    }
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-lg">Achievements</h3>
          <p className="text-xs text-muted">{unlockedCount} of {badges.length} unlocked</p>
        </div>
        <div className="text-2xl">{['🥚','🐣','🐥','🐤','🐦','🦅','⚡'][Math.min(6, unlockedCount)]}</div>
      </div>

      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {badges.map(b => {
          const Glyph = Icon[b.icon];
          return (
            <li
              key={b.key}
              className={`relative p-3 rounded-2xl border transition ${b.unlocked
                ? 'border-line bg-elev/40'
                : 'border-dashed border-line/60 opacity-70'}`}
            >
              <div className={`grid place-items-center h-10 w-10 rounded-full ${b.unlocked ? b.tone : 'bg-elev text-muted'} mb-2`}>
                <Glyph width={18} height={18} />
              </div>
              <div className="text-sm font-semibold text-ink line-clamp-1">{b.label}</div>
              <div className="text-[11px] text-muted mt-0.5 line-clamp-2">{b.description}</div>
              {b.progress && (
                <div className="mt-2 h-1 rounded-full bg-elev overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (b.progress.current / b.progress.goal) * 100)}%`,
                      background: 'linear-gradient(90deg,rgb(var(--brand)),rgb(var(--brand2)))'
                    }}
                  />
                </div>
              )}
              {b.unlocked && (
                <span aria-hidden className="absolute top-2 right-2 text-success">
                  <Icon.check width={14} height={14} />
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
