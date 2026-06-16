'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { ThemeToggle } from './ThemeToggle';
import { useCart } from './CartContext';
import { UserMenu } from './UserMenu';
import { useFavorites } from './FavoritesContext';
import { useFlyToCart } from './FlyToCartContext';
import { CartDrawer } from './CartDrawer';
import { SearchAutocomplete } from './SearchAutocomplete';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/shop?category=charging', label: 'Charging' },
  { href: '/shop?category=audio', label: 'Audio' },
  { href: '/shop?category=cases', label: 'Cases' }
];

export function Navbar() {
  const { count } = useCart();
  const { count: favCount } = useFavorites();
  const { setCartAnchor } = useFlyToCart();
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cartBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Register the cart button as the fly-to-cart anchor.
  useEffect(() => {
    setCartAnchor(() => cartBtnRef.current?.getBoundingClientRect() ?? null);
    return () => setCartAnchor(null);
  }, [setCartAnchor]);

  return (
    <>
      <header className={`sticky top-0 z-40 transition-all ${scrolled ? 'glass shadow-soft' : ''}`}>
        <div className="container-x flex items-center gap-6 h-16">
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg">
            <span className="grid place-items-center h-8 w-8 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}>
              <Icon.bolt width={18} height={18} />
            </span>
            <span>Voltik</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {NAV.map(n => (
              <Link key={n.label} href={n.href} className="px-3 py-2 rounded-full text-sm text-muted hover:text-ink hover:bg-elev transition">
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <SearchAutocomplete />

            <ThemeToggle />

            <Link href="/favorites" className="relative hidden sm:grid place-items-center h-10 w-10 rounded-full border border-line text-ink hover:bg-elev transition" aria-label="Favorites">
              <Icon.heart width={18} height={18} />
              {favCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] grid place-items-center rounded-full bg-danger text-white text-[10px] font-bold px-1">
                  {favCount}
                </span>
              )}
            </Link>

            <button
              ref={cartBtnRef}
              data-cart-anchor
              onClick={() => setCartOpen(true)}
              className="relative grid place-items-center h-10 w-10 rounded-full border border-line text-ink hover:bg-elev transition"
              aria-label="Open cart"
              suppressHydrationWarning
            >
              <Icon.cart width={18} height={18} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] grid place-items-center rounded-full bg-brand text-white text-[10px] font-bold px-1">
                  {count}
                </span>
              )}
            </button>

            <UserMenu />

            <button onClick={() => setOpen(true)} className="lg:hidden grid place-items-center h-10 w-10 rounded-full border border-line" suppressHydrationWarning>
              <Icon.menu width={20} height={20} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-md p-6 animate-slidein lg:hidden">
          <div className="flex items-center justify-between mb-8">
            <span className="font-display font-bold text-lg">Voltik</span>
            <button onClick={() => setOpen(false)} className="grid place-items-center h-10 w-10 rounded-full border border-line">
              <Icon.close width={20} height={20} />
            </button>
          </div>
          <div className="flex flex-col gap-2 text-lg">
            {NAV.map(n => (
              <Link key={n.label} href={n.href} onClick={() => setOpen(false)} className="px-4 py-3 rounded-2xl bg-surface border border-line">{n.label}</Link>
            ))}
            <Link href="/favorites" onClick={() => setOpen(false)} className="px-4 py-3 rounded-2xl bg-surface border border-line flex items-center justify-between">
              <span>Favorites</span><span className="chip bg-danger/15 text-danger">{favCount}</span>
            </Link>
            <Link href="/login" onClick={() => setOpen(false)} className="px-4 py-3 rounded-2xl bg-surface border border-line">Login / Sign up</Link>
            <Link href="/admin/login" onClick={() => setOpen(false)} className="px-4 py-3 rounded-2xl bg-surface border border-line text-sm text-muted">Admin Login</Link>
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
