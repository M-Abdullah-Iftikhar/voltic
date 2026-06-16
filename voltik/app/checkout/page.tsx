import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CheckoutForm } from './CheckoutForm';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const products = await db.listProducts();
  return (
    <>
      <Navbar />
      <main id="main" className="container-x py-10">
        <header className="mb-8">
          <span className="text-xs uppercase tracking-[0.18em] font-semibold text-brand">Step 2 of 2</span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl mt-2">Secure checkout</h1>
        </header>
        <CheckoutForm products={products} />
      </main>
      <Footer />
    </>
  );
}
