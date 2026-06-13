import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { db } from '@/lib/db';
import { enrich } from '@/lib/reviews';
import { FavoritesView } from './FavoritesView';

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const products = await enrich(await db.listProducts());
  return (
    <>
      <Navbar />
      <main className="container-x py-10">
        <header className="mb-8">
          <span className="text-xs uppercase tracking-[0.18em] font-semibold text-brand">Your wishlist</span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl mt-2">Favorites</h1>
          <p className="text-muted mt-2 max-w-2xl">Saved for later. Available across all your devices when you're signed in.</p>
        </header>
        <FavoritesView products={products} />
      </main>
      <Footer />
    </>
  );
}
