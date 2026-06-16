import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from './Icons';

type Kind = 'cart' | 'favorites' | 'orders' | 'reviews' | 'search' | 'notfound' | 'inbox';

interface EmptyStateProps {
  kind?: Kind;
  title: string;
  body?: ReactNode;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}

/** Consistent empty / null state used across the storefront and admin.
 *  One layout, swap the illustration via `kind`. */
export function EmptyState({ kind = 'inbox', title, body, primary, secondary }: EmptyStateProps) {
  return (
    <div className="card p-10 sm:p-14 text-center">
      <div className="mx-auto w-32 h-32 sm:w-40 sm:h-40">
        <Illustration kind={kind} />
      </div>
      <h2 className="font-display font-bold text-2xl mt-6">{title}</h2>
      {body && <div className="text-sm text-muted mt-2 max-w-md mx-auto leading-relaxed">{body}</div>}
      {(primary || secondary) && (
        <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
          {secondary && (
            <Link href={secondary.href} className="btn-ghost">{secondary.label}</Link>
          )}
          {primary && (
            <Link href={primary.href} className="btn-primary">
              {primary.label} <Icon.arrow width={14} height={14} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Inline SVG illustrations ──────────────────────────────────────
   Single neutral palette matching the silver site language. */

function Illustration({ kind }: { kind: Kind }) {
  switch (kind) {
    case 'cart':      return <CartArt />;
    case 'favorites': return <HeartArt />;
    case 'orders':    return <BoxArt />;
    case 'reviews':   return <StarArt />;
    case 'search':    return <SearchArt />;
    case 'notfound':  return <NotFoundArt />;
    default:          return <InboxArt />;
  }
}

const COMMON = {
  stroke: 'rgb(var(--muted))',
  fill:   'rgb(var(--illus-from))',
  accent: 'rgb(var(--brand))'
};

function CartArt() {
  return (
    <svg viewBox="0 0 160 160" className="w-full h-full">
      <defs>
        <linearGradient id="cart-g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--illus-from))" />
          <stop offset="100%" stopColor="rgb(var(--illus-to))" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="138" rx="55" ry="6" fill="rgb(var(--ink))" opacity="0.06" />
      <path d="M28 40 H44 L58 100 H120 L130 60 H55" fill="none" stroke={COMMON.stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="60" y="64" width="65" height="32" rx="6" fill="url(#cart-g)" stroke={COMMON.stroke} strokeWidth="1.6" />
      <circle cx="68" cy="118" r="8" fill="rgb(var(--surface))" stroke={COMMON.stroke} strokeWidth="3" />
      <circle cx="112" cy="118" r="8" fill="rgb(var(--surface))" stroke={COMMON.stroke} strokeWidth="3" />
      <path d="M88 22 L92 16 M104 26 L112 22 M76 26 L70 22" stroke={COMMON.accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function HeartArt() {
  return (
    <svg viewBox="0 0 160 160" className="w-full h-full">
      <defs>
        <linearGradient id="heart-g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--illus-from))" />
          <stop offset="100%" stopColor="rgb(var(--illus-to))" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="138" rx="50" ry="6" fill="rgb(var(--ink))" opacity="0.06" />
      <path
        d="M80 130s-44-26-50-58a26 26 0 0150-12 26 26 0 0150 12c-6 32-50 58-50 58z"
        fill="url(#heart-g)" stroke={COMMON.stroke} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="42" cy="38" r="3" fill={COMMON.accent} opacity="0.6" />
      <circle cx="120" cy="34" r="2.5" fill={COMMON.accent} opacity="0.5" />
      <path d="M68 80 l8 8 16 -18" stroke={COMMON.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
    </svg>
  );
}

function BoxArt() {
  return (
    <svg viewBox="0 0 160 160" className="w-full h-full">
      <defs>
        <linearGradient id="box-g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--illus-from))" />
          <stop offset="100%" stopColor="rgb(var(--illus-to))" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="138" rx="55" ry="6" fill="rgb(var(--ink))" opacity="0.06" />
      <path d="M30 60 L80 38 L130 60 L80 82 Z" fill="url(#box-g)" stroke={COMMON.stroke} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M30 60 V108 L80 130 V82" fill="url(#box-g)" stroke={COMMON.stroke} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M130 60 V108 L80 130" fill="rgb(var(--illus-to))" stroke={COMMON.stroke} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M55 49 L105 71" stroke={COMMON.stroke} strokeWidth="2" strokeDasharray="3 3" opacity="0.5" />
      <circle cx="80" cy="60" r="3" fill={COMMON.accent} opacity="0.8" />
    </svg>
  );
}

function StarArt() {
  return (
    <svg viewBox="0 0 160 160" className="w-full h-full">
      <ellipse cx="80" cy="138" rx="50" ry="6" fill="rgb(var(--ink))" opacity="0.06" />
      <path
        d="M80 24 l16 36 38 4 -28 26 8 38 -34 -20 -34 20 8 -38 -28 -26 38 -4z"
        fill="rgb(var(--illus-from))" stroke={COMMON.stroke} strokeWidth="3" strokeLinejoin="round" />
      <path d="M48 90 L40 96 M120 90 L128 96 M80 18 L80 8" stroke={COMMON.accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function SearchArt() {
  return (
    <svg viewBox="0 0 160 160" className="w-full h-full">
      <ellipse cx="80" cy="138" rx="50" ry="6" fill="rgb(var(--ink))" opacity="0.06" />
      <circle cx="70" cy="68" r="34" fill="rgb(var(--illus-from))" stroke={COMMON.stroke} strokeWidth="4" />
      <path d="M96 94 L124 122" stroke={COMMON.stroke} strokeWidth="5" strokeLinecap="round" />
      <path d="M58 56 a18 18 0 0124 0" stroke={COMMON.accent} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.55" />
    </svg>
  );
}

function NotFoundArt() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <text x="100" y="120" textAnchor="middle"
        style={{ fontFamily: '"Space Grotesk", Inter, sans-serif', fontWeight: 700, fontSize: 110 }}
        fill="url(#nf-g)">404</text>
      <defs>
        <linearGradient id="nf-g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%"  stopColor="rgb(var(--brand))" />
          <stop offset="100%" stopColor="rgb(var(--brand2))" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function InboxArt() {
  return (
    <svg viewBox="0 0 160 160" className="w-full h-full">
      <ellipse cx="80" cy="138" rx="50" ry="6" fill="rgb(var(--ink))" opacity="0.06" />
      <rect x="32" y="60" width="96" height="56" rx="8" fill="rgb(var(--illus-from))" stroke={COMMON.stroke} strokeWidth="3" />
      <path d="M32 60 L80 94 L128 60" fill="none" stroke={COMMON.stroke} strokeWidth="3" strokeLinejoin="round" />
      <path d="M52 44 L52 60 M108 44 L108 60" stroke={COMMON.accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}
