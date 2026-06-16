import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Anonymised recent orders for the landing-page "Just purchased" ticker.
 *  Returns first-name only + country + a product name pulled from the order's lines. */
export async function GET() {
  const [orders, products] = await Promise.all([db.listOrders(), db.listProducts()]);

  const items = orders
    .filter(o => o.status !== 'cancelled')
    .slice(0, 14)
    .map(o => {
      // First name only — last name + email never leave the server.
      const firstName = (o.customer || 'Someone').split(/\s+/)[0];
      const country = o.shipping?.country || guessCountryFromEmail(o.email);
      const featureProductId = o.lines?.[0]?.id;
      const product = featureProductId ? products.find(p => p.id === featureProductId) : undefined;
      return {
        id: o.id,
        firstName,
        country,
        productName: product?.name || `${o.items} item${o.items === 1 ? '' : 's'}`,
        productId: product?.id,
        date: o.date
      };
    });

  return NextResponse.json({ items });
}

function guessCountryFromEmail(email?: string): string {
  if (!email) return '';
  const tld = email.split('.').pop() || '';
  const map: Record<string, string> = {
    gmail: '', outlook: '', yahoo: '', mail: '', hotmail: '',
    in: 'IN', uk: 'UK', us: 'US', ae: 'UAE', sg: 'SG', jp: 'JP', cn: 'CN', pk: 'PK',
    de: 'DE', fr: 'FR', it: 'IT', io: '', ie: 'IE'
  };
  return map[tld.toLowerCase()] || '';
}
