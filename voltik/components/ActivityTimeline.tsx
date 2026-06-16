import Link from 'next/link';
import { Icon, type IconKey } from './Icons';
import type { Order, Review } from '@/lib/types';

type Event = {
  at: string;          // ISO date
  icon: IconKey;
  tone: string;        // tailwind classes for the icon chip background
  title: React.ReactNode;
  sub?: React.ReactNode;
  href?: string;
};

interface Props {
  orders: Order[];
  reviews: Review[];
  /** Account creation date (ISO). */
  joinedAt: string;
  limit?: number;
}

/**
 * Chronological feed of the user's account activity — orders, reviews,
 * status flips, and the join date as the anchor at the bottom. Pure
 * derivation from the data we already fetch; no extra storage.
 */
export function ActivityTimeline({ orders, reviews, joinedAt, limit = 8 }: Props) {
  const events: Event[] = [];

  for (const o of orders) {
    events.push({
      at: o.date,
      icon: o.status === 'cancelled' ? 'close'
          : o.status === 'delivered' ? 'check'
          : o.status === 'shipped'   ? 'truck'
          : 'list',
      tone: o.status === 'cancelled' ? 'bg-danger/15 text-danger'
          : o.status === 'delivered' ? 'bg-success/15 text-success'
          : o.status === 'shipped'   ? 'bg-brand2/15 text-brand2'
          : 'bg-brand/15 text-brand',
      title: (
        <span>
          Order <span className="font-mono text-ink">{o.id}</span>{' '}
          <span className="text-muted">— {o.status === 'delivered' ? 'delivered' : `placed (${o.status})`}</span>
        </span>
      ),
      sub: <span>{o.items} item{o.items === 1 ? '' : 's'} · ${o.total.toFixed(2)}</span>,
      href: `/account/orders/${encodeURIComponent(o.id)}`
    });
  }

  for (const r of reviews) {
    events.push({
      at: r.createdAt,
      icon: 'star',
      tone: 'bg-warn/15 text-warn',
      title: (
        <span>
          Reviewed <span className="text-ink font-semibold">{r.title}</span>
        </span>
      ),
      sub: <span>{r.rating}★ · "{r.body.slice(0, 80)}{r.body.length > 80 ? '…' : ''}"</span>,
      href: `/product/${r.productId}#reviews`
    });
  }

  // Anchor at the bottom: account creation.
  events.push({
    at: joinedAt,
    icon: 'spark',
    tone: 'bg-brand/15 text-brand',
    title: <span>Joined Voltik</span>,
    sub: <span>Welcome aboard ⚡</span>
  });

  events.sort((a, b) => (a.at < b.at ? 1 : -1));
  const shown = events.slice(0, limit);

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg">Activity timeline</h3>
        <span className="text-xs text-muted">{shown.length} of {events.length}</span>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted text-center py-6">No activity yet.</p>
      ) : (
        <ol className="relative pl-3">
          {/* Vertical rail */}
          <span aria-hidden className="absolute left-4 top-2 bottom-2 w-px bg-line" />

          {shown.map((e, i) => {
            const Glyph = Icon[e.icon];
            const Wrapper: React.ElementType = e.href ? Link : 'div';
            const wrapperProps = e.href ? { href: e.href } : {};
            return (
              <li key={`${e.at}-${i}`} className="relative pl-12 pb-5 last:pb-0">
                {/* Icon badge — the ring extends 4px past w-8 so we need
                    enough left padding (pl-12 = 48px) to keep text clear.
                    `z-10` puts it above the timeline rail. */}
                <span className={`absolute left-0 top-0 z-10 grid place-items-center h-8 w-8 rounded-full ring-4 ring-surface ${e.tone}`}>
                  <Glyph width={14} height={14} />
                </span>
                <Wrapper {...wrapperProps} className={`block ${e.href ? 'group hover:bg-elev/40 -mx-2 px-2 py-1 rounded-lg transition' : ''}`}>
                  <div className="text-sm text-ink leading-snug">
                    {e.title}
                    {e.href && (
                      <Icon.arrow width={10} height={10} className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition" />
                    )}
                  </div>
                  {e.sub && <div className="text-xs text-muted mt-0.5">{e.sub}</div>}
                  <div className="text-[10px] uppercase tracking-wide text-muted/70 mt-1 font-mono">{formatRelative(e.at)}</div>
                </Wrapper>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/** Friendly date difference — "Today", "3 days ago", "May 9". */
function formatRelative(dateStr: string): string {
  const d = new Date(dateStr).getTime();
  if (Number.isNaN(d)) return dateStr;
  const diff = Date.now() - d;
  const days = Math.floor(diff / 86_400_000);
  if (days < 1)   return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)   return `${days} days ago`;
  if (days < 30)  return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? '' : 's'} ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
