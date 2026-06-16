import type { Metadata } from 'next';
import { ContentPage } from '@/components/ContentPage';

export const metadata: Metadata = {
  title: 'Warranty · Voltik',
  description: 'Two-year manufacturer warranty on every Voltik product.'
};

export default function WarrantyPage() {
  return (
    <ContentPage
      title="2-year warranty"
      kicker="If it breaks under normal use, we replace it. No receipt-hunting, no diagnosis fees, no stalling."
      icon="shield"
      crumbs={[{ label: 'Warranty' }]}
    >
      <p className="lede">
        Every Voltik product is covered by a two-year manufacturer warranty starting from
        the delivery date. We back our gear because we make it ourselves and stand behind it.
      </p>

      <h2>What's covered</h2>
      <ul>
        <li>Defects in materials and workmanship (frayed cables, dead cells, short circuits).</li>
        <li>Premature failure under normal indoor use within the 2-year window.</li>
        <li>Charging speed degradation greater than 20% on power-bank products.</li>
      </ul>

      <h2>What's not</h2>
      <ul>
        <li>Cosmetic wear and tear (scuffs, paint chips, scratches).</li>
        <li>Damage from drops, liquids, fire, pets, or non-OEM adapters.</li>
        <li>Modifications or repairs by unauthorised third parties.</li>
      </ul>

      <h2>How to file a claim</h2>
      <ol>
        <li>Email <a href="mailto:support@voltik.com">support@voltik.com</a> with your order number and a short description.</li>
        <li>A photo or 5-second video of the issue speeds things up — but isn't required.</li>
        <li>If the claim is valid, a replacement ships within 24 hours. You don't need to send the broken unit back unless we ask.</li>
      </ol>

      <h2>Bought from a reseller?</h2>
      <p>
        Warranty still applies — just include a copy of the original purchase receipt in your claim.
      </p>
    </ContentPage>
  );
}
