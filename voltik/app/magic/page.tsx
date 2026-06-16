import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MagicSearch } from '@/components/MagicSearch';
import { db } from '@/lib/db';
import { enrich } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Magic search · Voltik',
  description: 'Say what you need in plain English — port, budget, watts, features. We\'ll parse it and find the right Voltik accessory.'
};

export default async function MagicSearchPage() {
  const [rawProducts] = await Promise.all([db.listProducts()]);
  const products = await enrich(rawProducts);
  return (
    <>
      <Navbar />
      <main id="main">
        <MagicSearch products={products} />
      </main>
      <Footer />
    </>
  );
}
