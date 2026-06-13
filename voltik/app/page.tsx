import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { ProductIllustration } from '@/components/ProductIllustration';
import { Icon, type IconKey } from '@/components/Icons';
import { NewsletterForm } from '@/components/NewsletterForm';
import { db } from '@/lib/db';
import { enrich } from '@/lib/reviews';
import type { EnrichedProduct } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [rawProducts, categories] = await Promise.all([db.listProducts(), db.listCategories()]);
  const products = await enrich(rawProducts);
  const rootCategories = categories.filter(c => c.parent === null);
  // Trending = either a marketing badge OR a strong real rating (≥4.5 with ≥3 reviews)
  const trending  = products
    .filter(p => p.badge === 'Bestseller' || (p.rating >= 4.5 && p.reviewsCount >= 3))
    .sort((a, b) => b.reviewsCount - a.reviewsCount)
    .slice(0, 8);
  const deals     = products.filter(p => p.oldPrice).slice(0, 4);
  const newest    = products.filter(p => p.badge === 'New').slice(0, 4);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <MarqueeStrip />
        <Categories categories={rootCategories} />
        <FeaturedDeal deals={deals} />
        <Trending products={trending} />
        <ValueProps />
        <NewArrivals products={newest} />
        <Testimonials />
        <NewsletterCTA />
      </main>
      <Footer />
    </>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div className="absolute inset-0 noise pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent opacity-40" />

      <div className="container-x relative grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center pt-14 pb-20 lg:pt-24 lg:pb-32">
        <div className="animate-slidein">
          <span className="chip glass">
            <span className="relative grid place-items-center h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success animate-pulseRing"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
            </span>
            New drop — Volt Buds Pro 2 now live
          </span>

          <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] mt-5 text-balance">
            Power up your <span className="gradient-text">mobile life.</span>
          </h1>
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

          <dl className="mt-12 grid grid-cols-3 max-w-md gap-6">
            {[
              { k: '500K+', v: 'Happy customers' },
              { k: '4.9★',  v: 'Avg. rating' },
              { k: '120',   v: 'Countries shipped' }
            ].map(s => (
              <div key={s.v}>
                <dt className="font-display font-bold text-3xl gradient-text">{s.k}</dt>
                <dd className="text-xs text-muted mt-1">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Hero visual: floating product collage */}
        <div className="relative h-[420px] sm:h-[520px] lg:h-[600px] animate-slidein" style={{ animationDelay: '120ms' }}>
          <div className="absolute inset-0 rounded-[40px] ring-glow" />
          <FloatCard className="left-4 top-10 w-44 sm:w-56 rotate-[-6deg] animate-floaty" delay={0} category="audio" icon="earbud" title="Volt Buds Pro 2" sub="ANC · 32hr" />
          <FloatCard className="right-2 top-2 w-44 sm:w-56 rotate-[5deg] animate-floaty" delay={1.5} category="charging" icon="wireless" title="StackPad 3-in-1" sub="MagSafe · 15W" />
          <FloatCard className="left-12 bottom-2 w-44 sm:w-60 rotate-[3deg] animate-floaty" delay={0.8} category="charging" icon="battery" title="PowerCore 20K" sub="30W PD · Slim" />
          <FloatCard className="right-6 bottom-14 w-44 sm:w-56 rotate-[-8deg] animate-floaty" delay={2.2} category="cases" icon="case" title="AeroMag Case" sub="MagSafe · 32g" />

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 sm:w-72 h-56 sm:h-72 rounded-full bg-brand/30 blur-3xl" />
        </div>
      </div>
    </section>
  );
}

function FloatCard({ className = '', delay = 0, category, icon, title, sub }: { className?: string; delay?: number; category: string; icon: string; title: string; sub: string }) {
  return (
    <div className={`absolute glass rounded-3xl p-3 shadow-card ${className}`} style={{ animationDelay: `${delay}s` }}>
      <ProductIllustration category={category} icon={icon} className="aspect-square rounded-2xl" size={56} />
      <div className="mt-3 px-1">
        <div className="text-sm font-semibold text-ink line-clamp-1">{title}</div>
        <div className="text-[11px] text-muted">{sub}</div>
      </div>
    </div>
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
function Categories({ categories }: { categories: { id: string; name: string; icon: string; blurb: string }[] }) {
  return (
    <section className="container-x py-20">
      <SectionHead eyebrow="Shop by category" title="Everything your phone needs" subtitle="Eight curated collections covering every accessory your phone could ask for." />
      <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((c) => {
          const Glyph = Icon[c.icon as IconKey] || Icon.box;
          return (
            <Link key={c.id} href={`/shop?category=${c.id}`} className="group card card-hover p-5 relative overflow-hidden">
              <ProductIllustration category={c.id} icon={c.icon} className="aspect-[5/3] rounded-xl" size={72} />
              <div className="mt-4">
                <h3 className="font-semibold text-ink flex items-center gap-2">
                  {c.name}
                  <Icon.arrow width={14} height={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition text-brand" />
                </h3>
                <p className="text-xs text-muted mt-1 line-clamp-1">{c.blurb}</p>
              </div>
            </Link>
          );
        })}
      </div>
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
      <Link href={`/product/${lead.id}`} className="block relative overflow-hidden rounded-3xl border border-line group">
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
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted">
      <Icon.refresh width={14} height={14} />
      Ends in <span className="font-mono font-semibold text-ink">02:14:47</span>
    </div>
  );
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
      <div className="relative overflow-hidden rounded-3xl border border-line p-10 sm:p-14 text-center">
        <div className="absolute inset-0 bg-mesh opacity-80" />
        <div className="relative">
          <h3 className="font-display font-bold text-3xl sm:text-5xl text-balance">Get 10% off your first order.</h3>
          <p className="text-muted mt-3 max-w-xl mx-auto">Join the Voltik newsletter for product drops, behind-the-scenes engineering, and member-only deals.</p>
          <NewsletterForm />
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
