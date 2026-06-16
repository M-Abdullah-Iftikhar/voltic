import { Icon } from './Icons';
import type { EnrichedProduct } from '@/lib/types';

/**
 * Editorial callout — a short, opinionated reason this product earns a
 * spot on the page. Renders only when the product is "featured" by our
 * definition (high rating, a marquee badge, or a deep discount) so it
 * doesn't dilute when applied to every card on the shop grid.
 */
export function WhyWeLoveIt({
  product,
  size = 'md',
  forceShow = false
}: {
  product: EnrichedProduct;
  size?: 'sm' | 'md';
  /** Skip the featured-product gate (use on product detail pages). */
  forceShow?: boolean;
}) {
  const featured = forceShow || isFeatured(product);
  if (!featured) return null;

  const blurb = pickBlurb(product);
  if (!blurb) return null;

  const pad = size === 'sm' ? 'p-3' : 'p-4';
  const text = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <aside
      className={`mt-5 rounded-2xl border border-brand/25 bg-brand/5 ${pad} flex items-start gap-3`}
      aria-label="Why we love this product"
    >
      <span
        aria-hidden
        className="grid place-items-center h-7 w-7 rounded-xl text-white shrink-0"
        style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}
      >
        <Icon.spark width={12} height={12} />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">Why we love it</div>
        <p className={`${text} italic text-ink leading-snug mt-1`}>“{blurb}”</p>
      </div>
    </aside>
  );
}

function isFeatured(p: EnrichedProduct): boolean {
  if (p.badge === 'Bestseller' || p.badge === 'Hot Deal') return true;
  if (p.reviewsCount >= 5 && p.rating >= 4.5) return true;
  if (p.oldPrice && (p.oldPrice - p.price) / p.oldPrice >= 0.2) return true;
  return false;
}

/**
 * Derive a 1-2 line tagline. Prefer the first feature (already curated
 * marketing copy) and fall back to the first sentence of the description.
 * Capped so it never wraps past two lines on a typical product card.
 */
function pickBlurb(p: EnrichedProduct): string | null {
  const candidate = (p.features?.[0] || firstSentence(p.description) || '').trim();
  if (!candidate) return null;
  return candidate.length > 140 ? `${candidate.slice(0, 137)}…` : candidate;
}

function firstSentence(s: string): string {
  if (!s) return '';
  const m = s.match(/[^.!?]+[.!?]/);
  return m ? m[0].trim() : s;
}
