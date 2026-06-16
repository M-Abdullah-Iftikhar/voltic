import Link from 'next/link';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';

/**
 * Editorial "Why Voltik" story section. Breaks the catalogue rhythm with
 * a magazine-style 2-column layout + three engineering claims as cards.
 * All neutral palette, brand color reserved for accents.
 */
export function EditorialStory() {
  return (
    <section className="container-x py-20">
      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
        {/* Left visual stack */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <ProductIllustration category="charging" icon="bolt"     size={64} className="aspect-square rounded-3xl" />
              <ProductIllustration category="audio"    icon="earbud"   size={64} className="aspect-[4/3] rounded-3xl" />
            </div>
            <div className="space-y-4 mt-10">
              <ProductIllustration category="cases"    icon="case"     size={64} className="aspect-[4/3] rounded-3xl" />
              <ProductIllustration category="storage"  icon="chip"     size={64} className="aspect-square rounded-3xl" />
            </div>
          </div>
          {/* Floating spec callout */}
          <div className="absolute -bottom-4 -right-4 glass rounded-2xl px-4 py-3 shadow-soft hidden sm:block">
            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Drop tested</div>
            <div className="font-display font-bold text-xl">3 m</div>
          </div>
          <div className="absolute -top-4 -left-4 glass rounded-2xl px-4 py-3 shadow-soft hidden sm:block">
            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Avg. lab cycles</div>
            <div className="font-display font-bold text-xl">20,000</div>
          </div>
        </div>

        {/* Right copy */}
        <div>
          <span className="text-xs uppercase tracking-[0.18em] font-semibold text-brand">Engineered, not assembled</span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl mt-2 leading-tight text-balance">
            The accessory aisle, rewritten.
          </h2>
          <p className="text-muted mt-4 leading-relaxed">
            We obsess over every detail other brands skip — the e-marker chip
            inside the cable, the magnet count inside the case, the bio-cellulose
            ratio in the driver. Every Voltik product earns its place by passing
            our lab before it sees a shelf.
          </p>

          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            <ClaimCard icon="check"  k="MFi & USB-IF" v="Real certifications, not stickers" />
            <ClaimCard icon="shield" k="2-year warranty" v="Backed by us, no hoops" />
            <ClaimCard icon="spark"  k="Built to last"   v="20,000-cycle stress tested" />
          </div>

          <div className="mt-7 flex items-center gap-3">
            <Link href="/shop" className="btn-primary">
              Shop the engineering <Icon.arrow width={14} height={14} />
            </Link>
            <Link href="/shop?category=charging" className="text-sm text-muted hover:text-ink underline-offset-4 hover:underline">
              Read the spec breakdown →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClaimCard({ icon, k, v }: { icon: keyof typeof Icon; k: string; v: string }) {
  const Glyph = Icon[icon];
  return (
    <div className="card p-3 flex items-start gap-2.5">
      <span className="grid place-items-center h-8 w-8 rounded-lg bg-brand/10 text-brand shrink-0">
        <Glyph width={15} height={15} />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-ink">{k}</div>
        <div className="text-[11px] text-muted leading-snug mt-0.5">{v}</div>
      </div>
    </div>
  );
}
