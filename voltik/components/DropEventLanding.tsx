'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import { haptic } from '@/lib/haptics';
import type { EnrichedProduct } from '@/lib/types';

interface Props {
  /** The hero product about to drop. We render its illustration + name. */
  product: EnrichedProduct;
  /** When the drop goes live (UTC ISO string). Drives the live countdown. */
  dropAt: string;
}

const RESERVATION_KEY = 'voltik:drop-reserve';
const HYPE_KEY        = 'voltik:drop-hype';

/**
 * Standalone "drop event" landing page — Supreme-style hype with a
 * live countdown, a reservation queue you can join with an email, and
 * a faux ticker of recent reservation activity. The reservation row
 * lives in localStorage so the demo is self-contained; swap the
 * `submit` handler to POST to a real waiting-list endpoint when one
 * lands.
 */
export function DropEventLanding({ product, dropAt }: Props) {
  const target = useMemo(() => new Date(dropAt).getTime(), [dropAt]);
  const [now, setNow] = useState<number | null>(null);
  const [reserved, setReserved] = useState(false);
  const [reservationCount, setReservationCount] = useState<number>(0);
  const [emailValue, setEmailValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reduced, setReduced] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Hydrate reservation state + spin up the per-second tick.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 1000);

    setReserved(window.localStorage.getItem(RESERVATION_KEY) === '1');
    // The hype count is a sticky, slowly-incrementing number so the page
    // doesn't reset to zero when you bounce away and come back.
    const raw = window.localStorage.getItem(HYPE_KEY);
    const seed = raw ? parseInt(raw, 10) : 1247 + Math.floor(Math.random() * 200);
    setReservationCount(seed);
    window.localStorage.setItem(HYPE_KEY, String(seed));

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onMq = () => setReduced(mq.matches);
    mq.addEventListener('change', onMq);

    return () => { clearInterval(tick); mq.removeEventListener('change', onMq); };
  }, []);

  // Bump the hype counter every 7-15s so the page feels alive.
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      setReservationCount(n => {
        const next = n + 1 + Math.floor(Math.random() * 2);
        if (typeof window !== 'undefined') window.localStorage.setItem(HYPE_KEY, String(next));
        return next;
      });
    }, 7000 + Math.random() * 8000);
    return () => clearInterval(t);
  }, [reduced]);

  const remaining = now == null ? null : Math.max(0, target - now);
  const liveSoon = remaining !== null && remaining < 60 * 60 * 1000;
  const isLive = remaining === 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValue.includes('@')) return;
    setSubmitting(true);
    try {
      // Reuse the existing newsletter endpoint so the reservation surfaces
      // in the admin subscriber console. Source distinguishes it from
      // newsletter sign-ups.
      await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue.trim(), source: 'drop-event' })
      }).catch(() => null);
      window.localStorage.setItem(RESERVATION_KEY, '1');
      setReserved(true);
      setReservationCount(n => n + 1);
      haptic('success');
    } finally {
      setSubmitting(false);
    }
  };

  // The faux ticker just spins a deterministic mix of city + name pairs.
  const tickerItems = useMemo(() => buildTicker(reservationCount), [reservationCount]);

  return (
    <section className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      {/* Animated background — a slowly-rotating mesh halo so the page
          reads as an event surface, not a regular product card. */}
      <div aria-hidden className={`absolute inset-0 ${reduced ? '' : 'animate-spin-slow'}`} style={{
        background:
          'radial-gradient(40% 60% at 20% 30%, rgb(var(--brand) / 0.25), transparent 60%),' +
          'radial-gradient(50% 60% at 80% 70%, rgb(var(--accent) / 0.22), transparent 60%),' +
          'radial-gradient(40% 50% at 50% 90%, rgb(var(--accent2) / 0.2), transparent 60%)'
      }} />
      <div aria-hidden className="absolute inset-0 bg-bg/40 backdrop-blur-3xl" />

      <div className="container-x relative py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className={`chip ${isLive ? 'bg-success text-bg' : liveSoon ? 'bg-accent2 text-bg animate-pulse' : 'bg-brand/10 text-brand'} text-[10px] uppercase tracking-[0.18em]`}>
            {isLive ? 'Live now' : liveSoon ? 'Going live soon' : 'Voltik drop'}
          </span>
          <h1 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl mt-4 leading-[1.05] break-words">
            <span className="block text-muted text-base sm:text-xl tracking-wide uppercase font-semibold">Limited release</span>
            <span className="bg-gradient-to-r from-brand via-brand2 to-accent2 bg-clip-text text-transparent">{product.name}</span>
          </h1>
          <p className="text-muted mt-4 max-w-md mx-auto">
            One drop. One window. Reserve your spot in the queue and we'll text you the moment it's live.
          </p>
        </div>

        {/* Countdown */}
        <div className="mt-10 flex justify-center">
          <Countdown remaining={remaining} live={isLive} />
        </div>

        {/* Hero product card */}
        <div className="mt-12 mx-auto max-w-md card p-6 relative">
          <ProductIllustration category={product.category} icon={product.icon} className="aspect-square rounded-2xl" size={140} />
          <div className="mt-4 text-center">
            <div className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">{product.brand}</div>
            <div className="font-display font-bold text-2xl mt-1">{product.name}</div>
            <p className="text-sm text-muted mt-2 line-clamp-2">{product.description}</p>
            <div className="mt-4 inline-flex items-baseline gap-2">
              <span className="text-3xl font-bold gradient-text">${product.price.toFixed(2)}</span>
              {product.oldPrice && <span className="text-muted line-through text-sm">${product.oldPrice.toFixed(2)}</span>}
            </div>
          </div>
        </div>

        {/* Reservation form */}
        <div className="mt-8 max-w-md mx-auto card p-6">
          {reserved ? (
            <div className="text-center">
              <span className="grid place-items-center h-12 w-12 mx-auto rounded-full bg-success/15 text-success">
                <Icon.check width={22} height={22} />
              </span>
              <h3 className="font-display font-bold text-xl mt-3">You're in the queue.</h3>
              <p className="text-sm text-muted mt-1.5">
                Position <span className="font-mono text-ink font-semibold">#{reservationCount.toLocaleString()}</span>. We'll email + text when the drop opens.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <Link href="/shop" className="btn-ghost text-sm">Browse the rest</Link>
                <button
                  onClick={() => { window.localStorage.removeItem(RESERVATION_KEY); setReserved(false); }}
                  className="text-xs text-muted hover:text-ink"
                >
                  Leave the queue
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">Reserve your spot</div>
              <div className="flex items-center gap-2 rounded-full border border-line bg-bg px-4 py-2.5 focus-within:border-brand transition">
                <Icon.user width={14} height={14} className="text-muted" />
                <input
                  type="email"
                  required
                  value={emailValue}
                  onChange={e => setEmailValue(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted"
                  suppressHydrationWarning
                />
                <button
                  type="submit"
                  disabled={submitting || !emailValue.includes('@')}
                  className="btn-primary !py-1.5 !px-3 text-xs disabled:opacity-50"
                >
                  {submitting ? 'Holding…' : 'Hold my spot'}
                </button>
              </div>
              <p className="text-[11px] text-muted">
                <span className="font-semibold text-ink">{reservationCount.toLocaleString()}</span> people are already waiting. No spam — just the drop alert.
              </p>
            </form>
          )}
        </div>

        {/* Activity ticker */}
        <div className="mt-10 max-w-md mx-auto">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted font-semibold mb-2 text-center">Recent reservations</div>
          <div ref={tickerRef} className="card p-2 max-h-32 overflow-hidden relative">
            <div className={`space-y-1 ${reduced ? '' : 'animate-marquee-vertical'}`}>
              {[...tickerItems, ...tickerItems].map((t, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-elev/50 transition">
                  <span className="grid place-items-center h-6 w-6 rounded-full bg-brand/15 text-brand text-[10px] font-bold">
                    {t.name[0]}
                  </span>
                  <span className="text-xs flex-1 min-w-0 truncate">
                    <span className="text-ink font-semibold">{t.name}</span>
                    <span className="text-muted"> from {t.city}</span>
                  </span>
                  <span className="text-[10px] text-muted">{t.ago}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Countdown({ remaining, live }: { remaining: number | null; live: boolean }) {
  if (remaining == null) {
    return <div className="h-[88px]" aria-hidden />;
  }
  if (live) {
    return (
      <div className="text-center">
        <div className="font-display text-4xl sm:text-6xl font-bold gradient-text">It's live.</div>
        <Link href="/shop" className="btn-primary mt-5 inline-flex">
          Go to the shelf <Icon.arrow width={12} height={12} />
        </Link>
      </div>
    );
  }
  const days    = Math.floor(remaining / 86_400_000);
  const hours   = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);

  const cells: { label: string; value: number }[] = [
    { label: 'days',    value: days },
    { label: 'hours',   value: hours },
    { label: 'minutes', value: minutes },
    { label: 'seconds', value: seconds }
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-xl">
      {cells.map(c => (
        <div key={c.label} className="card p-3 sm:p-4 text-center">
          <div className="font-display font-bold text-3xl sm:text-5xl gradient-text tabular-nums">
            {String(c.value).padStart(2, '0')}
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted mt-1 font-semibold">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

const NAMES  = ['Alex', 'Maya', 'Jordan', 'Priya', 'Kenji', 'Noor', 'Sam', 'Lena', 'Toby', 'Ava', 'Rohan', 'Mira'];
const CITIES = ['Berlin', 'Singapore', 'Lagos', 'Mumbai', 'Mexico City', 'Toronto', 'Paris', 'Tokyo', 'São Paulo', 'Cape Town', 'Karachi', 'Seoul'];

function buildTicker(seed: number): Array<{ name: string; city: string; ago: string }> {
  return Array.from({ length: 8 }, (_, i) => ({
    name: NAMES[(seed + i * 3) % NAMES.length],
    city: CITIES[(seed + i * 7) % CITIES.length],
    ago: `${(i % 6) + 1}m ago`
  }));
}
