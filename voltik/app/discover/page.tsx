import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SwipeStack } from '@/components/SwipeStack';
import { db } from '@/lib/db';
import { enrich } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Discover · Voltik',
  description: 'Swipe through Voltik accessories — left to skip, right to save, up to grab.'
};

export default async function DiscoverPage() {
  const [rawProducts] = await Promise.all([db.listProducts()]);
  const products = await enrich(rawProducts);

  return (
    <>
      <Navbar />
      <main id="main" className="container-x py-12">
        <div className="max-w-md mx-auto">
          <header className="text-center mb-8">
            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand">Swipe to discover</span>
            <h1 className="font-display font-bold text-3xl sm:text-4xl mt-2 leading-tight">A deck of accessories.</h1>
            <p className="text-muted text-sm mt-3">
              Swipe right to favourite, left to skip, up to grab. Tap the buttons if dragging isn't your thing.
            </p>
          </header>

          <SwipeStack products={products} limit={20} />
        </div>
      </main>
      <Footer />
    </>
  );
}
