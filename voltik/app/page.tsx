import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { ProductIllustration } from '@/components/ProductIllustration';
import { Icon, type IconKey } from '@/components/Icons';
import { NewsletterForm } from '@/components/NewsletterForm';
import { HeroCarousel } from '@/components/HeroCarousel';
import { TrendingWidget } from '@/components/TrendingWidget';
import { PurchaseTicker } from '@/components/PurchaseTicker';
import { MorphingHeadline } from '@/components/MorphingHeadline';
import { CountUp } from '@/components/CountUp';
import { EditorialStory } from '@/components/EditorialStory';
import { LiveCounter } from '@/components/LiveCounter';
import { LiveShoppersTicker } from '@/components/LiveShoppersTicker';
import { ChargingKitBuilder } from '@/components/ChargingKitBuilder';
import { CustomerStorySpotlight } from '@/components/CustomerStorySpotlight';
import { FlashSaleCountdown } from '@/components/FlashSaleCountdown';
import { ComparisonCards } from '@/components/ComparisonCards';
import { PressLogos } from '@/components/PressLogos';
import { WhyWeLoveIt } from '@/components/WhyWeLoveIt';
import { BrandPattern } from '@/components/BrandPattern';
import { TimeOfDayHue } from '@/components/TimeOfDayHue';
import { AnimatedCategoryShowcase } from '@/components/AnimatedCategoryShowcase';
import { BentoHotGrid } from '@/components/BentoHotGrid';
import { DealStrip } from '@/components/DealStrip';
import { TiltCard } from '@/components/TiltCard';
import { ScrollHueShifter } from '@/components/ScrollHueShifter';
import { SpotlightCursor } from '@/components/SpotlightCursor';
import { PhoneMockup } from '@/components/PhoneMockup';
import { HeroParticles } from '@/components/HeroParticles';
import { HeroShowcaseVideo } from '@/components/HeroShowcaseVideo';
import { CoverflowStrip } from '@/components/CoverflowStrip';
import { MysteryDealCard } from '@/components/MysteryDealCard';
import { CategoryMosaic } from '@/components/CategoryMosaic';
import { CustomerPhotoWall } from '@/components/CustomerPhotoWall';
import { PromoSlot } from '@/components/PromoSlot';
import { SnapScrollIndicator } from '@/components/SnapScrollIndicator';
import { db } from '@/lib/db';
import { getCachedProducts, getCachedCategories } from '@/lib/cache';
import { enrich } from '@/lib/reviews';
import type { EnrichedProduct } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Right-rail snap-scroll markers. IDs match the wrapping divs in the JSX.
const LANDING_SECTIONS = [
  { id: 'snap-hero',         label: 'Hero' },
  { id: 'snap-shop',         label: 'Shop' },
  { id: 'snap-deals',        label: 'Deals' },
  { id: 'snap-trending',     label: 'Trending' },
  { id: 'snap-story',        label: 'Story' },
  { id: 'snap-testimonials', label: 'Reviews' },
  { id: 'snap-newsletter',   label: 'Join' }
];

