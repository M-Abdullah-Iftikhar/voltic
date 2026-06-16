'use client';
import { usePathname } from 'next/navigation';

/**
 * Tiny route-change fade. The `key` on the wrapper forces React to remount
 * the subtree on every pathname change, replaying the CSS fade-in
 * animation in `globals.css` (`.voltik-page-fade`). Honours
 * `prefers-reduced-motion` via the global media query in globals.css.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="voltik-page-fade">
      {children}
    </div>
  );
}
