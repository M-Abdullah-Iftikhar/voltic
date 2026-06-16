import type { Metadata } from 'next';
import { ContentPage } from '@/components/ContentPage';

export const metadata: Metadata = {
  title: 'Terms · Voltik',
  description: 'The terms that govern your use of Voltik and any purchase you make.'
};

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms of service"
      kicker="Last updated 1 June 2026."
      icon="list"
      crumbs={[{ label: 'Terms' }]}
    >
      <p className="lede">
        By creating an account or placing an order on voltik.com you agree to these terms.
        If something here is unclear, email <a href="mailto:legal@voltik.com">legal@voltik.com</a> and we'll explain it in plain language.
      </p>

      <h2>1. Eligibility</h2>
      <p>You must be at least 16 years old (or the digital age of consent in your country) to use Voltik.</p>

      <h2>2. Account responsibilities</h2>
      <ul>
        <li>Keep your login credentials secret.</li>
        <li>Provide accurate information at signup and checkout.</li>
        <li>Notify us promptly of any unauthorised use of your account.</li>
      </ul>

      <h2>3. Orders & pricing</h2>
      <p>
        Prices are shown in USD and exclude shipping and applicable taxes. An order is
        accepted only when we send the order-confirmation email. We reserve the right
        to cancel orders affected by pricing errors, fraud, or stockouts — you'll receive
        a full refund.
      </p>

      <h2>4. Returns & warranty</h2>
      <p>
        Returns are governed by our <a href="/returns">returns policy</a>; warranty claims
        by our <a href="/warranty">warranty policy</a>. Both are incorporated into these terms.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use Voltik to infringe IP, ship contraband, or break local law.</li>
        <li>Scrape, copy, or republish our content without written consent.</li>
        <li>Attempt to interfere with the platform's security or availability.</li>
      </ul>

      <h2>6. Liability</h2>
      <p>
        To the maximum extent permitted by law, our total liability for any claim arising
        from your use of Voltik is capped at the amount you paid us in the 12 months
        preceding the claim. Nothing here limits liability that cannot be excluded by law
        (e.g. for death or personal injury caused by negligence).
      </p>

      <h2>7. Governing law</h2>
      <p>
        These terms are governed by the laws of the Islamic Republic of Pakistan. The
        courts of Karachi have exclusive jurisdiction over any dispute, except where
        consumer-protection law gives you a right to sue in your home country.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update these terms. Material changes get an email + an in-app banner at
        least 14 days before they take effect.
      </p>
    </ContentPage>
  );
}
