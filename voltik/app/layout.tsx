import './globals.css';
import type { Metadata, Viewport } from 'next';
import { UserProvider } from '@/components/UserContext';
import { CartProvider } from '@/components/CartContext';
import { FavoritesProvider } from '@/components/FavoritesContext';

export const metadata: Metadata = {
  title: 'Voltik — Power Up Your Mobile Life',
  description: 'Premium mobile accessories: cables, chargers, audio, screen protection, cases, photography gear and more.'
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('voltik-theme');
                if (t === 'light') document.documentElement.classList.remove('dark');
                else document.documentElement.classList.add('dark');
              } catch (e) {}
            `
          }}
        />
      </head>
      <body className="min-h-screen">
        <UserProvider>
          <FavoritesProvider>
            <CartProvider>{children}</CartProvider>
          </FavoritesProvider>
        </UserProvider>
      </body>
    </html>
  );
}
