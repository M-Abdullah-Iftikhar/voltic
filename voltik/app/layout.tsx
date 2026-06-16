import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Geist } from 'next/font/google';
import { UserProvider } from '@/components/UserContext';
import { CartProvider } from '@/components/CartContext';
import { FavoritesProvider } from '@/components/FavoritesContext';
import { FlyToCartProvider } from '@/components/FlyToCartContext';
import { RecentlyViewedProvider } from '@/components/RecentlyViewedContext';
import { PromoBar } from '@/components/PromoBar';
import { SkipToContent } from '@/components/SkipToContent';
import { MobileNavBar } from '@/components/MobileNavBar';
import { PageTransition } from '@/components/PageTransition';
import { CookieConsent } from '@/components/CookieConsent';
import { FreeShippingFloater } from '@/components/FreeShippingFloater';
import { ExitIntentModal } from '@/components/ExitIntentModal';
import { AccessibilityPrefs } from '@/components/AccessibilityPrefs';
import { LogoIntro } from '@/components/LogoIntro';
import { CsrfFetchPatch } from '@/components/CsrfFetchPatch';

// Self-hosted variable fonts via next/font — no flash, no runtime CSS
// import, and Geist as the new display face (replacing Space Grotesk).
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap'
});
const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Voltik — Power Up Your Mobile Life',
  description: 'Premium mobile accessories: cables, chargers, audio, screen protection, cases, photography gear and more.'
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${geist.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('voltik-theme');
                if (t === 'light') document.documentElement.classList.remove('dark');
                else document.documentElement.classList.add('dark');

                // A11y preferences applied pre-paint to avoid layout shift.
                const fs = localStorage.getItem('voltik:font-scale');
                const fsMap = { sm: 0.92, md: 1, lg: 1.12 };
                if (fs && fsMap[fs]) document.documentElement.style.setProperty('--font-scale', String(fsMap[fs]));
                if (localStorage.getItem('voltik:contrast') === 'high') {
                  document.documentElement.classList.add('contrast-high');
                }
              } catch (e) {}
            `
          }}
        />
      </head>
      <body className="min-h-screen">
        <CsrfFetchPatch />
        <LogoIntro />
        <UserProvider>
          <FavoritesProvider>
            <CartProvider>
              <FlyToCartProvider>
                <RecentlyViewedProvider>
                  <SkipToContent />
                  <PromoBar />
                  <PageTransition>{children}</PageTransition>
                  <MobileNavBar />
                  <FreeShippingFloater />
                  <ExitIntentModal />
                  <AccessibilityPrefs />
                  <CookieConsent />
                </RecentlyViewedProvider>
              </FlyToCartProvider>
            </CartProvider>
          </FavoritesProvider>
        </UserProvider>
      </body>
    </html>
  );
}
