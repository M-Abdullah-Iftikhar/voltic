import type { Metadata } from 'next';
import { ContentPage } from '@/components/ContentPage';
import { FAQList } from './FAQList';

export const metadata: Metadata = {
  title: 'FAQ · Voltik',
  description: 'Answers to common questions about ordering, shipping, returns and warranty.'
};

const FAQS = [
  {
    q: 'How long does shipping take?',
    a: 'Domestic orders ship within 1 business day and arrive in 2–4 days. International orders take 7–14 days depending on customs. Free shipping kicks in at $50.'
  },
  {
    q: "What's your return policy?",
    a: 'You have 30 days from delivery to return any unused item for a full refund. Just message support and we\'ll send a prepaid label. See the Returns page for the full process.'
  },
  {
    q: 'How does the warranty work?',
    a: 'Every Voltik product carries a 2-year manufacturer warranty. If anything fails under normal use, we\'ll send a replacement within 24 hours of you filing a claim.'
  },
  {
    q: 'Do you ship internationally?',
    a: 'Yes — we ship to 40+ countries. Customs fees vary by country and are paid by the recipient at delivery.'
  },
  {
    q: 'Can I track my order?',
    a: 'Absolutely. Once your order ships you\'ll receive a tracking link by email. Signed-in users can also follow it from their account dashboard.'
  },
  {
    q: 'Do you offer bulk / B2B pricing?',
    a: 'Yes, for orders over 100 units. Email sales@voltik.com and we\'ll set you up with a quote.'
  },
  {
    q: 'Are your products genuine?',
    a: 'All Voltik-branded products are designed in-house and manufactured in our certified partner factories. We never resell unbranded stock.'
  },
  {
    q: 'How do I apply a promo code?',
    a: 'Enter your code in the "Promo code" field on the cart page. The discount is applied immediately and stays attached through checkout.'
  }
];

export default function FAQPage() {
  // Add JSON-LD for Google's FAQ rich result.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ContentPage
        title="Frequently asked questions"
        kicker="Can't find what you're looking for? Email support@voltik.com — we usually reply within a few hours."
        icon="spark"
        crumbs={[{ label: 'FAQ' }]}
      >
        <FAQList items={FAQS} />
      </ContentPage>
    </>
  );
}
