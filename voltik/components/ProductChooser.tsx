'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon, type IconKey } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import type { EnrichedProduct } from '@/lib/types';

interface Props {
  catalog: EnrichedProduct[];
}

type Choice = { id: string; label: string; sub?: string; icon?: IconKey };
type Question = {
  id: 'use' | 'budget' | 'priority';
  prompt: string;
  helper: string;
  choices: Choice[];
};

const QUESTIONS: Question[] = [
  {
    id: 'use',
    prompt: 'What do you mostly need it for?',
    helper: 'We use this to weight the categories that match.',
    choices: [
      { id: 'travel',   label: 'Travel + commute',  sub: 'Light, fast, fits a pocket',   icon: 'truck' },
      { id: 'desk',     label: 'Desk + home',       sub: 'Performance over portability', icon: 'plug' },
      { id: 'audio',    label: 'Music + calls',     sub: 'ANC, mics, comfort',           icon: 'headset' },
      { id: 'capture',  label: 'Photo + video',     sub: 'Mounts, lenses, lights',       icon: 'camlens' }
    ]
  },
  {
    id: 'budget',
    prompt: 'What\'s your comfort price?',
    helper: 'Recommendations stay inside this range.',
    choices: [
      { id: 'low',  label: 'Under $25',  sub: 'Essentials',          icon: 'bolt' },
      { id: 'mid',  label: '$25 – $60',  sub: 'Strong middle',       icon: 'spark' },
      { id: 'high', label: '$60 – $120', sub: 'Premium picks',       icon: 'star' },
      { id: 'pro',  label: '$120+',      sub: 'No-compromise',       icon: 'shield' }
    ]
  },
  {
    id: 'priority',
    prompt: 'What matters most?',
    helper: 'Tiebreaker when several products fit.',
    choices: [
      { id: 'speed',     label: 'Speed',            sub: 'Watts, throughput, latency' },
      { id: 'durable',   label: 'Durability',       sub: 'Drop, water, daily abuse' },
      { id: 'design',    label: 'Design',           sub: 'How it looks on the desk' },
      { id: 'value',     label: 'Value',            sub: 'Best $ per feature' }
    ]
  }
];

/**
 * Three-question "find your accessory" flow. We don't ship an LLM — the
 * scoring is hand-coded over the product fields we already have (price,
 * category, badge, rating, oldPrice). The result is deterministic, fast,
 * and easy to reason about: the same answers always surface the same
 * three products from the catalog.
 */
