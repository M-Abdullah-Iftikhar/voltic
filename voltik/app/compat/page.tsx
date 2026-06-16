import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PhoneCompatLookup } from '@/components/PhoneCompatLookup';
import { db } from '@/lib/db';
import { enrich } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Compatibility · Voltik',
  description: 'Pick your phone — we\'ll filter the shop to accessories that actually plug, snap, or stick.'
};

export default async function CompatPage() {
  const [rawProducts] = await Promise.all([db.listProducts()]);
  const products = await enrich(rawProducts);
  return (
    <>
      <Navbar />
      <main id="main">
        <PhoneCompatLookup products={products} />
      </main>
      <Footer />
    </>
  );
}
