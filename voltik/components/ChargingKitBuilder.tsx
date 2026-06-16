'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import { useCart } from './CartContext';
import { haptic } from '@/lib/haptics';
import type { EnrichedProduct } from '@/lib/types';

interface Props {
  /** Whole catalogue — the builder filters down by category at each step. */
  catalog: EnrichedProduct[];
}

type StepKey = 'phone' | 'cable' | 'power' | 'extra';

interface StepDef {
  key: StepKey;
  title: string;
  subtitle: string;
  /** Which categories qualify for this step's options. */
  filter: (p: EnrichedProduct) => boolean;
  optional?: boolean;
  /** Cap so the picker grid stays digestible. */
  limit?: number;
}

const STEPS: StepDef[] = [
  {
    key: 'phone',
    title: 'Pick the phone',
    subtitle: "Tell us what you're charging so we can match the wattage.",
    filter: p => p.category === 'cases' || /phone|mag(safe)?|iphone|pixel|galaxy/i.test(p.name)
  },
  {
    key: 'cable',
    title: 'Now the cable',
    subtitle: 'USB-C, Lightning, or braided — pick the everyday one.',
    filter: p => p.category === 'cables' || /cable|cord/i.test(p.name)
  },
  {
    key: 'power',
    title: 'Then the power',
    subtitle: 'Wall plug, GaN block, or a slim power bank for travel.',
    filter: p => p.category === 'chargers' || /power|gan|cube|charger|bank/i.test(p.name),
    limit: 8
  },
  {
    key: 'extra',
    title: 'Optional: an extra',
    subtitle: 'Earbuds, screen guard, mount — anything to round out the kit.',
    filter: p => !/cable|cord|charger|power|gan/i.test(p.name),
    optional: true,
    limit: 8
  }
];

/**
 * 4-step "build your kit" wizard. Each step picks one product from a
 * filtered slice of the catalogue; the running total + live preview card
 * update on the right. Final step lets the user push the whole bundle
 * into the cart with one tap and a haptic confirmation.
 *
 * Uses only the catalogue we already fetch — no extra API trips.
 */
