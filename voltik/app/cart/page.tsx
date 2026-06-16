import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartView } from './CartView';
import { db } from '@/lib/db';
import { enrich } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const products = await enrich(await db.listProducts());
  return (
    <>
      <Navbar />
      <main id="main" className="container-x py-10">
        <header className="mb-8">
          <span className="text-xs uppercase tracking-[0.18em] font-semibold text-brand">Your bag</span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl mt-2">Shopping cart</h1>
        </header>
        <CartView products={products} />
      </main>
      <Footer />
    </>
  );
}