export function ProductChooser({ catalog }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<Question['id'], string | null>>({
    use: null, budget: null, priority: null
  });
  const [done, setDone] = useState(false);

  const choose = (qid: Question['id'], choice: string) => {
    setAnswers(prev => ({ ...prev, [qid]: choice }));
    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(s => s + 1), 240);
    } else {
      setTimeout(() => setDone(true), 240);
    }
  };

  const back = () => setStep(s => Math.max(0, s - 1));
  const reset = () => { setStep(0); setAnswers({ use: null, budget: null, priority: null }); setDone(false); };

  const recommendations = useMemo(
    () => done ? scoreCatalog(catalog, answers).slice(0, 3) : [],
    [catalog, answers, done]
  );

  return (
    <section className="container-x py-16">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand">Find your accessory</span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl mt-2 leading-tight">
            Three questions. One short list.
          </h2>
          <p className="text-muted text-sm mt-2 max-w-md mx-auto">
            Tell us how you'll use it. We'll surface three products that fit — no scrolling required.
          </p>
        </header>

        <div className="card p-6 sm:p-8 relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 bg-mesh opacity-30" />
          <div className="relative">
            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mb-6 justify-center">
              {QUESTIONS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    done || i < step ? 'w-8 bg-brand' :
                    i === step       ? 'w-8 bg-brand/40' :
                                       'w-2 bg-line'
                  }`}
                />
              ))}
            </div>

            {!done ? (
              <Step question={QUESTIONS[step]} selected={answers[QUESTIONS[step].id]} onChoose={choose} onBack={step > 0 ? back : undefined} />
            ) : (
              <Result picks={recommendations} answers={answers} onReset={reset} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({
  question, selected, onChoose, onBack
}: {
  question: Question;
  selected: string | null;
  onChoose: (qid: Question['id'], choice: string) => void;
  onBack?: () => void;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">{question.id}</div>
      <h3 className="font-display font-bold text-2xl mt-2">{question.prompt}</h3>
      <p className="text-muted text-sm mt-1">{question.helper}</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {question.choices.map(c => {
          const Glyph = c.icon ? Icon[c.icon] : null;
          const active = selected === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChoose(question.id, c.id)}
              className={`text-left rounded-2xl border p-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                active ? 'border-brand bg-brand/5 ring-2 ring-brand/30' : 'border-line hover:border-brand/40 hover:bg-elev/40'
              }`}
            >
              <div className="flex items-center gap-3">
                {Glyph && (
                  <span className="grid place-items-center h-9 w-9 rounded-xl bg-brand/10 text-brand shrink-0">
                    <Glyph width={15} height={15} />
                  </span>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-ink line-clamp-1">{c.label}</div>
                  {c.sub && <div className="text-[11px] text-muted line-clamp-1">{c.sub}</div>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {onBack && (
        <div className="mt-5">
          <button onClick={onBack} className="text-xs text-muted hover:text-ink">
            <Icon.arrow width={10} height={10} className="rotate-180 inline-block mr-1" /> Previous
          </button>
        </div>
      )}
    </div>
  );
}

function Result({
  picks, answers, onReset
}: {
  picks: EnrichedProduct[];
  answers: Record<Question['id'], string | null>;
  onReset: () => void;
}) {
  if (picks.length === 0) {
    return (
      <div className="text-center py-6">
        <Icon.search className="mx-auto text-muted" width={28} height={28} />
        <h3 className="font-display font-bold text-xl mt-3">Nothing matches yet.</h3>
        <p className="text-sm text-muted mt-2">Catalog's still warming up — try the shop or come back later.</p>
        <button onClick={onReset} className="btn-ghost mt-5 text-sm">Start over</button>
      </div>
    );
  }
  return (
    <div className="animate-fadein">
      <div className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">Hand-picked for you</div>
      <h3 className="font-display font-bold text-2xl mt-1">Try one of these.</h3>
      <p className="text-sm text-muted mt-1">
        Based on {answers.use}, {answers.budget}, {answers.priority}. Tap to view full details.
      </p>

      <ul className="mt-6 space-y-3">
        {picks.map((p, i) => (
          <li key={p.id}>
            <Link
              href={`/product/${p.slug || p.id}`}
              className="flex items-center gap-4 rounded-2xl border border-line p-3 hover:border-brand/40 hover:bg-elev/40 transition group"
            >
              <span className="text-2xl font-display font-bold gradient-text w-9 text-center shrink-0">{i + 1}</span>
              <ProductIllustration category={p.category} icon={p.icon} className="h-14 w-14 rounded-xl shrink-0" size={28} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink line-clamp-1">{p.name}</div>
                <div className="text-[11px] text-muted">{p.brand} · {p.category}</div>
                {p.reviewsCount > 0 && (
                  <div className="text-[11px] text-muted mt-0.5">★ {p.rating.toFixed(1)} · {p.reviewsCount} reviews</div>
                )}
              </div>
              <span className="text-sm font-bold gradient-text shrink-0">${p.price.toFixed(2)}</span>
              <Icon.arrow width={12} height={12} className="text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition shrink-0" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button onClick={onReset} className="btn-ghost text-sm">
          <Icon.refresh width={12} height={12} /> Retake quiz
        </button>
        <Link href="/shop" className="btn-primary text-sm">
          Or browse the whole catalog <Icon.arrow width={12} height={12} />
        </Link>
      </div>
    </div>
  );
}

/* ─── Heuristic scorer ─────────────────────────────────────────── */

function scoreCatalog(
  catalog: EnrichedProduct[],
  answers: Record<Question['id'], string | null>
): EnrichedProduct[] {
  const useTo  = answers.use;
  const budget = answers.budget;
  const prio   = answers.priority;

  // Budget caps. We tolerate +20% over the upper bound so a "$60-$120"
  // shopper doesn't lose a brilliant $128 product to a hard cutoff.
  const range =
    budget === 'low'  ? [0,    30]  :
    budget === 'mid'  ? [20,   72]  :
    budget === 'high' ? [55,   144] :
    budget === 'pro'  ? [100,  9999] :
                        [0, 9999];

  const scored = catalog.map(p => {
    let score = 0;

    // Use → category preference. Heavy weight: 25 points if the category
    // matches what the shopper said they want it for.
    if (useTo === 'travel'  && (/cable|charger|power|bank|case/i).test(p.name + p.category))   score += 25;
    if (useTo === 'desk'    && (/charger|stand|cube|gan|usb|hub/i).test(p.name + p.category))   score += 25;
    if (useTo === 'audio'   && (/buds|head|earbud|speaker|audio/i).test(p.name + p.category))   score += 30;
    if (useTo === 'capture' && (/cam|lens|tripod|gimbal|ring|light|photo/i).test(p.name + p.category)) score += 30;

    // Budget. Inside range = max bonus, edges fade off so the system
    // gracefully picks neighbours when the shelf is thin.
    const [min, max] = range;
    if (p.price >= min && p.price <= max) score += 20;
    else if (p.price < min) score += 20 - (min - p.price) * 0.5;
    else                    score += 20 - Math.min(20, (p.price - max) * 0.3);

    // Priority tie-breakers.
    if (prio === 'speed'   && /(\d+W|GaN|PD|65W|100W)/i.test(p.name + ' ' + p.description)) score += 8;
    if (prio === 'durable' && /(IP[X\d]|drop|rugged|MIL|kevlar|braided)/i.test(p.name + ' ' + p.description)) score += 8;
    if (prio === 'design'  && (p.badge === 'New' || p.badge === 'Bestseller')) score += 8;
    if (prio === 'value'   && p.oldPrice && p.oldPrice > p.price) score += 8;

    // Universal nudges — verified rating + stock so we don't recommend OOS.
    score += Math.min(10, p.rating * 2);
    if (p.stock <= 0) score -= 50;

    return { p, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.p);
}
