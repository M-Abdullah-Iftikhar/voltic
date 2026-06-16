import type { Metadata } from 'next';
import { ContentPage } from '@/components/ContentPage';

export const metadata: Metadata = {
  title: 'Privacy · Voltik',
  description: 'How Voltik collects, uses and protects your personal data.'
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy policy"
      kicker="Last updated 1 June 2026. Plain English — no fine-print games."
      icon="shield"
      crumbs={[{ label: 'Privacy' }]}
    >
      <p className="lede">
        Voltik Technologies ("Voltik", "we") collects only what we need to ship your
        orders, keep your account secure, and improve the store. This page explains
        exactly what, why, and for how long.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account:</strong> name, email, hashed password, saved addresses.</li>
        <li><strong>Orders:</strong> billing/shipping details, items, payment method (not card numbers — those stay with our processor).</li>
        <li><strong>Activity:</strong> cart and favourites (so they persist across devices when you're signed in).</li>
        <li><strong>Technical:</strong> IP address, browser, device — for fraud prevention and aggregate analytics.</li>
      </ul>

      <h2>Why we collect it</h2>
      <ul>
        <li>To fulfil and support your orders (contractual basis).</li>
        <li>To prevent fraud and secure your account (legitimate interest).</li>
        <li>To send marketing if you've opted in (consent — withdrawable anytime).</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>
        Only the vendors that make the store work — payment processors, shipping carriers,
        email delivery, and our hosting providers. None of them get to use your data for
        their own purposes. We don't sell data to anyone, full stop.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Order records: 7 years (tax law).</li>
        <li>Account data: until you ask us to delete it.</li>
        <li>Marketing email: until you unsubscribe.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        You can access, correct, export or delete your data at any time. Email
        <a href="mailto:privacy@voltik.com"> privacy@voltik.com</a> and we'll act on
        the request within 30 days. EU/UK residents have the additional right to lodge
        a complaint with their national data-protection authority.
      </p>

      <h2>Cookies</h2>
      <p>See our <a href="/cookies">cookie policy</a> for the full breakdown.</p>
    </ContentPage>
  );
}
