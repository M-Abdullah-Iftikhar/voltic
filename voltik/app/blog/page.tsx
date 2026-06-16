import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata: Metadata = {
  title: 'Journal · Voltik',
  description: 'Design notes, engineering posts, and the occasional teardown.'
};

export default function BlogPage() {
  return (
    <ComingSoon
      kicker="Journal · Coming soon"
      title="Where the workbench notes go."
      body="Design rationale, engineering teardowns, and the occasional opinion piece on why USB-C took 20 years. Posts land monthly once the queue is deeper than three."
      icon="edit"
      bullets={[
        'Engineering deep-dives (GaN, magsafe, ANC math)',
        'Behind-the-product interviews with the team',
        'Buyer guides per category',
        'Customer stories we couldn\'t fit on the landing'
      ]}
      backHref="/"
    />
  );
}
