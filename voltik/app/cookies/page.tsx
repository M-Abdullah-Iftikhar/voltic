import type { Metadata } from 'next';
import { ContentPage } from '@/components/ContentPage';

export const metadata: Metadata = {
  title: 'Cookies · Voltik',
  description: 'The cookies Voltik uses and how you can control them.'
};

export default function CookiesPage() {
  return (
    <ContentPage
      title="Cookie policy"
      kicker="The complete list of cookies and local-storage keys Voltik uses, and what each one is for."
      icon="cog"
      crumbs={[{ label: 'Cookies' }]}
    >
      <p className="lede">
        We use a small set of strictly-necessary cookies + localStorage keys to keep
        you signed in, remember your cart, and respect your theme preference. We do
        NOT use third-party advertising cookies.
      </p>

      <h2>Strictly necessary</h2>
      <ul>
        <li><strong>voltik_user</strong> — your signed-in session (HttpOnly, 30 days).</li>
        <li><strong>voltik_admin</strong> — admin session for the back-office (HttpOnly, 8 hours).</li>
      </ul>

      <h2>Functional (localStorage)</h2>
      <ul>
        <li><strong>voltik:cart</strong> — your cart contents when you're not signed in.</li>
        <li><strong>voltik:favorites</strong> — your favourites when you're not signed in.</li>
        <li><strong>voltik:promo</strong> — the promo code you've applied (cleared on checkout).</li>
        <li><strong>voltik:theme</strong> — your light/dark theme preference.</li>
        <li><strong>voltik:recently-viewed</strong> — the last few products you opened.</li>
        <li><strong>voltik:cookie-consent</strong> — your consent choice (so we don't ask again).</li>
      </ul>

      <h2>Analytics</h2>
      <p>
        We don't run third-party analytics on the storefront. Server logs are kept for
        14 days for security and aggregated to count page views — never tied to your
        identity.
      </p>

      <h2>Managing cookies</h2>
      <p>
        You can clear localStorage and cookies from your browser settings at any time.
        Doing so will sign you out and reset your cart if you're not signed in. To
        reset your consent banner choice, clear <strong>voltik:cookie-consent</strong>.
      </p>
    </ContentPage>
  );
}
