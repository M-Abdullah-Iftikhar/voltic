import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { enrich } from '@/lib/reviews';
import { FavoritesView } from '@/app/favorites/FavoritesView';

export const dynamic = 'force-dynamic';

export default async function AccountFavoritesPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/account/favorites');
  const products = await enrich(await db.listProducts());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl">My favourites</h2>
        <p className="text-muted text-sm mt-1">Saved across all your devices.</p>
      </div>
      <FavoritesView products={products} />
    </div>
  );
}
