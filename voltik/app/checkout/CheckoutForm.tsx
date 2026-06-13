'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icons';
import { ProductIllustration } from '@/components/ProductIllustration';
import { useCart } from '@/components/CartContext';
import { useUser } from '@/components/UserContext';
import type { Product } from '@/lib/types';

export function CheckoutForm({ products }: { products: Product[] }) {
  const { lines, totalFor, clear } = useCart();
  const { user } = useUser();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', country: '',
    payment: 'Card' as 'Card' | 'COD' | 'UPI'
  });

  // Prefill with the signed-in user's details once known.
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name: f.name || user.name,
        email: f.email || user.email
      }));
    }
  }, [user]);

  const subtotal = totalFor(products);
  const shipping = subtotal >= 50 ? 0 : 6.50;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || lines.length === 0) return;
    setSubmitting(true);

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
        shipping: { address: form.address, city: form.city, country: form.country, phone: form.phone }
      })
    });
    const data = await res.json();
    setPlacedOrderId(data.id);
    clear();
    setSubmitting(false);
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="card p-14 text-center max-w-xl mx-auto">
        <div className="grid place-items-center h-16 w-16 mx-auto rounded-full bg-success/15 text-success">
          <Icon.check width={32} height={32} />
        </div>
        <h2 className="font-display font-bold text-2xl mt-5">Order confirmed!</h2>
        <p className="text-muted text-sm mt-2">
          Your order <span className="font-mono text-ink">{placedOrderId}</span> has been received. A confirmation email is on its way.
        </p>
        <div className="mt-7 flex justify-center gap-3 flex-wrap">
          <Link href="/" className="btn-ghost">Back home</Link>
          {user && <Link href={`/account/orders/${encodeURIComponent(placedOrderId)}`} className="btn-ghost">Track this order</Link>}
          <Link href="/shop" className="btn-primary">Keep shopping <Icon.arrow width={14} height={14} /></Link>
        </div>
      </div>
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
    <form onSubmit={submit} className="grid lg:grid-cols-[1fr_360px] gap-8">
      <div className="space-y-6">
        {!user && (
          <div className="card p-4 flex items-center gap-3 border-brand/30 bg-brand/5">
            <Icon.user width={18} height={18} className="text-brand" />
            <div className="text-xs text-muted flex-1">
              <span className="text-ink font-semibold">Sign in</span> for faster checkout and order tracking under your account.
            </div>
            <Link href={`/login?next=/checkout`} className="btn-ghost text-xs !px-3 !py-1.5">Sign in</Link>
          </div>
        )}

        <Section title="Contact details">
          <Field label="Full name"><input className="input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
          <Field label="Email"><input className="input" required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></Field>
          <Field label="Phone"><input className="input" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></Field>
        </Section>

        <Section title="Shipping address">
          <Field label="Street address" full><input className="input" required value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></Field>
          <Field label="City"><input className="input" required value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></Field>
          <Field label="Country"><input className="input" required value={form.country} onChange={e => setForm({...form, country: e.target.value})} /></Field>
        </Section>

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

        <button type="submit" disabled={submitting} className="btn-primary w-full justify-center !py-3 disabled:opacity-60">
          {submitting ? 'Placing order…' : <>Place order — ${total.toFixed(2)} <Icon.arrow width={16} height={16} /></>}
        </button>
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
            <Row label="Shipping" value={shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`} />
            <Row label="Tax (8%)" value={`$${tax.toFixed(2)}`} />
            <div className="flex justify-between font-bold pt-2 border-t border-line">
              <span>Total</span>
              <span className="gradient-text">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </aside>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
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
