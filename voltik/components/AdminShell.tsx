'use client';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminThemeSwitch } from './AdminThemeSwitch';
import { Icon } from './Icons';
import { Avatar } from './Avatar';
import { CommandPalette } from './CommandPalette';
import { AdminOnboardingTour } from './AdminOnboardingTour';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isLogin = pathname.includes('/admin/login');

  if (isLogin) return <>{children}</>;

  // Fake a Cmd+K keypress so the search-bar button feels native — the
  // CommandPalette listens for it globally.
  const openPalette = () => {
    const ev = new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true });
    document.dispatchEvent(ev);
  };

  return (
    <div className="flex min-h-screen bg-bg">
      <AdminSidebar />
      <main className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 glass border-b border-line">
          <div className="flex items-center gap-3 px-6 h-14">
            <button
              onClick={openPalette}
              className="flex-1 flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 max-w-md text-left hover:border-brand/40 transition"
              aria-label="Open command palette"
            >
              <Icon.search width={14} height={14} className="text-muted" />
              <span className="text-sm flex-1 text-muted">Search products, orders, customers…</span>
              <kbd className="text-[10px] font-mono text-muted bg-elev px-1.5 py-0.5 rounded">⌘K</kbd>
            </button>
            <AdminThemeSwitch />
            <button className="grid place-items-center h-10 w-10 rounded-full border border-line text-ink hover:bg-elev" aria-label="Notifications" suppressHydrationWarning>
              <span className="relative inline-block">
                <Icon.spark width={16} height={16} />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-danger" />
              </span>
            </button>
            <Avatar name="Arizz Admin" seed="arizz@gmail.com" size={36} />
          </div>
        </div>
        <div className="p-6 sm:p-8">{children}</div>
      </main>
      <CommandPalette />
      <AdminOnboardingTour />
    </div>
  );
}
