'use client';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { ThemeToggle } from './ThemeToggle';
import { Icon } from './Icons';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isLogin = pathname.includes('/admin/login');

  if (isLogin) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-bg">
      <AdminSidebar />
      <main className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 glass border-b border-line">
          <div className="flex items-center gap-3 px-6 h-14">
            <div className="flex-1 flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 max-w-md">
              <Icon.search width={14} height={14} className="text-muted" />
              <input placeholder="Search products, orders, customers…" className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted" />
              <span className="text-[10px] font-mono text-muted bg-elev px-1.5 py-0.5 rounded">⌘K</span>
            </div>
            <ThemeToggle />
            <button className="grid place-items-center h-10 w-10 rounded-full border border-line text-ink hover:bg-elev" aria-label="Notifications">
              <span className="relative inline-block">
                <Icon.spark width={16} height={16} />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-danger" />
              </span>
            </button>
            <div className="h-9 w-9 rounded-full grid place-items-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}>
              A
            </div>
          </div>
        </div>
        <div className="p-6 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
