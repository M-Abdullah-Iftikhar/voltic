import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { ProductIllustration } from '@/components/ProductIllustration';
import { Icon } from '@/components/Icons';
import { db } from '@/lib/db';
import { enrich, enrichOne } from '@/lib/reviews';
import { AddToCartPanel } from './AddToCartPanel';
import { FavoriteToggle } from './FavoriteToggle';
import { ReviewsSection } from './ReviewsSection';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await db.getProduct(id);
  if (!raw) notFound();

  const [product, reviews] = await Promise.all([
    enrichOne(raw),
    db.listReviewsForProduct(id)
  ]);

  const all = await db.listProducts();
  const related = await enrich(all.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4));
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

  return (
    <>
      <Navbar />
      <main className="container-x py-10">
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
          {/* Gallery */}
          <div>
            <ProductIllustration category={product.category} icon={product.icon} className="aspect-square rounded-3xl" size={260} />
            <div className="grid grid-cols-4 gap-3 mt-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`rounded-xl border ${i === 0 ? 'border-brand' : 'border-line'} overflow-hidden`}>
                  <ProductIllustration category={product.category} icon={product.icon} className="aspect-square" size={42} />
                </div>
              ))}
            </div>
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

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-4xl font-bold gradient-text">${product.price.toFixed(2)}</span>
              {product.oldPrice && (
                <>
                  <span className="text-muted line-through">${product.oldPrice.toFixed(2)}</span>
                  <span className="chip bg-danger/10 text-danger">Save {discount}%</span>
                </>
              )}
            </div>

            <AddToCartPanel productId={product.id} stock={product.stock} />

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

            {/* Guarantee strip */}
            <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
              {[
                { icon: 'truck',   l: 'Free shipping' },
                { icon: 'refresh', l: '30-day returns' },
                { icon: 'shield',  l: '2-year warranty' }
              ].map(it => {
                const G = (Icon as any)[it.icon];
                return (
                  <div key={it.l} className="card p-3 flex items-center gap-2">
                    <G width={16} height={16} className="text-brand" />
                    <span className="text-muted">{it.l}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section id="reviews" className="mt-16 scroll-mt-20">
          <ReviewsSection
            productId={product.id}
            initialReviews={reviews}
            initialRating={product.rating}
            initialCount={product.reviewsCount} />
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
      </main>
      <Footer />
    </>
  );
}
