import type { Metadata } from 'next';
import { ContentPage } from '@/components/ContentPage';

export const metadata: Metadata = {
  title: 'Returns · Voltik',
  description: '30-day no-questions-asked returns. Here\'s how it works.'
};

export default function ReturnsPage() {
  return (
    <ContentPage
      title="Returns & refunds"
      kicker="30 days, no questions asked. We pay return shipping inside Pakistan; international returns ship at customer cost."
      icon="refresh"
      crumbs={[{ label: 'Returns' }]}
    >
      <h2>The short version</h2>
      <ol>
        <li>Email <a href="mailto:support@voltik.com">support@voltik.com</a> with your order number.</li>
        <li>We send a prepaid label (Pakistan) or a return address (international).</li>
        <li>Drop the package at any courier desk.</li>
        <li>Refunds hit the original payment method within 5–7 business days of arrival at our warehouse.</li>
      </ol>

      <h2>What's eligible</h2>
      <ul>
        <li>Anything unused, in its original packaging, within 30 days of delivery.</li>
        <li>Defective or damaged-in-transit items — at any point inside the 2-year warranty window.</li>
        <li>Wrong item shipped — fully on us, we'll cross-ship the right one immediately.</li>
      </ul>

      <h2>What's not</h2>
      <ul>
        <li>Items used beyond a reasonable inspection (visible wear, scuffs, residue).</li>
        <li>Gift cards and promotional swag.</li>
        <li>Bulk / B2B orders (covered by a separate contract — talk to your sales rep).</li>
      </ul>

      <h2>Exchanges</h2>
      <p>
        Different size or colour? Skip the return entirely — message support and we'll
        cross-ship the replacement the same day. You return the original at your leisure.
      </p>
    </ContentPage>
  );
}
