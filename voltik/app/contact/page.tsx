import type { Metadata } from 'next';
import { ContentPage } from '@/components/ContentPage';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact · Voltik',
  description: 'Get in touch with Voltik support, sales or press.'
};

export default function ContactPage() {
  return (
    <ContentPage
      title="Contact us"
      kicker="We typically respond within one business day. For warranty claims, use the warranty form."
      icon="globe"
      crumbs={[{ label: 'Contact' }]}
    >
      <div className="grid sm:grid-cols-3 gap-4 not-prose">
        <ChannelCard label="Support" body="support@voltik.com" sub="Orders, returns, warranty" />
        <ChannelCard label="Sales"   body="sales@voltik.com"   sub="Bulk + B2B inquiries" />
        <ChannelCard label="Press"   body="press@voltik.com"   sub="Media + partnerships" />
      </div>

      <h2>Send us a message</h2>
      <ContactForm />

      <h2>Office</h2>
      <p>
        Voltik Technologies<br />
        221 Bridge Avenue, Suite 4<br />
        Karachi 75500, Pakistan
      </p>
    </ContentPage>
  );
}

function ChannelCard({ label, body, sub }: { label: string; body: string; sub: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-muted font-semibold">{label}</div>
      <a href={`mailto:${body}`} className="block mt-1 font-display font-bold text-ink hover:text-brand">{body}</a>
      <div className="text-xs text-muted mt-1">{sub}</div>
    </div>
  );
}
