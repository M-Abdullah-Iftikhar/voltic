'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import type { EnrichedProduct } from '@/lib/types';

interface Parsed {
  /** Cleaned-up query with the structured tokens stripped out. */
  rest: string;
  port?: 'USB-C' | 'Lightning';
  maxPrice?: number;
  minPrice?: number;
  watts?: number;
  features: string[];
  category?: 'charger' | 'cable' | 'audio' | 'case' | 'wireless' | 'photo' | 'power';
}

interface Suggestion { label: string; query: string }

const SUGGESTIONS: Suggestion[] = [
  { label: 'USB-C charger under $40 with PD',   query: 'USB-C charger under $40 with PD' },
  { label: 'MagSafe wireless under $50',        query: 'MagSafe wireless under $50' },
  { label: 'Lightning cable braided',           query: 'Lightning cable braided' },
  { label: 'GaN 65W charger',                   query: 'GaN 65W charger' },
  { label: 'Earbuds with ANC under $80',        query: 'Earbuds with ANC under $80' }
];

/**
 * "Magic" search: parse a natural-language query into structured intent
 * (port, price, wattage, features, category) and rank the catalog
 * against it. Pure heuristic — regex + scoring, no LLM — but the parse
 * preview makes it *feel* like the box understood the shopper.
 */
