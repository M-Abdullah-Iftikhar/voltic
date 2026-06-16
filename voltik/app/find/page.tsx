import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProductChooser } from '@/components/ProductChooser';
import { db } from '@/lib/db';
import { enrich } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Find your accessory · Voltik',
  description: 'Answer three quick questions and we\'ll show you the three Voltik accessories that fit.'
};

export default async function FindPage() {
  const [rawProducts] = await Promise.all([db.listProducts()]);
  const products = await enrich(rawProducts);
  return (
    <>
      <Navbar />
      <main id="main">
        <ProductChooser catalog={products} />
      </main>
      <Footer />
    </>
  );
}
