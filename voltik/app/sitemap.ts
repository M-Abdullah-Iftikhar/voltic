import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { captureError } from '@/lib/observability';

/** Dynamic sitemap — Next.js exposes this at /sitemap.xml */
export const dynamic = 'force-dynamic';
export const revalidate = 3600;   // 1 hour

function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl().replace(/\/$/, '');
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`,         lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/shop`,     lastModified: now, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${base}/about`,    lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/contact`,  lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${base}/faq`,      lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/shipping`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/returns`,  lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/warranty`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/privacy`,  lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${base}/terms`,    lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${base}/cookies`,  lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${base}/login`,    lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/signup`,   lastModified: now, changeFrequency: 'yearly',  priority: 0.3 }
  ];

  // Pull dynamic content; fail open with just the static pages if Mongo is down.
  try {
    const [products, categories] = await Promise.all([db.listProducts(), db.listCategories()]);
    const categoryPages: MetadataRoute.Sitemap = categories.map(c => ({
      url: `${base}/shop?category=${encodeURIComponent(c.id)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: c.parent === null ? 0.8 : 0.6
    }));
    const productPages: MetadataRoute.Sitemap = products.map(p => ({
      url: `${base}/product/${encodeURIComponent(p.slug || p.id)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7
    }));
    return [...staticPages, ...categoryPages, ...productPages];
  } catch (e) {
    captureError(e, { hint: 'sitemap-db-failure' });
    return staticPages;
  }
}
