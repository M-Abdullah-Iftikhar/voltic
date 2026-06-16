import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata: Metadata = {
  title: 'Careers · Voltik',
  description: 'Open roles at Voltik — coming soon.'
};

export default function CareersPage() {
  return (
    <ComingSoon
      kicker="Careers · Coming soon"
      title="Building the team that builds the gear."
      body="We're hiring quietly right now — open roles will be posted here. If you make stuff for a living and want to ship Voltik with us, send a short note to careers@voltik.com."
      icon="bolt"
      bullets={[
        'Industrial design + electromechanical engineering',
        'Frontend & full-stack (Next.js, Mongo, edge runtimes)',
        'Customer happiness — actual humans answering email',
        'Logistics + supply-chain for new warehouses'
      ]}
      backHref="/about"
    />
  );
}
