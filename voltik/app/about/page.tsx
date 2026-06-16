import type { Metadata } from 'next';
import { ContentPage } from '@/components/ContentPage';

export const metadata: Metadata = {
  title: 'About · Voltik',
  description: 'Voltik builds premium mobile accessories engineered for the way you live, work and play.'
};

export default function AboutPage() {
  return (
    <ContentPage
      title="About Voltik"
      kicker="Premium mobile accessories engineered for the way you live, work and play."
      icon="bolt"
      crumbs={[{ label: 'About' }]}
    >
      <p className="lede">
        We started Voltik in 2019 with a simple thesis: the gear that powers your phone
        should be as well-designed as the phone itself. Six years later, we ship to more
        than 40 countries and obsess over the same things — fit, finish, and the kind of
        reliability that earns a second purchase.
      </p>

      <h2>What we make</h2>
      <p>
        Cables, chargers, batteries, audio, mounts, and cases — all engineered in-house
        and validated against the same internal spec sheet. Every product ships with a
        two-year warranty because we expect it to last.
      </p>

      <h2>How we work</h2>
      <ul>
        <li><strong>Test what you sell.</strong> Every SKU is dogfooded for at least 30 days before launch.</li>
        <li><strong>Service over scale.</strong> Replacement units ship in 24 hours — no questions, no forms.</li>
        <li><strong>Material first.</strong> Aluminium, braided nylon, recycled plastic. No mystery polymers.</li>
      </ul>

      <h2>By the numbers</h2>
      <ul>
        <li>200,000+ shipments fulfilled</li>
        <li>4.8★ average customer rating across the catalog</li>
        <li>Carbon-neutral shipping on every order since 2024</li>
      </ul>

      <h2>Get in touch</h2>
      <p>
        Questions, partnerships, press — drop us a line via the <a href="/contact">contact page</a>.
        For warranty claims, see <a href="/warranty">warranty</a>.
      </p>
    </ContentPage>
  );
}
