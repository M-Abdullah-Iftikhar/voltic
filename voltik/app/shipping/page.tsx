import type { Metadata } from 'next';
import { ContentPage } from '@/components/ContentPage';

export const metadata: Metadata = {
  title: 'Shipping · Voltik',
  description: 'Delivery times, costs and supported countries.'
};

export default function ShippingPage() {
  return (
    <ContentPage
      title="Shipping"
      kicker="Free shipping on orders over $50. Tracking on every package."
      icon="truck"
      crumbs={[{ label: 'Shipping' }]}
    >
      <p className="lede">
        We process orders within one business day and ship from warehouses in Karachi (PK),
        Dubai (UAE) and Frankfurt (DE), so most customers receive their package in under a week.
      </p>

      <h2>Domestic delivery</h2>
      <ul>
        <li><strong>Standard (2–4 days):</strong> $6.50 — free over $50</li>
        <li><strong>Express (1–2 days):</strong> $12.00</li>
        <li><strong>Cash on Delivery:</strong> available in select cities for orders under $200</li>
      </ul>

      <h2>International delivery</h2>
      <ul>
        <li><strong>Economy (7–14 days):</strong> $14.00 flat</li>
        <li><strong>Priority (3–6 days):</strong> $28.00 flat</li>
        <li>Customs duties are paid by the recipient at delivery and vary by country.</li>
      </ul>

      <h2>Order tracking</h2>
      <p>
        Every order gets a tracking link by email as soon as it ships. Signed-in customers
        can also follow shipments under <a href="/account/orders">My Orders</a>.
      </p>

      <h2>Where we don't ship (yet)</h2>
      <p>
        Russia, Belarus, North Korea, Iran, Syria, Cuba. We're actively working to expand —
        sign up for the newsletter for updates.
      </p>
    </ContentPage>
  );
}
