import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata: Metadata = {
  title: 'Press · Voltik',
  description: 'Press kit and media inquiries — landing soon.'
};

export default function PressPage() {
  return (
    <ComingSoon
      kicker="Press · Coming soon"
      title="Press kit on the way."
      body="High-res product shots, brand guidelines, founder bios, and a contact for media enquiries. Drop us a line via the contact page in the meantime."
      icon="spark"
      bullets={[
        'Product photography pack (HEIC + WebP)',
        'Brand fonts, palette, voice + tone',
        'Founder & engineering team bios',
        'Press contact + interview availability'
      ]}
      backHref="/about"
    />
  );
}
