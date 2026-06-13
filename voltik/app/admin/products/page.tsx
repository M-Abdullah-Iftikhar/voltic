import { db } from '@/lib/db';
import { enrich } from '@/lib/reviews';
import { ProductsAdminClient } from './ProductsAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const [rawProducts, categories] = await Promise.all([db.listProducts(), db.listCategories()]);
  const products = await enrich(rawProducts);
  return <ProductsAdminClient initialProducts={products} categories={categories} />;
}