export default async function HomePage() {
  const [rawProducts, categories, rawOrders, activeAds] = await Promise.all([
    getCachedProducts(),
    getCachedCategories(),
    db.listOrders(),
    db.listActiveAds()
  ]);
  const products = await enrich(rawProducts);
  const rootCategories = categories.filter(c => c.parent === null);

  // Pre-compute the top product per root category (review-weighted, with a
  // price fallback for empty categories) so the animated showcase has
  // something to crossfade into.
  const showcaseTiles = rootCategories.map(c => {
    const inCat = products.filter(p =>
      p.category === c.id || categories.find(x => x.id === p.category)?.parent === c.id);
    const top = inCat
      .slice()
      .sort((a, b) => (b.reviewsCount * b.rating) - (a.reviewsCount * a.rating) || b.price - a.price)[0];
    return {
      id: c.id,
      name: c.name,
      icon: c.icon,
      blurb: c.blurb,
      topProduct: top
        ? { id: top.id, slug: top.slug, name: top.name, icon: top.icon, price: top.price }
        : undefined
    };
  });

  // Polaroid-style mosaic tiles — same root categories with their live count.
  // Computed from the full subtree so "Audio" sums every audio sub-category.
  const mosaicTiles = rootCategories.map(c => {
    const subtreeIds = [c.id, ...categories.filter(x => x.parent === c.id).map(x => x.id)];
    const count = products.filter(p => subtreeIds.includes(p.category)).length;
    return { id: c.id, name: c.name, icon: c.icon, blurb: c.blurb, count };
  });

  // Hero carousel = deals + new + bestsellers (dedup, max 6).
  const heroFeatured = [
    ...products.filter(p => p.badge === 'Hot Deal'),
    ...products.filter(p => p.badge === 'New'),
    ...products.filter(p => p.badge === 'Bestseller')
  ].filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i).slice(0, 6);
  const heroSlides = heroFeatured.length >= 3 ? heroFeatured : products.slice(0, 6);

  const trending  = products
    .filter(p => p.badge === 'Bestseller' || (p.rating >= 4.5 && p.reviewsCount >= 3))
    .sort((a, b) => b.reviewsCount - a.reviewsCount)
    .slice(0, 8);
  const deals     = products.filter(p => p.oldPrice).slice(0, 4);
  const newest    = products.filter(p => p.badge === 'New').slice(0, 4);

  // Anonymised recent orders for the ticker (SSR initial data).
  const tickerItems = rawOrders
    .filter(o => o.status !== 'cancelled')
    .slice(0, 12)
    .map(o => {
      const firstName = (o.customer || 'Someone').split(/\s+/)[0];
      const featureProductId = o.lines?.[0]?.id;
      const product = featureProductId ? products.find(p => p.id === featureProductId) : undefined;
      return {
        id: o.id,
        firstName,
        country: o.shipping?.country || '',
        productName: product?.name || `${o.items} item${o.items === 1 ? '' : 's'}`,
        productId: product?.id,
        date: o.date
      };
    });

  return (
    <>
      <Navbar />
      <TimeOfDayHue />
      <ScrollHueShifter />
      <main id="main">
        <SnapScrollIndicator sections={LANDING_SECTIONS} />
        <div id="snap-hero">
          <Hero heroSlides={heroSlides} trending={trending} tickerItems={tickerItems} />
        </div>
        <MarqueeStrip />
        {/* Admin-driven promo slot — rotator + banner ads created from
            /admin/ads land here. Renders nothing when the queue is
            empty, so the landing stays clean by default. */}
        <PromoSlot
          ads={activeAds.filter(a => a.placement === 'banner' || a.placement === 'rotator')}
          productsById={Object.fromEntries(rawProducts.map(p => [p.id, p]))}
        />
        <CoverflowStrip
          products={trending.length >= 5 ? trending : products.slice(0, 8)}
          title="Editor's picks, on rotation"
          kicker="In rotation"
        />
        <PressLogos />
        <div id="snap-shop">
          <Categories tiles={showcaseTiles} />
        </div>
        <div id="snap-deals">
          <FeaturedDeal deals={deals} />
          <DealStrip products={deals.length >= 4 ? deals : products.filter(p => p.oldPrice).slice(0, 8)} />
          <MysteryDealCard candidates={products.filter(p => p.oldPrice && p.stock > 0)} />
        </div>
        <BentoHotGrid products={trending.length >= 7 ? trending : products.slice(0, 10)} />
        <BrandPattern />
        <div id="snap-trending">
          <Trending products={trending} />
        </div>
        <ChargingKitBuilder catalog={products} />
        <ValueProps />
        <div id="snap-story">
          <EditorialStory />
          <ComparisonCards />
        </div>
        <CategoryMosaic tiles={mosaicTiles} />
        <CustomerPhotoWall products={products} />
        <CustomerStorySpotlight />
        <BrandPattern />
        <NewArrivals products={newest} />
        <div id="snap-testimonials">
          <Testimonials />
        </div>
        <div id="snap-newsletter">
          <NewsletterCTA />
        </div>
      </main>
      <Footer />
    </>
  );
}

