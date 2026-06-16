'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconKey } from './Icons';
import { useCart } from './CartContext';
import { useFavorites } from './FavoritesContext';

type Tab = { href: string; label: string; icon: IconKey; matchPrefix?: string };

const TABS: Tab[] = [
  { href: '/',          label: 'Home',      icon: 'bolt' },
  { href: '/shop',      label: 'Shop',      icon: 'box',  matchPrefix: '/shop' },
  { href: '/favorites', label: 'Favorites', icon: 'heart',matchPrefix: '/favorites' },
  { href: '/cart',      label: 'Cart',      icon: 'cart', matchPrefix: '/cart' },
  { href: '/account',   label: 'Account',   icon: 'user', matchPrefix: '/account' }
];

/**
 * Sticky bottom dock for mobile (< sm). Hidden on tablet+desktop where the
 * top navbar handles everything. Adds 64px of bottom space at the bottom of
 * <body> via padding so nothing hides behind it.
 */
export function MobileNavBar() {
  const path = usePathname() || '';
  const { count: cartCount } = useCart();
  const { count: favCount } = useFavorites();

  // Hide on admin + auth pages where the dock would be visual noise.
  if (path.startsWith('/admin') || path === '/login' || path === '/signup') return null;

  const isActive = (t: Tab) =>
    t.href === '/' ? path === '/' : path === t.href || (t.matchPrefix && path.startsWith(t.matchPrefix));

  return (
    <>
      {/* Spacer so page content doesn't sit under the dock */}
      <div aria-hidden className="h-20 sm:hidden" />

      <nav
        className="sm:hidden fixed bottom-3 left-3 right-3 z-40 glass rounded-2xl shadow-card border border-line"
        aria-label="Primary"
      >
        <ul className="grid grid-cols-5">
          {TABS.map(t => {
            const Glyph = Icon[t.icon];
            const active = isActive(t);
            const badge = t.href === '/cart'      ? cartCount
                        : t.href === '/favorites' ? favCount
                        : 0;
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold tracking-wide transition ${active ? 'text-brand' : 'text-muted hover:text-ink'}`}
                >
                  <span className="relative">
                    <Glyph width={20} height={20} />
                    {badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-brand text-white text-[9px] font-bold">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </span>
                  <span>{t.label}</span>
                  {active && (
                    <span aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-brand" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
