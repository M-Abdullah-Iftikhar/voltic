import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Icon } from '@/components/Icons';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="container-x py-32 text-center">
        <div className="font-display font-bold text-8xl gradient-text">404</div>
        <h1 className="font-display font-bold text-3xl mt-4">Page not found</h1>
        <p className="text-muted mt-3 max-w-md mx-auto">The accessory you're looking for might be out of stock — or simply mis-wired.</p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/" className="btn-ghost">Back home</Link>
          <Link href="/shop" className="btn-primary">Shop catalog <Icon.arrow width={14} height={14} /></Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