/* ---------- Hero ---------- */
function Hero({
  heroSlides, trending, tickerItems
}: {
  heroSlides: EnrichedProduct[];
  trending: EnrichedProduct[];
  tickerItems: React.ComponentProps<typeof PurchaseTicker>['initial'];
}) {
  return (
    <section className="relative overflow-hidden">
      {/* Programmatic 15s product showcase loop behind the hero copy.
          Replaces with a real `<video>` once footage ships. */}
      <HeroShowcaseVideo />
      <div className="absolute inset-0 bg-mesh hero-tod pointer-events-none opacity-60" />
      <div className="absolute inset-0 noise pointer-events-none" />
      <HeroParticles />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent opacity-40" />

      <div className="container-x relative grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="animate-slidein">
          <span className="chip glass">
            <span className="relative grid place-items-center h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success animate-pulseRing"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
            </span>
            New drop — Volt Buds Pro 2 now live
          </span>

          <MorphingHeadline />

          <p className="text-muted text-lg mt-5 max-w-xl leading-relaxed">
            Engineered accessories for the way you charge, listen, capture and create.
            Free worldwide shipping over $50 · 30-day returns · 2-year warranty.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/shop" className="btn-primary">
              Shop the collection
              <Icon.arrow width={16} height={16} />
            </Link>
            <Link href="/shop?category=charging" className="btn-ghost">
              Explore charging
            </Link>
          </div>

          <dl className="mt-10 grid grid-cols-3 max-w-md gap-6">
            <div>
              <dt className="font-display font-bold text-3xl gradient-text">
                <CountUp to={500} suffix="K+" />
              </dt>
              <dd className="text-xs text-muted mt-1">Happy customers</dd>
            </div>
            <div>
              <dt className="font-display font-bold text-3xl gradient-text">
                <CountUp to={4.9} decimals={1} suffix="★" />
              </dt>
              <dd className="text-xs text-muted mt-1">Avg. rating</dd>
            </div>
            <div>
              <dt className="font-display font-bold text-3xl gradient-text">
                <CountUp to={120} />
              </dt>
              <dd className="text-xs text-muted mt-1">Countries shipped</dd>
            </div>
          </dl>

          {/* Live "just purchased" ticker + activity counter + shoppers (desktop / tablet) */}
          <div className="mt-8 hidden sm:flex items-center gap-3 flex-wrap">
            <PurchaseTicker initial={tickerItems} />
            <LiveCounter />
            <LiveShoppersTicker />
          </div>
        </div>

        {/* Hero visual: rotating product ad carousel + floating trending widget */}
        <div className="relative animate-slidein" style={{ animationDelay: '120ms' }}>
          <SpotlightCursor>
            <HeroCarousel products={heroSlides} />
          </SpotlightCursor>

          {/* Floating trending mini-card overlay (hidden on small screens) */}
          <div className="hidden md:block absolute -bottom-6 -left-6 z-10">
            <TiltCard maxTilt={10}>
              <TrendingWidget products={trending} />
            </TiltCard>
          </div>

          {/* Tilted phone mockup — appears on roomy viewports only, sits
              behind the carousel as a "what shopping looks like" cue. */}
          <div className="hidden xl:block absolute -right-10 -bottom-12 z-0 pointer-events-none w-[220px]" aria-hidden>
            <div className="pointer-events-auto">
              <PhoneMockup products={heroSlides} />
            </div>
          </div>

          <div className="absolute -inset-2 rounded-[40px] -z-10 bg-brand/20 blur-3xl pointer-events-none" />
        </div>
      </div>

      {/* Mobile ticker beneath the carousel */}
      <div className="container-x sm:hidden -mt-2 pb-6">
        <PurchaseTicker initial={tickerItems} />
      </div>
    </section>
  );
}

