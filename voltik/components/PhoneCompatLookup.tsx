'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import type { EnrichedProduct } from '@/lib/types';

interface Phone {
  id: string;
  /** Display label (e.g. "iPhone 15 Pro"). */
  label: string;
  /** Manufacturer for the chip on the right. */
  brand: 'Apple' | 'Samsung' | 'Google' | 'OnePlus' | 'Sony' | 'Other';
  /** Charge port. Drives cable category matching. */
  port: 'USB-C' | 'Lightning';
  /** Whether the phone supports MagSafe-style magnetic wireless. */
  magsafe?: boolean;
}

const PHONES: Phone[] = [
  { id: 'ip15pm', label: 'iPhone 15 Pro Max', brand: 'Apple',   port: 'USB-C',    magsafe: true },
  { id: 'ip15',   label: 'iPhone 15',         brand: 'Apple',   port: 'USB-C',    magsafe: true },
  { id: 'ip14p',  label: 'iPhone 14 Pro',     brand: 'Apple',   port: 'Lightning',magsafe: true },
  { id: 'ip13',   label: 'iPhone 13',         brand: 'Apple',   port: 'Lightning',magsafe: true },
  { id: 'ipse',   label: 'iPhone SE',         brand: 'Apple',   port: 'Lightning' },
  { id: 's24u',   label: 'Galaxy S24 Ultra',  brand: 'Samsung', port: 'USB-C' },
  { id: 's24',    label: 'Galaxy S24',        brand: 'Samsung', port: 'USB-C' },
  { id: 's23',    label: 'Galaxy S23',        brand: 'Samsung', port: 'USB-C' },
  { id: 'p9p',    label: 'Pixel 9 Pro',       brand: 'Google',  port: 'USB-C' },
  { id: 'p8',     label: 'Pixel 8',           brand: 'Google',  port: 'USB-C' },
  { id: 'op12',   label: 'OnePlus 12',        brand: 'OnePlus', port: 'USB-C' },
  { id: 'xperia', label: 'Sony Xperia 1 VI',  brand: 'Sony',    port: 'USB-C' }
];

/**
 * Lookup-and-filter widget: pick a phone (with fuzzy match) and watch the
 * compatible-product grid fade + slide in. The match is heuristic over
 * the product name/description — we look for the phone's port and
 * MagSafe support in the catalog so cables, chargers, and cases sort
 * to the top.
 *
 * Designed to live on the shop / discovery surfaces as a "what fits
 * mine?" shortcut. No real device DB or LLM.
 */
export function PhoneCompatLookup({ products }: { products: EnrichedProduct[] }) {
  const [q, setQ] = useState('');
  const [phone, setPhone] = useState<Phone | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const candidates = useMemo(() => {
    if (!q.trim()) return PHONES;
    const needle = q.toLowerCase();
    return PHONES.filter(p =>
      p.label.toLowerCase().includes(needle) ||
      p.brand.toLowerCase().includes(needle));
  }, [q]);

  const compat = useMemo(() => {
    if (!phone) return [] as EnrichedProduct[];
    return scoreCompat(products, phone).slice(0, 6);
  }, [products, phone]);

  return (
    <section className="container-x py-16">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-6">
          <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand">Compatibility check</span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl mt-2 leading-tight">
            What fits your phone?
          </h2>
          <p className="text-muted text-sm mt-2 max-w-md mx-auto">
            Type the model — we'll filter the shelf to accessories that actually plug, snap, or stick.
          </p>
        </header>

        <div ref={containerRef} className="relative max-w-md mx-auto">
          <div className={`flex items-center gap-2 rounded-full border ${phone ? 'border-brand' : 'border-line'} bg-surface px-4 py-2.5 transition`}>
            <Icon.search width={14} height={14} className="text-muted" />
            <input
              type="text"
              value={phone ? phone.label : q}
              onChange={(e) => { setQ(e.target.value); setPhone(null); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="iPhone 15, Pixel 9, Galaxy S24…"
              className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted"
              suppressHydrationWarning
            />
            {phone && (
              <button
                onClick={() => { setPhone(null); setQ(''); setOpen(true); }}
                aria-label="Clear phone"
                className="text-muted hover:text-ink"
              >
                <Icon.close width={12} height={12} />
              </button>
            )}
          </div>

          {open && !phone && candidates.length > 0 && (
            <div role="listbox" className="absolute z-30 inset-x-0 mt-2 card p-1 max-h-[280px] overflow-y-auto animate-slidein">
              {candidates.map(p => (
                <button
                  key={p.id}
                  role="option"
                  aria-selected={false}
                  onClick={() => { setPhone(p); setOpen(false); setQ(''); }}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-elev transition text-left"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink">{p.label}</div>
                    <div className="text-[10px] text-muted">
                      {p.port}{p.magsafe ? ' · MagSafe' : ''}
                    </div>
                  </div>
                  <span className="chip bg-elev text-muted !text-[9px]">{p.brand}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Compatibility badges describe what we matched on */}
        {phone && (
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-xs">
            <span className="chip bg-brand/10 text-brand">{phone.port}</span>
            {phone.magsafe && <span className="chip bg-accent2/15 text-accent2">MagSafe</span>}
            <span className="chip border border-line text-muted">{phone.brand}</span>
          </div>
        )}

        {/* Results grid — animates in with a staggered fade */}
        {phone && (
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {compat.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3 card p-8 text-center">
                <p className="text-sm text-muted">No perfect matches in this catalogue yet. <Link href="/shop" className="text-brand hover:underline">Browse the whole shelf</Link> instead.</p>
              </div>
            ) : (
              compat.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug || p.id}`}
                  className="card card-hover p-4 flex flex-col relative animate-slidein"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <ProductIllustration
                    category={p.category}
                    icon={p.icon}
                    className="aspect-square rounded-xl"
                    size={72}
                  />
                  <div className="mt-3 flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{p.brand}</div>
                    <div className="text-sm font-semibold text-ink line-clamp-1 mt-0.5">{p.name}</div>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="text-base font-bold gradient-text">${p.price.toFixed(2)}</span>
                    {p.reviewsCount > 0 && (
                      <span className="text-[11px] text-muted">★ {p.rating.toFixed(1)}</span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function scoreCompat(catalog: EnrichedProduct[], phone: Phone): EnrichedProduct[] {
  const scored = catalog.map(p => {
    const haystack = `${p.name} ${p.description}`.toLowerCase();
    let score = 0;

    // Port match — strongest signal for cables/chargers.
    if (phone.port === 'USB-C'    && /usb-?c|type-?c/i.test(haystack)) score += 30;
    if (phone.port === 'Lightning'&& /lightning|mfi/i.test(haystack))  score += 30;

    // MagSafe match if the phone supports it.
    if (phone.magsafe && /magsafe|magnetic|qi2/i.test(haystack)) score += 25;

    // Brand-named cases & matched accessories.
    if (new RegExp(phone.brand, 'i').test(haystack)) score += 8;

    // Universal nudges.
    score += Math.min(8, p.rating * 1.6);
    if (p.stock <= 0) score -= 50;

    return { p, score };
  });
  return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.p);
}