export function MagicSearch({ products }: { products: EnrichedProduct[] }) {
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState('');

  const parsed = useMemo(() => parseQuery(submitted), [submitted]);
  const results = useMemo(
    () => submitted ? rankProducts(products, parsed).slice(0, 9) : [],
    [products, parsed, submitted]
  );

  const tryIt = (s: string) => { setQ(s); setSubmitted(s); };

  // If the user clears the box, also drop the result set so the empty
  // state returns instead of leaving stale matches behind.
  useEffect(() => { if (!q.trim()) setSubmitted(''); }, [q]);

  return (
    <section className="container-x py-16">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand">Magic search</span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl mt-2 leading-tight">
            Just say what you need.
          </h1>
          <p className="text-muted text-sm mt-3 max-w-md mx-auto">
            Type the spec in plain English — port, budget, watts, feature flags. We'll parse it,
            show you what we heard, and serve up the catalog matches.
          </p>
        </header>

        <form
          onSubmit={e => { e.preventDefault(); setSubmitted(q); }}
          className="relative"
        >
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 shadow-soft focus-within:border-brand transition">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-brand to-brand2 text-white shrink-0">
              <Icon.spark width={16} height={16} />
            </span>
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="e.g. USB-C charger under $40 with PD"
              className="bg-transparent text-base outline-none flex-1 placeholder:text-muted"
              suppressHydrationWarning
            />
            {q && (
              <button
                type="button"
                onClick={() => { setQ(''); setSubmitted(''); }}
                aria-label="Clear"
                className="text-muted hover:text-ink"
              >
                <Icon.close width={14} height={14} />
              </button>
            )}
            <button
              type="submit"
              className="btn-primary !py-1.5 !px-3 text-xs shrink-0"
              aria-label="Run magic search"
            >
              Search <Icon.arrow width={11} height={11} />
            </button>
          </div>
        </form>

        {/* Suggestion chips when the user hasn't typed anything */}
        {!submitted && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] text-muted mr-1">Try:</span>
            {SUGGESTIONS.map(s => (
              <button
                key={s.query}
                onClick={() => tryIt(s.query)}
                className="chip border border-line bg-surface hover:border-brand/40 hover:bg-elev/60 transition"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Parsed intent preview — chips that read like "we heard X, Y, Z" */}
        {submitted && (
          <ParseSummary parsed={parsed} />
        )}

        {/* Results grid */}
        {submitted && (
          <div className="mt-8">
            {results.length === 0 ? (
              <div className="card p-8 text-center">
                <Icon.search className="mx-auto text-muted" width={28} height={28} />
                <h3 className="font-display font-bold text-xl mt-3">Nothing fits that brief.</h3>
                <p className="text-sm text-muted mt-2">
                  Try a softer constraint — drop the price ceiling or remove a feature flag.
                </p>
                <Link href={`/shop?q=${encodeURIComponent(submitted)}`} className="btn-ghost mt-5 text-sm inline-flex">
                  Search the whole shop instead <Icon.arrow width={12} height={12} />
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.map((p, i) => (
                  <Link
                    key={p.id}
                    href={`/product/${p.slug || p.id}`}
                    className="card card-hover p-4 flex flex-col relative animate-slidein"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <ProductIllustration
                      category={p.category}
                      icon={p.icon}
                      className="aspect-square rounded-xl"
                      size={68}
                    />
                    <div className="mt-3 flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{p.brand}</div>
                      <div className="text-sm font-semibold text-ink line-clamp-1 mt-0.5">{p.name}</div>
                      <p className="text-[11px] text-muted line-clamp-2 mt-1">{p.description}</p>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between gap-2">
                      <span className="text-base font-bold gradient-text">${p.price.toFixed(2)}</span>
                      {p.reviewsCount > 0 && (
                        <span className="text-[11px] text-muted">★ {p.rating.toFixed(1)}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ParseSummary({ parsed }: { parsed: Parsed }) {
  const chips: { label: string; tone: 'brand' | 'accent' | 'warn' | 'success' }[] = [];
  if (parsed.port)     chips.push({ label: parsed.port,             tone: 'brand' });
  if (parsed.category) chips.push({ label: capitalise(parsed.category), tone: 'brand' });
  if (parsed.watts)    chips.push({ label: `${parsed.watts}W+`,     tone: 'warn' });
  if (parsed.minPrice && parsed.maxPrice) chips.push({ label: `$${parsed.minPrice}–$${parsed.maxPrice}`, tone: 'success' });
  else if (parsed.maxPrice)               chips.push({ label: `Under $${parsed.maxPrice}`, tone: 'success' });
  else if (parsed.minPrice)               chips.push({ label: `Over $${parsed.minPrice}`,  tone: 'success' });
  parsed.features.forEach(f => chips.push({ label: f, tone: 'accent' }));

  const tone = {
    brand:   'bg-brand/10 text-brand',
    accent:  'bg-accent2/15 text-accent2',
    warn:    'bg-warn/15 text-warn',
    success: 'bg-success/15 text-success'
  };

  if (chips.length === 0) {
    return (
      <div className="mt-6 text-center text-xs text-muted">
        Couldn't pick out a spec — falling back to plain text match.
      </div>
    );
  }

  return (
    <div className="mt-6 flex items-center justify-center gap-2 flex-wrap text-xs">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted font-semibold mr-1">We heard</span>
      {chips.map((c, i) => (
        <span
          key={i}
          className={`chip ${tone[c.tone]} animate-slidein`}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}

/* ─── Heuristic NL parser ──────────────────────────────────────── */

function parseQuery(raw: string): Parsed {
  const q = raw.toLowerCase();
  const out: Parsed = { rest: raw, features: [] };

  // Port
  if (/\b(usb[- ]?c|type[- ]?c)\b/.test(q))   out.port = 'USB-C';
  else if (/\blightning\b/.test(q))            out.port = 'Lightning';

  // Price ceilings: "under $40", "below 40", "less than $40", "<= 40"
  const max = q.match(/(?:under|below|less than|<=?)\s*\$?(\d{1,4})/);
  if (max) out.maxPrice = parseInt(max[1], 10);

  // Price floors: "over $20", "above 20", "more than $20"
  const min = q.match(/(?:over|above|more than|>=?)\s*\$?(\d{1,4})/);
  if (min) out.minPrice = parseInt(min[1], 10);

  // Inline range: "$20-40", "20 to 40"
  const range = q.match(/\$?(\d{1,4})\s*(?:-|to|–)\s*\$?(\d{1,4})/);
  if (range) { out.minPrice = parseInt(range[1], 10); out.maxPrice = parseInt(range[2], 10); }

  // Wattage signal: "65W", "100w", "30 watts"
  const watt = q.match(/(\d{2,4})\s*w(?:att)?s?\b/);
  if (watt) out.watts = parseInt(watt[1], 10);

  // Feature flags — appended verbatim to the chip row.
  const featureMap: Array<[RegExp, string]> = [
    [/\bpd\b|power\s*delivery/, 'PD'],
    [/\bgan\b/,                  'GaN'],
    [/\bmagsafe\b/,              'MagSafe'],
    [/\bqi2?\b/,                 'Qi'],
    [/\banc\b|noise\s*cancell/,  'ANC'],
    [/\bwireless\b/,             'Wireless'],
    [/\bbraid(ed)?\b/,           'Braided'],
    [/\bmfi\b/,                  'MFi'],
    [/\bfast\s*charg/,           'Fast charging'],
    [/\bip\d{1,2}\b|waterproof|water[- ]?resist/, 'Water-resistant'],
    [/\brugged\b|drop[- ]?proof/, 'Rugged']
  ];
  for (const [re, label] of featureMap) {
    if (re.test(q) && !out.features.includes(label)) out.features.push(label);
  }

  // Category hint — first match wins.
  const categoryMap: Array<[RegExp, Parsed['category']]> = [
    [/\bearbuds?\b|\bheadphones?\b|\bspeaker\b|\bheadset\b/, 'audio'],
    [/\bcam(era)?\b|\blens\b|\btripod\b|\bgimbal\b|\bring\s*light\b/, 'photo'],
    [/\bcase\b|\bcover\b/, 'case'],
    [/\bpower\s*bank\b|\bbattery\s*pack\b/, 'power'],
    [/\bwireless\s*(charger|pad)\b|\bmagsafe\b|\bqi2?\b/, 'wireless'],
    [/\bcable\b|\bcord\b|\bbraided\b|\bwire\b/, 'cable'],
    [/\bcharger\b|\bplug\b|\bbrick\b|\badapter\b/, 'charger']
  ];
  for (const [re, cat] of categoryMap) {
    if (re.test(q)) { out.category = cat; break; }
  }

  return out;
}

function rankProducts(catalog: EnrichedProduct[], parsed: Parsed): EnrichedProduct[] {
  const scored = catalog.map(p => {
    const hay = `${p.name} ${p.description} ${p.category} ${p.brand}`.toLowerCase();
    let score = 0;

    // Port match — strongest signal.
    if (parsed.port === 'USB-C'    && /usb-?c|type-?c/.test(hay))   score += 28;
    if (parsed.port === 'Lightning'&& /lightning|mfi/.test(hay))    score += 28;

    // Category — almost as strong as port.
    if (parsed.category === 'charger'  && /charger|plug|brick|adapter|gan|wallcube/.test(hay)) score += 24;
    if (parsed.category === 'cable'    && /cable|cord|braided/.test(hay))                       score += 24;
    if (parsed.category === 'audio'    && /buds|headphone|speaker|headset|audio/.test(hay))     score += 24;
    if (parsed.category === 'case'     && /case|cover|sleeve/.test(hay))                        score += 24;
    if (parsed.category === 'wireless' && /wireless|magsafe|qi/.test(hay))                      score += 24;
    if (parsed.category === 'power'    && /power\s*bank|battery|portable\s*charger/.test(hay))  score += 24;
    if (parsed.category === 'photo'    && /cam|lens|tripod|gimbal|ring|light|photo/.test(hay))  score += 24;

    // Feature flags.
    for (const f of parsed.features) {
      const re = featureRegex(f);
      if (re && re.test(hay)) score += 14;
    }

    // Wattage — soft proximity. Looks for any wattage in product text and
    // rewards being within ±20W of the target.
    if (parsed.watts) {
      const m = hay.match(/(\d{2,4})\s*w/);
      if (m) {
        const diff = Math.abs(parseInt(m[1], 10) - parsed.watts);
        if      (diff === 0)   score += 20;
        else if (diff <= 10)   score += 14;
        else if (diff <= 25)   score += 6;
      }
    }

    // Price gate. Outside the range = strong penalty so we don't strand
    // the shopper with mismatches; mild bonus when inside it.
    if (parsed.maxPrice && p.price > parsed.maxPrice * 1.1) score -= 40;
    if (parsed.minPrice && p.price < parsed.minPrice * 0.9) score -= 40;
    if (parsed.maxPrice && p.price <= parsed.maxPrice)      score += 6;
    if (parsed.minPrice && p.price >= parsed.minPrice)      score += 6;

    // Plain-text fallback so the query still surfaces something useful
    // even when no structured signals matched.
    if (parsed.rest) {
      const tokens = parsed.rest.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      for (const t of tokens) if (hay.includes(t)) score += 2;
    }

    // Universal nudges.
    score += Math.min(8, p.rating * 1.6);
    if (p.stock <= 0) score -= 50;

    return { p, score };
  });
  return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.p);
}

function featureRegex(label: string): RegExp | null {
  switch (label) {
    case 'PD':              return /\bpd\b|power\s*delivery/i;
    case 'GaN':             return /\bgan\b/i;
    case 'MagSafe':         return /magsafe/i;
    case 'Qi':              return /\bqi2?\b/i;
    case 'ANC':             return /\banc\b|noise[- ]?cancel/i;
    case 'Wireless':        return /wireless/i;
    case 'Braided':         return /braided/i;
    case 'MFi':             return /\bmfi\b/i;
    case 'Fast charging':   return /fast[- ]?charg/i;
    case 'Water-resistant': return /\bip\d{1,2}\b|waterproof|water[- ]?resist/i;
    case 'Rugged':          return /rugged|drop[- ]?proof/i;
    default:                return null;
  }
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
