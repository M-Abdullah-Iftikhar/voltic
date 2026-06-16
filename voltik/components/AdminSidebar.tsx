'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon, type IconKey } from './Icons';
import { AdminRecentEdits } from './AdminRecentEdits';

const NAV: { href: string; label: string; icon: IconKey }[] = [
  { href: '/admin',            label: 'Dashboard',  icon: 'dashboard' },
  { href: '/admin/products',   label: 'Products',   icon: 'box' },
  { href: '/admin/orders',     label: 'Orders',     icon: 'list' },
  { href: '/admin/customers',  label: 'Customers',  icon: 'users' },
  { href: '/admin/categories', label: 'Categories', icon: 'tag' },
  { href: '/admin/reviews',    label: 'Reviews',    icon: 'star' },
  { href: '/admin/promos',     label: 'Promos',     icon: 'spark' },
  { href: '/admin/ads',        label: 'Ads',        icon: 'trending' },
  { href: '/admin/subscribers', label: 'Subscribers', icon: 'heart' }
];

export function AdminSidebar() {
  const path = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
    router.push('/admin/login');
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-line bg-surface min-h-screen sticky top-0 self-start">
      <div className="px-6 py-5 border-b border-line">
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="grid place-items-center h-8 w-8 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}>
            <Icon.bolt width={18} height={18} />
          </span>
          Voltik
        </Link>
        <div className="text-xs text-muted mt-1">Admin console</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(n => {
          const Glyph = Icon[n.icon];
          const active = path === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${active ? 'bg-brand/10 text-brand font-semibold' : 'text-muted hover:text-ink hover:bg-elev'}`}
            >
              <Glyph width={18} height={18} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <AdminRecentEdits />

      <div className="p-3 border-t border-line space-y-1">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted hover:text-ink hover:bg-elev">
          <Icon.globe width={18} height={18} /> View store
        </Link>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted hover:text-danger hover:bg-elev">
          <Icon.logout width={18} height={18} /> Logout
        </button>
      </div>
    </aside>
  );
}
