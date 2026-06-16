'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';

type Crumb = { label: string; href?: string };

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  crumbs?: Crumb[];
  primary?: { label: string; href?: string; onClick?: () => void; icon?: keyof typeof Icon };
  secondary?: { label: string; href?: string; onClick?: () => void; icon?: keyof typeof Icon };
}

/**
 * Sticky admin page header — turns compact when the user scrolls, keeping
 * the page title + primary action in view without occupying the full
 * page-load height. Slots into every /admin/* page.
 */
export function AdminPageHeader({ title, subtitle, crumbs, primary, secondary }: AdminPageHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-14 z-20 -mx-6 sm:-mx-8 px-6 sm:px-8 transition-all ${scrolled ? 'glass border-b border-line shadow-soft py-3' : 'bg-transparent py-1'} mb-6`}
    >
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          {crumbs && crumbs.length > 0 && (
            <nav className="text-xs text-muted flex items-center gap-1.5 flex-wrap mb-1">
              <Link href="/admin" className="hover:text-ink">Admin</Link>
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <Icon.arrow width={10} height={10} className="opacity-60" />
                  {c.href && i < crumbs.length - 1
                    ? <Link href={c.href} className="hover:text-ink">{c.label}</Link>
                    : <span className="text-ink font-semibold">{c.label}</span>}
                </span>
              ))}
            </nav>
          )}
          <h1 className={`font-display font-bold leading-tight transition-all ${scrolled ? 'text-xl sm:text-2xl' : 'text-3xl sm:text-4xl'}`}>
            {title}
          </h1>
          {subtitle && !scrolled && (
            <p className="text-muted text-sm mt-1">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {secondary && <Action {...secondary} variant="ghost" />}
          {primary &&   <Action {...primary}   variant="primary" />}
        </div>
      </div>
    </header>
  );
}

function Action(props: {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: keyof typeof Icon;
  variant: 'primary' | 'ghost';
}) {
  const Glyph = props.icon ? Icon[props.icon] : null;
  const cls = `${props.variant === 'primary' ? 'btn-primary' : 'btn-ghost'} text-xs`;
  const inner = <>{Glyph && <Glyph width={14} height={14} />}{props.label}</>;
  return props.href
    ? <Link href={props.href} className={cls}>{inner}</Link>
    : <button onClick={props.onClick} className={cls}>{inner}</button>;
}
