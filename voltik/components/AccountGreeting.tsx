'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Avatar } from './Avatar';
import type { PublicUser } from '@/lib/types';

interface GreetingProps {
  user: PublicUser;
  orderCount: number;
  reviewCount: number;
  favoriteCount: number;
}

/** Hero band for the account overview — time-of-day greeting + completion
 *  ring + warm welcome. Renders to a sensible SSR default (no time-of-day
 *  guess) and upgrades on mount once the client clock is known. */
export function AccountGreeting({ user, orderCount, reviewCount, favoriteCount }: GreetingProps) {
  const [tod, setTod] = useState<'morning' | 'afternoon' | 'evening' | 'night' | null>(null);

  useEffect(() => {
    const h = new Date().getHours();
    setTod(h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 22 ? 'evening' : 'night');
  }, []);

  const greeting = tod === 'morning'   ? 'Good morning'
                 : tod === 'afternoon' ? 'Good afternoon'
                 : tod === 'evening'   ? 'Good evening'
                 : tod === 'night'     ? 'Burning the midnight oil'
                 : 'Welcome back';

  const sparkle = tod === 'evening' || tod === 'night' ? '🌙' : tod === 'morning' ? '☀️' : '✨';

  // Profile completion: 25% per filled section.
  const checks: { label: string; done: boolean; hint?: string; href?: string }[] = [
    { label: 'Account created',  done: true },
    { label: 'Made an order',    done: orderCount > 0,     hint: 'Place your first order',  href: '/shop' },
    { label: 'Saved a favourite', done: favoriteCount > 0, hint: 'Tap any heart on the shop', href: '/shop' },
    { label: 'Written a review', done: reviewCount > 0,    hint: 'Reviews help fellow shoppers', href: '/account/orders' }
  ];
  const completed = checks.filter(c => c.done).length;
  const pct = Math.round((completed / checks.length) * 100);
  const nextTask = checks.find(c => !c.done);

  return (
    <div className="card p-6 sm:p-7 overflow-hidden relative">
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
      <div className="relative flex items-start gap-5 flex-wrap">
        <Avatar name={user.name} seed={user.email} size={64} className="text-xl" />
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-[0.18em] font-semibold text-brand">
            {greeting} {sparkle}
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl mt-1 leading-tight">
            {user.name.split(' ')[0]}, welcome back.
          </h2>
          <p className="text-muted text-sm mt-1">
            {pct === 100
              ? 'Your profile is complete — thanks for being part of Voltik.'
              : nextTask
                ? <>You're <span className="text-ink font-semibold">{pct}%</span> there. Next up: <span className="text-ink">{nextTask.hint}</span>.</>
                : null}
          </p>
        </div>

        {/* Completion ring */}
        <ProgressRing percent={pct} />
      </div>

      {/* Checklist */}
      <div className="mt-5 grid sm:grid-cols-2 gap-2">
        {checks.map(c => (
          <ChecklistItem key={c.label} {...c} />
        ))}
      </div>
    </div>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const size = 96;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id="progress-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="rgb(var(--brand))" />
            <stop offset="100%" stopColor="rgb(var(--brand2))" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="rgb(var(--line))" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="url(#progress-grad)"
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          style={{ transition: 'stroke-dasharray 900ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display font-bold text-xl leading-none">{percent}%</div>
          <div className="text-[10px] uppercase tracking-wide text-muted mt-0.5">profile</div>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ label, done, href }: { label: string; done: boolean; href?: string }) {
  const inner = (
    <span className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition ${done ? 'bg-success/10 text-success' : 'bg-elev text-muted hover:text-ink'}`}>
      <span className={`grid place-items-center h-5 w-5 rounded-full shrink-0 ${done ? 'bg-success text-white' : 'border-2 border-line'}`}>
        {done && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12l5 5L20 6"/>
          </svg>
        )}
      </span>
      <span className="line-clamp-1">{label}</span>
    </span>
  );
  return href && !done ? <Link href={href}>{inner}</Link> : inner;
}
