'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon, type IconKey } from './Icons';
import { useUser } from './UserContext';
import { useFavorites } from './FavoritesContext';
import { useCart } from './CartContext';
import { Avatar } from './Avatar';

const NAV: { href: string; label: string; icon: IconKey }[] = [
  { href: '/account',           label: 'Overview',  icon: 'dashboard' },
  { href: '/account/orders',    label: 'My Orders', icon: 'list' },
  { href: '/account/reviews',   label: 'My Reviews',icon: 'star' },
  { href: '/account/favorites', label: 'Favorites', icon: 'heart' },
  { href: '/account/profile',   label: 'Profile',   icon: 'cog' }
];

export function AccountSidebar() {
  const path = usePathname() || '';
  const router = useRouter();
  const { user, logout } = useUser();
  const { count: favCount } = useFavorites();
  const { count: cartCount } = useCart();

  const isActive = (href: string) =>
    href === '/account' ? path === '/account' : path === href || path.startsWith(href + '/');

  const doLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <aside className="card p-4 lg:p-5 self-start lg:sticky lg:top-20 space-y-4">
      {/* Identity block */}
      <div className="flex items-center gap-3 pb-4 border-b border-line">
        <Avatar name={user?.name || '?'} seed={user?.email || user?.name || ''} size={48} />
        <div className="min-w-0">
          <div className="font-semibold truncate">{user?.name || 'Account'}</div>
          <div className="text-xs text-muted truncate">{user?.email}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="space-y-1">
        {NAV.map(n => {
          const Glyph = Icon[n.icon];
          const active = isActive(n.href);
          const badge = n.href === '/account/favorites' ? favCount
                      : n.href === '/account'           ? cartCount  // overview shows cart count next to the entry
                      : undefined;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${active ? 'bg-brand/10 text-brand font-semibold' : 'text-muted hover:text-ink hover:bg-elev'}`}
            >
              <Glyph width={16} height={16} />
              <span className="flex-1">{n.label}</span>
              {!!badge && badge > 0 && (
                <span className={`chip ${active ? 'bg-brand/20 text-brand' : 'bg-elev text-muted'}`}>{badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Shortcuts */}
      <div className="border-t border-line pt-3 space-y-1">
        <Link href="/cart" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted hover:text-ink hover:bg-elev">
          <Icon.cart width={16} height={16} /> <span className="flex-1">Cart</span>
          {cartCount > 0 && <span className="chip bg-elev text-muted">{cartCount}</span>}
        </Link>
        <Link href="/shop" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted hover:text-ink hover:bg-elev">
          <Icon.box width={16} height={16} /> Continue shopping
        </Link>
        <button onClick={doLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted hover:text-danger hover:bg-elev" suppressHydrationWarning>
          <Icon.logout width={16} height={16} /> Log out
        </button>
      </div>
    </aside>
  );
}
