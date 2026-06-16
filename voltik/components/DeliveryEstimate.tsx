'use client';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';

interface Props {
  /** lo-hi days from today. Defaults to standard 3-5 day shipping. */
  earliestDays?: number;
  latestDays?: number;
  /** Variant: pill (inline, compact) or card (full-width block). */
  variant?: 'pill' | 'card';
}

/**
 * Friendly delivery-date pill. Renders nothing on first paint to avoid a
 * locale-sensitive SSR/client mismatch, then formats the dates with the
 * user's locale once hydrated.
 */
export function DeliveryEstimate({
  earliestDays = 3, latestDays = 5, variant = 'pill'
}: Props) {
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    const now = Date.now();
    const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const from = new Date(now + earliestDays * 86_400_000);
    const to   = new Date(now + latestDays   * 86_400_000);
    // Same month? compact form: "Mon Jun 17 - Wed Jun 19" → "Mon-Wed, Jun 17-19"
    if (from.getMonth() === to.getMonth()) {
      const wkdy = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
      const mday = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
      setRange({
        from: `${wkdy.format(from)}, ${mday.format(from)}`,
        to:   `${wkdy.format(to)} ${to.getDate()}`
      });
    } else {
      setRange({ from: fmt.format(from), to: fmt.format(to) });
    }
  }, [earliestDays, latestDays]);

  if (!range) return null;

  if (variant === 'card') {
    return (
      <div className="card p-3.5 flex items-center gap-3">
        <span className="grid place-items-center h-9 w-9 rounded-full bg-success/15 text-success shrink-0">
          <Icon.truck width={16} height={16} />
        </span>
        <div>
          <div className="text-xs font-semibold text-ink">Free delivery</div>
          <div className="text-[11px] text-muted">Arrives <span className="text-ink font-semibold">{range.from} – {range.to}</span></div>
        </div>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
      <Icon.truck width={12} height={12} className="text-success" />
      Arrives <span className="text-ink font-semibold">{range.from} – {range.to}</span>
    </span>
  );
}
