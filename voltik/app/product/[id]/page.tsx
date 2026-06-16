import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { Icon } from '@/components/Icons';
import { db } from '@/lib/db';
import { enrich, enrichOne } from '@/lib/reviews';
import { AddToCartPanel } from './AddToCartPanel';
import { FavoriteToggle } from './FavoriteToggle';
import { ReviewsSection } from './ReviewsSection';
import { StickyAddToCart } from './StickyAddToCart';
import { BundleSuggestion } from '@/components/BundleSuggestion';
import { RecentlyViewed, TrackVisit } from '@/components/RecentlyViewed';
import { WhyWeLoveIt } from '@/components/WhyWeLoveIt';
import { TrustBadgesRow } from '@/components/TrustBadgesRow';
import { VariantSelector } from '@/components/VariantSelector';
import { ProductGallery } from '@/components/ProductGallery';
import { ARViewButton } from '@/components/ARViewButton';

export const dynamic = 'force-dynamic';

/** Per-product OG + meta tags. The `id` route param can be either the
 *  slug or the raw id — db.getProductByIdOrSlug handles both. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await db.getProductByIdOrSlug(id);
  if (!p) return { title: 'Product not found · Voltik' };
  return {
    title: `${p.name} · Voltik`,
    description: p.description.slice(0, 160),
    openGraph: {
      title: p.name,
      description: p.description.slice(0, 160),
      type: 'website'
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await db.getProductByIdOrSlug(id);
  if (!raw) notFound();

  const [product, allReviews, allOrders] = await Promise.all([
    enrichOne(raw),
    db.listReviewsForProduct(id),
    db.listOrders()
  ]);
  // Hidden reviews stay in the DB so the admin can restore them, but never
  // render publicly. The product's rating/count is already computed without them.
  const reviews = allReviews.filter(r => !r.hidden);

  const all = await db.listProducts();
  const enrichedAll = await enrich(all);
  const related = enrichedAll.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

  // Set of userIds that have actually bought THIS product (verified purchase).
  // We also track emails for guest-order accounts where userId wasn't attached.
  const verifiedUserIds = new Set<string>();
  const verifiedEmails  = new Set<string>();
  for (const o of allOrders) {
    if (o.status === 'cancelled') continue;
    if (!o.lines?.some(l => l.id === product.id)) continue;
    if (o.userId) verifiedUserIds.add(o.userId);
    if (o.email)  verifiedEmails.add(o.email.toLowerCase());
  }

  // Schema.org Product JSON-LD for Google rich results.
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand },
    category: product.category,
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: 'USD',
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock'
    }
  };
  if (product.reviewsCount > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating.toFixed(1),
      reviewCount: product.reviewsCount
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <TrackVisit productId={product.id} />
      <main id="main" className="container-x py-10">
        {/* Breadcrumbs */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-ink">Shop</Link>
          <span>/</span>
          <Link href={`/shop?category=${product.category}`} className="hover:text-ink capitalize">{product.category}</Link>
          <span>/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-10">
          {/* Gallery — angles, 360° spin, video, click-to-zoom modal,
              and Amazon-style hover magnifier all live in this one
              composite. See `ProductGallery` for the breakdown. */}
          <div>
            <ProductGallery product={product} />
            {/* AR view — only renders for products where seeing them
                "in your room" actually helps (cases, stands, audio). */}
            <ARViewButton product={product} />
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {product.badge && <span className="chip bg-brand/10 text-brand">{product.badge}</span>}
              <span className="text-xs text-muted">SKU · {product.sku}</span>
              <FavoriteToggle productId={product.id} />
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl mt-3 leading-tight">{product.name}</h1>

            {/* Real review-driven rating */}
            <a href="#reviews" className="flex items-center gap-3 mt-3 text-sm hover:opacity-80">
              {product.reviewsCount > 0 ? (
                <>
                  <div className="flex items-center gap-1 text-warn">
                    {[...Array(5)].map((_, i) => <Icon.star key={i} width={14} height={14} className={i < Math.round(product.rating) ? '' : 'opacity-30'} />)}
                  </div>
                  <span className="text-ink font-semibold">{product.rating.toFixed(1)}</span>
                  <span className="text-muted">· {product.reviewsCount.toLocaleString()} verified {product.reviewsCount === 1 ? 'review' : 'reviews'}</span>
                </>
              ) : (
                <span className="text-muted italic">No reviews yet — be the first to share your thoughts</span>
              )}
            </a>

            <p className="text-muted mt-5 leading-relaxed">{product.description}</p>

            <WhyWeLoveIt product={product} forceShow />

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-4xl font-bold gradient-text">${product.price.toFixed(2)}</span>
              {product.oldPrice && (
                <>
                  <span className="text-muted line-through">${product.oldPrice.toFixed(2)}</span>
                  <span className="chip bg-danger/10 text-danger">Save {discount}%</span>
                </>
              )}
            </div>

            <VariantSelector product={product} />

            <AddToCartPanel productId={product.id} stock={product.stock} />
            {/* Trust badges — sit directly under the CTA so commitments land
                where the buyer's eye already is. */}
            <TrustBadgesRow />
            {/* Sentinel watched by StickyAddToCart to know when the in-flow CTA is offscreen */}
            <div id="voltik-sticky-cta-sentinel" aria-hidden style={{ height: 1 }} />

            {/* Bundle suggestion — pair with first related product if any */}
            {related[0] && (
              <BundleSuggestion current={product} companion={related[0]} />
            )}

            {/* Features */}
            <div className="card mt-8 p-5">
              <h3 className="text-xs uppercase tracking-wide text-muted font-semibold mb-3">What's inside</h3>
              <ul className="space-y-2">
                {product.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Icon.check width={16} height={16} className="text-success shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section id="reviews" className="mt-16 scroll-mt-20">
          <ReviewsSection
            productId={product.id}
            initialReviews={reviews}
            initialRating={product.rating}
            initialCount={product.reviewsCount}
            verifiedUserIds={Array.from(verifiedUserIds)}
            verifiedEmails={Array.from(verifiedEmails)} />
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display font-bold text-2xl mb-6">You might also like</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* Recently viewed strip — hides itself if there's nothing */}
        <RecentlyViewed catalog={enrichedAll} excludeId={product.id} />
      </main>
      <StickyAddToCart product={product} />
      <Footer />
    </>
  );
}