/* ---------- Marquee trust strip ---------- */
function MarqueeStrip() {
  const items = ['Apple MFi Certified', 'GaN III Tech', 'Mil-Spec 1.5m Drop', 'IP67 Waterproof', 'Hi-Res Audio', 'USB-IF Verified', 'CE · FCC · RoHS'];
  return (
    <div className="border-y border-line bg-surface/50 overflow-hidden">
      <div className="container-x py-4 flex items-center gap-10 text-xs uppercase tracking-widest text-muted no-scrollbar overflow-x-auto mask-fade-r">
        {[...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center gap-2 whitespace-nowrap">
            <Icon.check width={14} height={14} className="text-success" /> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Categories ---------- */
function Categories({ tiles }: { tiles: React.ComponentProps<typeof AnimatedCategoryShowcase>['tiles'] }) {
  return (
    <section className="container-x py-20">
      <SectionHead eyebrow="Shop by category" title="Everything your phone needs" subtitle="Eight curated collections covering every accessory your phone could ask for." />
      <AnimatedCategoryShowcase tiles={tiles} />
    </section>
  );
}

/* ---------- Featured deal ---------- */
function FeaturedDeal({ deals }: { deals: EnrichedProduct[] }) {
  const lead = deals[0];
  if (!lead) return null;
  const discount = lead.oldPrice ? Math.round(((lead.oldPrice - lead.price) / lead.oldPrice) * 100) : 0;
  return (
    <section className="container-x">
      <Link href={`/product/${lead.slug || lead.id}`} className="block relative overflow-hidden rounded-3xl border border-line group">
        <div className="absolute inset-0 bg-mesh opacity-80" />
        <div className="relative grid lg:grid-cols-2 gap-6 p-8 sm:p-12">
          <div className="self-center">
            <span className="chip bg-danger text-white">FLASH DEAL · -{discount}%</span>
            <h3 className="font-display font-bold text-3xl sm:text-5xl mt-4 leading-tight text-balance">{lead.name}</h3>
            <p className="text-muted mt-3 max-w-md">{lead.description}</p>
            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-4xl font-bold gradient-text">${lead.price.toFixed(2)}</span>
              <span className="text-muted line-through">${lead.oldPrice?.toFixed(2)}</span>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <span className="btn-primary">View deal <Icon.arrow width={16} height={16} /></span>
              <CountdownPill />
            </div>
            <WhyWeLoveIt product={lead} forceShow size="sm" />
          </div>
          <div className="relative h-72 lg:h-auto">
            <ProductIllustration category={lead.category} icon={lead.icon} size={220} className="absolute inset-4 group-hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
      </Link>
    </section>
  );
}

function CountdownPill() {
  // Real countdown to midnight UTC — replaces the previous fake timer.
  return <FlashSaleCountdown label="Ends in" tone="light" />;
}

/* ---------- Trending ---------- */
function Trending({ products }: { products: EnrichedProduct[] }) {
  return (
    <section className="container-x py-20">
      <SectionHead eyebrow="Trending now" title="What everyone's adding to cart" subtitle="Curated from real customer ratings across the Voltik catalogue." action={{ label:'Shop all', href:'/shop' }} />
      <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {products.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

/* ---------- Value props ---------- */
function ValueProps() {
  const items = [
    { icon: 'truck',    title: 'Free Express Shipping', sub: 'On all orders over $50, 2-day delivery to most cities.' },
    { icon: 'refresh',  title: '30-Day Returns',         sub: 'No questions asked. Free return shipping included.' },
    { icon: 'shield',   title: '2-Year Warranty',        sub: 'Every Voltik product is backed by our promise.' },
    { icon: 'spark',    title: 'Eco-Conscious Packaging',sub: '100% recycled paper, zero single-use plastic.' }
  ] as const;
  return (
    <section className="container-x">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(it => {
          const Glyph = Icon[it.icon as IconKey];
          return (
            <div key={it.title} className="card p-5 flex items-start gap-4">
              <span className="grid place-items-center h-12 w-12 rounded-2xl text-brand bg-brand/10 shrink-0">
                <Glyph width={22} height={22} />
              </span>
              <div>
                <h4 className="font-semibold">{it.title}</h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">{it.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- New Arrivals ---------- */
function NewArrivals({ products }: { products: EnrichedProduct[] }) {
  return (
    <section className="container-x py-20">
      <SectionHead eyebrow="Just dropped" title="New arrivals" subtitle="Fresh-out-of-the-lab accessories from our latest engineering cycle." action={{ label:'See all new', href:'/shop?sort=newest' }} />
      <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {products.length > 0 ? products.map(p => <ProductCard key={p.id} product={p} />) : (
          <p className="text-muted text-sm col-span-full">More new arrivals coming soon.</p>
        )}
      </div>
    </section>
  );
}

/* ---------- Testimonials ---------- */
function Testimonials() {
  const reviews = [
    { name: 'Maya R.',    role: 'Photographer · Berlin',  quote: 'The CinePro lens kit replaced my GoPro for travel B-roll. Stupidly good optics for the price.', rating: 5 },
    { name: 'Daniel K.',  role: 'Engineer · SF',          quote: 'GaN Cube 100W charges my MacBook, iPhone and Pixel simultaneously without breaking a sweat.', rating: 5 },
    { name: 'Priya S.',   role: 'Creator · Mumbai',       quote: 'Volt Buds Pro 2 have the cleanest ANC I have ever used. Spatial audio is genuinely fun.', rating: 5 },
    { name: 'Hassan R.',  role: 'Student · Karachi',      quote: 'Diamond 9H screen guards have survived three drops onto tile. Genuine 9H, not marketing 9H.', rating: 5 }
  ];
  return (
    <section className="container-x py-20">
      <SectionHead eyebrow="Loved by 500K+" title="People are saying" subtitle="Verified reviews from Voltik customers around the world." />
      <div className="mt-10 grid lg:grid-cols-4 sm:grid-cols-2 gap-4">
        {reviews.map(r => (
          <figure key={r.name} className="card p-5 flex flex-col h-full">
            <div className="flex gap-0.5 text-warn mb-3">
              {[...Array(r.rating)].map((_, i) => <Icon.star key={i} width={14} height={14} />)}
            </div>
            <blockquote className="text-sm leading-relaxed text-ink">“{r.quote}”</blockquote>
            <figcaption className="mt-4 pt-4 border-t border-line">
              <div className="text-sm font-semibold">{r.name}</div>
              <div className="text-xs text-muted">{r.role}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ---------- Newsletter ---------- */
function NewsletterCTA() {
  return (
    <section className="container-x pb-10">
      {/* Gradient halo — sits behind the card so the section reads as glowing */}
      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-px rounded-[28px] pointer-events-none opacity-90"
          style={{
            background: 'linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand2)) 45%, rgb(var(--accent2)))',
            filter: 'blur(14px)'
          }}
        />
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-10 sm:p-14 text-center">
          <div className="absolute inset-0 bg-mesh opacity-80" />
          <div className="relative">
            <span
              className="inline-flex items-center gap-1.5 chip mb-5 text-white font-bold"
              style={{ background: 'linear-gradient(135deg,rgb(var(--accent2)),rgb(var(--brand)))' }}
            >
              <Icon.spark width={11} height={11} />
              10% off your first order
            </span>
            <h3 className="font-display font-bold text-3xl sm:text-5xl text-balance">Get on the list.</h3>
            <p className="text-muted mt-3 max-w-xl mx-auto">Join the Voltik newsletter for product drops, behind-the-scenes engineering, and member-only deals.</p>
            <NewsletterForm />
            <p className="mt-3 text-[11px] text-muted">
              No spam. Unsubscribe in one tap. ·{' '}
              <Link href="/spin" className="text-brand hover:underline font-semibold">
                Or spin the wheel for an instant code ⚡
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Reusable section head ---------- */
function SectionHead({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="max-w-xl">
        <span className="text-xs uppercase tracking-[0.18em] font-semibold text-brand">{eyebrow}</span>
        <h2 className="font-display font-bold text-3xl sm:text-4xl mt-2 leading-tight text-balance">{title}</h2>
        <p className="text-muted mt-2">{subtitle}</p>
      </div>
      {action && (
        <Link href={action.href} className="btn-ghost shrink-0 self-start sm:self-end">
          {action.label} <Icon.arrow width={14} height={14} />
        </Link>
      )}
    </div>
  );
}
