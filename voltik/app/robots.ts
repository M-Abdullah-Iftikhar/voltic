import type { MetadataRoute } from 'next';

function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl().replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Don't index or crawl auth-only / transactional / API surfaces.
        disallow: ['/admin', '/account', '/api/', '/checkout', '/cart']
      }
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base
  };
}
