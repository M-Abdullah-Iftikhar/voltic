'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './Icons';
import { useUser } from './UserContext';
import { useFavorites } from './FavoritesContext';

export function UserMenu() {
  const { user, logout } = useUser();
  const { count: favCount } = useFavorites();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) {
    return (
      <Link href="/login" className="btn-primary text-xs !px-4 !py-2">
        <Icon.user width={14} height={14} /> Login
      </Link>
    );
  }

  const initials = user.name.split(' ').slice(0, 2).map(s => s[0]).join('').toUpperCase();

  const doLogout = async () => {
    await logout();
    setOpen(false);
    router.push('/');
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Account"
        className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border border-line hover:bg-elev transition"
      >
        <span className="grid place-items-center h-7 w-7 rounded-full text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}>
          {initials}
        </span>
        <span className="text-xs font-semibold hidden sm:inline max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 card p-2 shadow-soft animate-slidein z-50">
          <div className="px-3 py-3 border-b border-line">
            <div className="text-sm font-semibold truncate">{user.name}</div>
            <div className="text-xs text-muted truncate">{user.email}</div>
          </div>
          <div className="py-2 space-y-0.5">
            <MenuLink href="/account"           icon="dashboard" label="Dashboard"     onClick={() => setOpen(false)} />
            <MenuLink href="/account/orders"    icon="list"      label="My Orders"     onClick={() => setOpen(false)} />
            <MenuLink href="/account/reviews"   icon="star"      label="My Reviews"    onClick={() => setOpen(false)} />
            <MenuLink href="/account/favorites" icon="heart"     label="Favorites"     badge={favCount} onClick={() => setOpen(false)} />
            <MenuLink href="/cart"              icon="cart"      label="Cart"          onClick={() => setOpen(false)} />
            <MenuLink href="/account/profile"   icon="cog"       label="Profile"       onClick={() => setOpen(false)} />
          </div>
          <div className="border-t border-line pt-1">
            <button onClick={doLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted hover:text-danger hover:bg-elev">
              <Icon.logout width={16} height={16} /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon, label, badge, onClick }: { href: string; icon: keyof typeof Icon; label: string; badge?: number; onClick: () => void }) {
  const Glyph = Icon[icon];
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink hover:bg-elev">
      <Glyph width={16} height={16} className="text-muted" />
      <span className="flex-1">{label}</span>
      {!!badge && badge > 0 && <span className="chip bg-brand/10 text-brand">{badge}</span>}
    </Link>
  );
}
