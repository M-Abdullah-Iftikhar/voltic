import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata: Metadata = {
  title: 'Sustainability · Voltik',
  description: 'How Voltik thinks about packaging, materials, and shipping carbon.'
};

export default function SustainabilityPage() {
  return (
    <ComingSoon
      kicker="Sustainability · Coming soon"
      title="The full report's in the workshop."
      body="We've moved to 100% recycled paper packaging and our shipments have been carbon-neutral since 2024. The complete report — materials, suppliers, ship routes — lands here next quarter."
      icon="refresh"
      bullets={[
        '100% recycled paper, zero single-use plastic',
        'Carbon-neutral shipping on every order',
        'Repairability ratings on every product',
        'Annual emissions report (verified)'
      ]}
      backHref="/about"
    />
  );
}
