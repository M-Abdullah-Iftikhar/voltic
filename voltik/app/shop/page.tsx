import { Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ShopClient } from './ShopClient';
import { PageSpinner } from '@/components/Spinner';
import { PullToRefresh } from '@/components/PullToRefresh';
import { getCachedProducts, getCachedCategories } from '@/lib/cache';
import { enrich } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const [rawProducts, categories] = await Promise.all([getCachedProducts(), getCachedCategories()]);
  const products = await enrich(rawProducts);
  return (
    <>
      <Navbar />
      <PullToRefresh />
      <main id="main" className="container-x py-10">
        <header className="mb-8">
          <span className="text-xs uppercase tracking-[0.18em] font-semibold text-brand">All Products</span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl mt-2">Shop the catalog</h1>
          <p className="text-muted mt-2 max-w-2xl">Filter, sort and discover the perfect Voltik accessory.</p>
        </header>
        <Suspense fallback={<PageSpinner />}>
          <ShopClient products={products} categories={categories} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
