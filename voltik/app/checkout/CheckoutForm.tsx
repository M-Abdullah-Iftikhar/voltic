'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icons';
import { ProductIllustration } from '@/components/ProductIllustration';
import { Confetti } from '@/components/Confetti';
import { BoltCatcherGame } from '@/components/BoltCatcherGame';
import { brandSound } from '@/lib/brandSound';
import { useCart } from '@/components/CartContext';
import { useUser } from '@/components/UserContext';
import { loadAppliedPromo, clearAppliedPromo, type AppliedPromo } from '@/lib/promoClient';
import type { Product } from '@/lib/types';

type Step = 0 | 1 | 2 | 3;   // 0 contact · 1 shipping · 2 payment · 3 success
const STEP_LABELS = ['Contact', 'Shipping', 'Payment'];

export function CheckoutForm({ products }: { products: Product[] }) {
  const { lines, totalFor, clear } = useCart();
  const { user } = useUser();
  const [step, setStep] = useState<Step>(0);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confettiKey, setConfettiKey] = useState(0);
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', country: '',
    payment: 'Card' as 'Card' | 'COD' | 'UPI'
  });
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);

  // Prefill from signed-in user.
  useEffect(() => {
    if (user) {
      setForm(f => ({ ...f, name: f.name || user.name, email: f.email || user.email }));
    }
  }, [user]);

  // Pick up the promo the user applied on the cart page (localStorage).
  useEffect(() => { setAppliedPromo(loadAppliedPromo()); }, []);

  // Fetch saved addresses for one-click autofill. We only autofill the default
  // address — non-default ones are picked from a dropdown so we don't clobber
  // values the user has already typed.
  type SavedAddr = {
    id: string; label: string; recipient: string; street: string;
    city: string; country: string; phone: string; isDefault?: boolean;
  };
  const [savedAddresses, setSavedAddresses] = useState<SavedAddr[]>([]);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch('/api/me/addresses')
      .then(r => r.ok ? r.json() : { addresses: [] })
      .then(data => {
        if (cancelled) return;
        const list: SavedAddr[] = data.addresses || [];
        setSavedAddresses(list);
        const def = list.find(a => a.isDefault) || list[0];
        if (def) {
          setForm(f => ({
            ...f,
            phone:   f.phone   || def.phone,
            address: f.address || def.street,
            city:    f.city    || def.city,
            country: f.country || def.country,
            name:    f.name    || def.recipient
          }));
        }
      });
    return () => { cancelled = true; };
  }, [user]);

  const useAddress = (a: SavedAddr) => {
    setForm(f => ({
      ...f,
      name: a.recipient,
      phone: a.phone,
      address: a.street,
      city: a.city,
      country: a.country
    }));
  };

  const subtotal = totalFor(products);
  // Re-evaluate promo against the current basket — minBasket might have
  // been satisfied at cart time but no longer is (e.g., user removed lines).
  const promoEligible = appliedPromo && subtotal >= (appliedPromo.minBasket || 0);
  const discount = promoEligible && appliedPromo
    ? appliedPromo.type === 'percent' ? +(subtotal * (appliedPromo.value / 100)).toFixed(2)
    : appliedPromo.type === 'flat'    ? Math.min(subtotal, appliedPromo.value)
    : 0
    : 0;
  const freeShip = !!(promoEligible && appliedPromo?.type === 'shipping');
  const baseAfterDiscount = Math.max(0, subtotal - discount);
  const shipping = freeShip ? 0 : (baseAfterDiscount >= 50 ? 0 : 6.5);
  const tax = baseAfterDiscount * 0.08;
  const total = Math.max(0, baseAfterDiscount + shipping + tax);

  const stepValid = (s: Step): boolean => {
    if (s === 0) return !!form.name && !!form.email && !!form.phone;
    if (s === 1) return !!form.address && !!form.city && !!form.country;
    if (s === 2) return !!form.payment;
    return true;
  };
  const canAdvance = stepValid(step);

  const advance = () => {
    if (!canAdvance) return;
    if (step < 2) setStep((step + 1) as Step);
    else submit();
  };

  const submit = async () => {
    if (lines.length === 0) return;
    setSubmitting(true); setErrorMsg('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: form.name,
          email: form.email,
          total: Math.round(total * 100) / 100,
          status: 'pending',
          items: lines.reduce((s, l) => s + l.qty, 0),
          payment: form.payment,
          lines,
          shipping: { address: form.address, city: form.city, country: form.country, phone: form.phone },
          promoCode: promoEligible ? appliedPromo?.code : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not place order. Please try again.');
        setSubmitting(false);
        return;
      }
      setPlacedOrderId(data.id);
      clear();
      clearAppliedPromo();
      setSubmitting(false);
      setStep(3);
      // Kick a confetti burst + brand chime on success.
      setConfettiKey(k => k + 1);
      brandSound('success');
    } catch (e) {
      setErrorMsg('Network error — please try again.');
      setSubmitting(false);
    }
  };

  /* ── Success state ─────────────────────────────────────── */
  if (step === 3) {
    return (
      <>
        <Confetti trigger={confettiKey} />
        <div className="card p-14 text-center max-w-xl mx-auto">
          <div className="grid place-items-center h-16 w-16 mx-auto rounded-full bg-success/15 text-success">
            <Icon.check width={32} height={32} />
          </div>
          <h2 className="font-display font-bold text-2xl mt-5">Order confirmed!</h2>
          <p className="text-muted text-sm mt-2">
            Your order <span className="font-mono text-ink">{placedOrderId}</span> has been received.
            A confirmation email is on its way.
          </p>
          <div className="mt-7 flex justify-center gap-3 flex-wrap">
            <Link href="/" className="btn-ghost">Back home</Link>
            {user && <Link href={`/account/orders/${encodeURIComponent(placedOrderId)}`} className="btn-ghost">Track this order</Link>}
            <Link href="/shop" className="btn-primary">Keep shopping <Icon.arrow width={14} height={14} /></Link>
          </div>
        </div>
      </>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="card p-14 text-center">
        <h2 className="font-display font-bold text-2xl">Your cart is empty</h2>
        <p className="text-muted text-sm mt-2">Add some products before checking out.</p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">Shop now <Icon.arrow width={14} height={14} /></Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8 relative">
      {/* Place-order overlay — a real mini-game while the server works.
          Sits above everything so the form is visually paused. */}
      {submitting && (
        <div
          role="status"
          aria-label="Placing your order"
          className="fixed inset-0 z-50 grid place-items-center p-4 bg-bg/80 backdrop-blur-md animate-fadein"
        >
          <div className="card p-6 w-full max-w-md">
            <BoltCatcherGame active={submitting} />
          </div>
        </div>
      )}
      <div className="space-y-6">
        <Stepper currentStep={step} setStep={setStep} stepValid={stepValid} />

        {!user && (
          <div className="card p-4 flex items-center gap-3 border-brand/30 bg-brand/5">
            <Icon.user width={18} height={18} className="text-brand" />
            <div className="text-xs text-muted flex-1">
              <span className="text-ink font-semibold">Sign in</span> for faster checkout and order tracking under your account.
            </div>
            <Link href={`/login?next=/checkout`} className="btn-ghost text-xs !px-3 !py-1.5">Sign in</Link>
          </div>
        )}

        {/* Slide container — only one panel is interactive at a time */}
        <div className="relative">
          {step === 0 && (
            <Section title="Contact details">
              <Field label="Full name"><input className="input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
              <Field label="Email"><input className="input" required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></Field>
              <Field label="Phone"><input className="input" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></Field>
            </Section>
          )}
          {step === 1 && (
            <Section title="Shipping address">
              {savedAddresses.length > 0 && (
                <div className="sm:col-span-2 -mt-2 mb-1">
                  <span className="text-xs uppercase tracking-wide text-muted font-semibold">Saved addresses</span>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {savedAddresses.map(a => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => useAddress(a)}
                        className="rounded-full border border-line bg-bg px-3 py-1.5 text-xs hover:border-brand/40 transition flex items-center gap-1.5"
                      >
                        <Icon.spark width={11} height={11} className="text-brand" />
                        <span className="font-semibold">{a.label}</span>
                        <span className="text-muted">· {a.city}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Field label="Street address" full><input className="input" required value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></Field>
              <Field label="City"><input className="input" required value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></Field>
              <Field label="Country"><input className="input" required value={form.country} onChange={e => setForm({...form, country: e.target.value})} /></Field>
            </Section>
          )}
          {step === 2 && (
            <Section title="Payment method">
              <div className="col-span-2 grid grid-cols-3 gap-3">
                {(['Card', 'UPI', 'COD'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({...form, payment: p})}
                    className={`card p-4 text-center transition ${form.payment === p ? 'border-brand ring-2 ring-brand/30' : 'hover:border-brand/50'}`}
                  >
                    <div className="text-sm font-semibold">{p === 'Card' ? 'Credit / Debit Card' : p === 'UPI' ? 'UPI' : 'Cash on Delivery'}</div>
                    <div className="text-xs text-muted mt-1">{p === 'Card' ? 'Visa · MC · Amex' : p === 'UPI' ? 'PayTM · GPay · PhonePe' : 'Pay on arrival'}</div>
                  </button>
                ))}
              </div>
            </Section>
          )}
        </div>

        {errorMsg && (
          <div className="text-sm text-danger flex items-center gap-2"><Icon.close width={14} height={14} /> {errorMsg}</div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1) as Step)}
            disabled={step === 0}
            className="btn-ghost text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon.arrow width={14} height={14} className="rotate-180" /> Back
          </button>
          <button
            type="button"
            onClick={advance}
            disabled={!canAdvance || submitting}
            className="btn-primary !py-3 disabled:opacity-60 flex-1 sm:flex-none sm:min-w-[200px] justify-center"
          >
            {submitting
              ? 'Placing order…'
              : step === 2
                ? <>Place order — ${total.toFixed(2)} <Icon.arrow width={16} height={16} /></>
                : <>Continue <Icon.arrow width={14} height={14} /></>}
          </button>
        </div>
      </div>

      {/* Summary */}
      <aside className="self-start lg:sticky lg:top-20">
        <div className="card p-6">
          <h3 className="font-display font-bold text-lg mb-4">Your order</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {lines.map(l => {
              const p = products.find(x => x.id === l.id);
              if (!p) return null;
              return (
                <div key={l.id} className="flex gap-3 items-center">
                  <ProductIllustration category={p.category} icon={p.icon} className="h-14 w-14 rounded-xl shrink-0" size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold line-clamp-1">{p.name}</div>
                    <div className="text-xs text-muted">Qty {l.qty}</div>
                  </div>
                  <div className="text-sm font-semibold">${(p.price * l.qty).toFixed(2)}</div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-line mt-4 pt-4 space-y-2 text-sm">
            <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
            {appliedPromo && promoEligible && discount > 0 && (
              <Row label={`Promo (${appliedPromo.code})`} value={`-$${discount.toFixed(2)}`} />
            )}
            <Row label="Shipping" value={shipping === 0 ? (freeShip ? 'Free (promo)' : 'Free') : `$${shipping.toFixed(2)}`} />
            <Row label="Tax (8%)" value={`$${tax.toFixed(2)}`} />
            <div className="flex justify-between font-bold pt-2 border-t border-line">
              <span>Total</span>
              <span className="gradient-text">${total.toFixed(2)}</span>
            </div>
            {appliedPromo && !promoEligible && (
              <div className="text-[11px] text-warn flex items-center gap-1 pt-1">
                <Icon.close width={10} height={10} /> Promo <span className="font-mono">{appliedPromo.code}</span> needs ${appliedPromo.minBasket.toFixed(2)}+ subtotal.
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ─── stepper, section, field, row ─────────────────────────────────── */

function Stepper({ currentStep, setStep, stepValid }: {
  currentStep: Step;
  setStep: (s: Step) => void;
  stepValid: (s: Step) => boolean;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {STEP_LABELS.map((label, i) => {
        const done   = i < currentStep;
        const active = i === currentStep;
        const clickable = i < currentStep || stepValid(currentStep);
        return (
          <button
            key={label}
            type="button"
            onClick={() => clickable && setStep(i as Step)}
            disabled={!clickable && i !== currentStep}
            className={`flex items-center gap-2 flex-1 ${i > 0 ? 'before:content-[""] before:block before:flex-1 before:h-px before:bg-line before:mr-2' : ''}`}
          >
            <span
              className={`relative h-8 w-8 grid place-items-center rounded-full shrink-0 text-xs font-bold transition-all ${
                done   ? 'bg-success text-white'
                : active ? 'bg-brand text-white shadow-glow'
                : 'bg-elev text-muted border border-line'
              }`}
            >
              {done ? <Icon.check width={14} height={14} /> : i + 1}
            </span>
            <span className={`text-xs font-semibold hidden sm:inline ${active ? 'text-ink' : 'text-muted'}`}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 animate-slidein">
      <h3 className="font-display font-bold text-lg mb-4">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? 'col-span-2' : ''}`}>
      <span className="text-xs uppercase tracking-wide text-muted font-semibold">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted">{label}</span><span className="font-semibold">{value}</span></div>;
}
