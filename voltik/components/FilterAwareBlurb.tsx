'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';

interface Props {
  /** Currently active category ID — drives the headline/body copy. */
  category: string;
  /** Human-friendly category name (for prose). */
  categoryName?: string;
  /** Free-text search query — when present it takes priority over category. */
  query: string;
  /** Active sort — flavours the closing line ("sorted by best-loved", etc.). */
  sort: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
  /** Result count — informs whether the blurb should celebrate or apologise. */
  resultCount: number;
  /** Highest price the filter allows — fuel for budget-aware lines. */
  maxPrice: number;
}

/**
 * "AI-style" contextual blurb that introduces the current filter set in
 * plain English. There's no LLM behind it — we look up one of a few
 * hand-written templates keyed by the active filter combination and
 * sprinkle in dynamic numbers (count, price ceiling, sort name).
 *
 * The card animates a typewriter-style underline whenever the inputs
 * change, which sells the "we just thought about this" vibe without
 * having to actually call out to a model.
 */
export function FilterAwareBlurb({ category, categoryName, query, sort, resultCount, maxPrice }: Props) {
  const blurb = useBlurb({ category, categoryName, query, sort, resultCount, maxPrice });
  const [hover, setHover] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Keyed by signature so a filter change replays the slide-in.
  return (
    <div
      key={blurb.signature}
      ref={wrapRef}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="card relative overflow-hidden p-4 mb-5 animate-slidein"
    >
      {/* Soft brand glow that pulses gently on hover */}
      <div
        aria-hidden
        className={`absolute -top-12 -left-12 h-32 w-32 rounded-full bg-brand/15 blur-2xl transition-opacity ${hover ? 'opacity-100' : 'opacity-70'}`}
      />
      <div className="relative flex items-start gap-3">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-brand to-brand2 text-white shrink-0">
          <Icon.spark width={16} height={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand">{blurb.kicker}</span>
            <span className="chip bg-elev text-muted !text-[10px]">{blurb.tag}</span>
          </div>
          <h3 className="font-display font-bold text-base sm:text-lg mt-1 leading-snug">
            <span className="bg-gradient-to-r from-brand to-brand2 bg-no-repeat bg-bottom" style={{ backgroundSize: '100% 2px' }}>
              {blurb.headline}
            </span>
          </h3>
          <p className="text-sm text-muted mt-1 leading-relaxed">{blurb.body}</p>
        </div>
      </div>
    </div>
  );
}

interface Blurb {
  signature: string;
  kicker: string;
  tag: string;
  headline: string;
  body: string;
}

function useBlurb(p: Props): Blurb {
  const [b, setB] = useState<Blurb>(() => compose(p));
  // Recompose on every input change. Using a useEffect lets us reset the
  // animation key from the signature change, even if the *content* is
  // identical.
  useEffect(() => { setB(compose(p)); /* eslint-disable-line react-hooks/exhaustive-deps */ },
    [p.category, p.query, p.sort, p.resultCount, p.maxPrice]);
  return b;
}

function compose(p: Props): Blurb {
  const sig = `${p.category}|${p.query}|${p.sort}|${p.maxPrice}|${p.resultCount}`;
  const sortFlavour = SORT_FLAVOUR[p.sort];

  // Empty result — apologise but offer a way out.
  if (p.resultCount === 0) {
    return {
      signature: sig,
      kicker: 'Nothing matched',
      tag: 'Try a softer filter',
      headline: 'We came up dry on that brief.',
      body: 'Drop the price ceiling, broaden the category, or clear the search box and the shelf will refill.'
    };
  }

  // Query takes priority — the shopper told us exactly what they're after.
  if (p.query.trim()) {
    return {
      signature: sig,
      kicker: 'Search results',
      tag: `"${truncate(p.query.trim(), 24)}"`,
      headline: `${p.resultCount} ${plural(p.resultCount, 'match')} for "${truncate(p.query.trim(), 32)}".`,
      body: `${sortFlavour.lead} Tweak the category tree on the left to narrow this down further.`
    };
  }

  // Budget-aware angles when the slider is below the default ceiling.
  if (p.maxPrice < 100) {
    return {
      signature: sig,
      kicker: 'Budget pick',
      tag: `Under $${p.maxPrice}`,
      headline: `${p.resultCount} accessories that fit under $${p.maxPrice}.`,
      body: `Most are entry-tier essentials — ${sortFlavour.lead.toLowerCase()} If something looks too cheap, check the reviews count to see whether it earned its rating.`
    };
  }

  // Per-category copy. We branch on common Voltik categories, fall back
  // to a generic line for anything else.
  const catKey = p.category.toLowerCase();
  const name = p.categoryName || prettyCat(catKey);

  if (catKey === 'all') {
    return {
      signature: sig,
      kicker: 'The whole shelf',
      tag: `${p.resultCount} items`,
      headline: `${p.resultCount} accessories ready to ship.`,
      body: `${sortFlavour.lead} Use the filters on the left to slice by category, price, or rating — or drop a phrase into the search box for a quick lookup.`
    };
  }

  if (catKey.includes('charg')) {
    return {
      signature: sig,
      kicker: 'Charging picks',
      tag: name,
      headline: `Voltik's charging shelf, distilled.`,
      body: `Wall plugs, hubs, and bricks chosen for travel-friendly footprint and PD support. ${sortFlavour.lead}`
    };
  }
  if (catKey.includes('cable') || catKey.includes('cord')) {
    return {
      signature: sig,
      kicker: 'Cables',
      tag: name,
      headline: `Braided, MFi-certified, in the lengths you actually need.`,
      body: `Each cable here is rated for at least 30k bend cycles. ${sortFlavour.lead}`
    };
  }
  if (catKey.includes('audio') || catKey.includes('buds') || catKey.includes('speaker')) {
    return {
      signature: sig,
      kicker: 'Audio',
      tag: name,
      headline: `Sound that travels well.`,
      body: `Earbuds, headphones, and the occasional pocket speaker — picked for fit and battery, not just frequency curves. ${sortFlavour.lead}`
    };
  }
  if (catKey.includes('case') || catKey.includes('cover')) {
    return {
      signature: sig,
      kicker: 'Cases',
      tag: name,
      headline: `Cases that don't add a brick to your phone.`,
      body: `Slim, MagSafe-aware, and rated for at least a 1.2m drop. ${sortFlavour.lead}`
    };
  }
  if (catKey.includes('wireless') || catKey.includes('magsafe')) {
    return {
      signature: sig,
      kicker: 'Wireless',
      tag: name,
      headline: `Magnetic, Qi2, and the rest of the desk story.`,
      body: `Stands and pads that hold position even when you grab your phone at speed. ${sortFlavour.lead}`
    };
  }
  if (catKey.includes('power') || catKey.includes('battery')) {
    return {
      signature: sig,
      kicker: 'Power on the go',
      tag: name,
      headline: `Power banks for the bag you're already carrying.`,
      body: `Capacities chosen so you don't pay for headroom you'll never use. ${sortFlavour.lead}`
    };
  }

  // Generic fallback.
  return {
    signature: sig,
    kicker: 'Category pick',
    tag: name,
    headline: `${p.resultCount} ${plural(p.resultCount, 'product')} in ${name}.`,
    body: `${sortFlavour.lead} Use the filters on the left to drill in further.`
  };
}

const SORT_FLAVOUR: Record<Props['sort'], { lead: string }> = {
  featured:    { lead: 'Sorted by editorial pick — the ones the Voltik team would actually buy.' },
  'price-asc': { lead: 'Sorted cheap-to-pricey so you can spot the budget hits first.' },
  'price-desc':{ lead: 'Sorted by price descending — the premium picks lead.' },
  rating:      { lead: 'Sorted by review score so the best-loved bubble up.' },
  newest:      { lead: 'Newest first — fresh releases at the top.' }
};

function prettyCat(slug: string): string {
  return slug.split(/[-_/]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

/** Tiny pluralisation. Handles the two words we actually use here. */
function plural(n: number, word: string): string {
  if (n === 1) return word;
  if (/(s|x|z|ch|sh)$/.test(word)) return `${word}es`;
  return `${word}s`;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
