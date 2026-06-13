import { db } from '@/lib/db';
import { CategoryTreeClient } from './CategoryTreeClient';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([db.listCategories(), db.listProducts()]);
  const productCounts = categories.reduce<Record<string, number>>((acc, c) => {
    acc[c.id] = products.filter(p => p.category === c.id).length;
    return acc;
  }, {});
  return <CategoryTreeClient initialCategories={categories} productCounts={productCounts} />;
}