export function ChargingKitBuilder({ catalog }: Props) {
  const { add } = useCart();
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<Record<StepKey, string | null>>({
    phone: null, cable: null, power: null, extra: null
  });
  const [added, setAdded] = useState(false);

  const current = STEPS[step];
  const options = useMemo(() => {
    const filtered = catalog.filter(current.filter).slice(0, current.limit || 6);
    // If the filter came up empty, fall back to a few generic recommendations
    // so the user is never stuck on an empty step.
    if (filtered.length === 0) return catalog.slice(0, 6);
    return filtered;
  }, [catalog, current]);

  const pickedProducts = useMemo(() => {
    const out: { step: StepKey; product: EnrichedProduct }[] = [];
    for (const s of STEPS) {
      const id = picks[s.key];
      if (!id) continue;
      const p = catalog.find(x => x.id === id);
      if (p) out.push({ step: s.key, product: p });
    }
    return out;
  }, [picks, catalog]);

  const total = pickedProducts.reduce((s, x) => s + x.product.price, 0);
  // Five percent off when all three required steps are filled — the small
  // carrot for finishing the flow.
  const bundleDiscount = picks.phone && picks.cable && picks.power
    ? Math.round(total * 0.05 * 100) / 100
    : 0;

  const choose = (id: string) => {
    setPicks(prev => ({ ...prev, [current.key]: id }));
    // Auto-advance, unless we're on the final step.
    if (step < STEPS.length - 1) {
      setTimeout(() => setStep(s => s + 1), 280);
    }
  };

  const addAll = () => {
    for (const { product } of pickedProducts) add(product.id, 1);
    haptic('success');
    setAdded(true);
    setTimeout(() => setAdded(false), 2400);
  };

  const reset = () => {
    setPicks({ phone: null, cable: null, power: null, extra: null });
    setStep(0);
    setAdded(false);
  };

  const isCurrentRequiredAndUnpicked = !current.optional && !picks[current.key];

  return (
    <section className="container-x py-16">
      <div className="text-center mb-8">
        <span className="text-xs uppercase tracking-[0.18em] font-semibold text-brand">Free kit builder</span>
        <h2 className="font-display font-bold text-3xl sm:text-4xl mt-2 leading-tight">Build your charging kit in 60 seconds.</h2>
        <p className="text-muted text-sm mt-2 max-w-xl mx-auto">
          Phone → cable → power → bonus. Finish all three and we'll knock 5% off the bundle.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="card p-6">
          {/* Progress bar + step chips */}
          <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
            <div className="flex items-center gap-1.5 flex-wrap">
              {STEPS.map((s, i) => {
                const done = !!picks[s.key];
                const active = i === step;
                return (
                  <button
                    key={s.key}
                    onClick={() => setStep(i)}
                    aria-current={active ? 'step' : undefined}
                    className={`chip border transition ${
                      active ? 'bg-brand text-white border-brand'
                      : done   ? 'bg-success/15 text-success border-success/30'
                      :          'border-line text-muted hover:text-ink'
                    }`}
                  >
                    <span className="font-mono mr-1">{i + 1}</span>
                    {s.title.replace(/^(Pick|Now|Then|Optional:)\s+/, '')}
                  </button>
                );
              })}
            </div>
            <button onClick={reset} className="text-xs text-muted hover:text-danger">
              Reset
            </button>
          </div>

          <div>
            <h3 className="font-display font-bold text-xl">{current.title}</h3>
            <p className="text-sm text-muted mt-1">{current.subtitle}</p>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {options.map(p => {
              const isChosen = picks[current.key] === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => choose(p.id)}
                  className={`relative rounded-2xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    isChosen
                      ? 'border-brand bg-brand/5 ring-2 ring-brand/30'
                      : 'border-line hover:border-brand/40 hover:bg-elev/40'
                  }`}
                >
                  {isChosen && (
                    <span className="absolute top-2 right-2 grid place-items-center h-6 w-6 rounded-full bg-brand text-white">
                      <Icon.check width={12} height={12} />
                    </span>
                  )}
                  <ProductIllustration
                    category={p.category}
                    icon={p.icon}
                    className="aspect-square rounded-xl"
                    size={48}
                  />
                  <div className="mt-2 text-xs font-semibold text-ink line-clamp-1">{p.name}</div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-sm font-bold gradient-text">${p.price.toFixed(2)}</span>
                    {p.oldPrice && <span className="text-[10px] text-muted line-through">${p.oldPrice.toFixed(2)}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="btn-ghost text-sm disabled:opacity-40"
            >
              <Icon.arrow width={12} height={12} className="rotate-180" /> Back
            </button>
            {current.optional && !picks[current.key] && step < STEPS.length - 1 && (
              <button onClick={() => setStep(s => s + 1)} className="text-xs text-muted hover:text-ink">
                Skip this step →
              </button>
            )}
            <button
              onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
              disabled={step === STEPS.length - 1 || isCurrentRequiredAndUnpicked}
              className="btn-primary text-sm disabled:opacity-50"
            >
              Next <Icon.arrow width={12} height={12} />
            </button>
          </div>
        </div>

        {/* Running summary */}
        <aside className="card p-6 self-start lg:sticky lg:top-20">
          <h3 className="font-display font-bold text-lg">Your kit</h3>
          {pickedProducts.length === 0 ? (
            <p className="text-sm text-muted mt-3">Pick a phone to get started — your kit lands here.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pickedProducts.map(({ product }) => (
                <li key={product.id} className="flex items-center gap-3">
                  <ProductIllustration
                    category={product.category}
                    icon={product.icon}
                    className="h-10 w-10 rounded-lg shrink-0"
                    size={18}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ink line-clamp-1">{product.name}</div>
                    <div className="text-[11px] text-muted">{product.brand}</div>
                  </div>
                  <span className="text-sm font-semibold">${product.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}

          {pickedProducts.length > 0 && (
            <div className="mt-5 pt-5 border-t border-line/60 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold">${total.toFixed(2)}</span>
              </div>
              {bundleDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Bundle discount · 5%</span>
                  <span className="font-semibold">−${bundleDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-line/60">
                <span>Kit total</span>
                <span className="gradient-text">${(total - bundleDiscount).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2">
            <button
              onClick={addAll}
              disabled={pickedProducts.length === 0}
              className={`btn-primary w-full justify-center disabled:opacity-50 ${added ? '!bg-success' : ''}`}
            >
              {added
                ? <><Icon.check width={14} height={14} /> Added to cart</>
                : <><Icon.cart width={14} height={14} /> Add kit to cart</>}
            </button>
            <Link href="/cart" className="btn-ghost w-full justify-center text-sm">
              View cart <Icon.arrow width={12} height={12} />
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
