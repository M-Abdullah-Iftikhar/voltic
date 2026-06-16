import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { VirtualShowroom } from '@/components/VirtualShowroom';
import { db } from '@/lib/db';
import { enrich } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Showroom · Voltik',
  description: 'A virtual room of Voltik accessories — drag to look around, hover to spotlight, click to pick it up.'
};

export default async function ShowroomPage() {
  const [rawProducts] = await Promise.all([db.listProducts()]);
  const products = await enrich(rawProducts);
  return (
    <>
      <Navbar />
      <main id="main">
        <VirtualShowroom products={products} />
      </main>
      <Footer />
    </>
  );
}
