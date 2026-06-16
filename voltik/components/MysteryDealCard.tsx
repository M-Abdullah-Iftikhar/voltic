'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icons';
import { ProductIllustration } from './ProductIllustration';
import type { EnrichedProduct } from '@/lib/types';

/**
 * "Today's mystery deal" card. Sits as a landing-page accent — one click
 * unlocks a randomly picked discounted product and the deal copy reveals
 * with a glow + counter. The pick is deterministic per UTC day so two
 * users on the same day see the same deal, but it rotates daily without
 * any admin scheduling.
 */
interface Props {
  /** Pool of currently-discounted products. */
  candidates: EnrichedProduct[];
}

export function MysteryDealCard({ candidates }: Props) {
  const [revealed, setRevealed] = useState(false);

  // Daily-stable pick: hash of YYYY-MM-DD into the candidate pool. We
  // compute it at render time so SSR + first paint stay consistent.
  const pick = pickOfTheDay(candidates);
  if (!pick) return null;

  const discount = pick.oldPrice
    ? Math.round(((pick.oldPrice - pick.price) / pick.oldPrice) * 100)
    : 0;

  return (
    <section className="container-x py-12">
      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-3 rounded-[28px] pointer-events-none opacity-70"
          style={{
            background: 'conic-gradient(from 140deg at 50% 50%, rgb(var(--accent2)/0.4), rgb(var(--brand)/0.35), rgb(var(--brand2)/0.4), rgb(var(--accent2)/0.4))',
            filter: 'blur(18px)'
          }}
        />
        <div className="relative card overflow-hidden">
          <div className="grid sm:grid-cols-[1fr_1.2fr] gap-0">
            {/* Visual side — either an obscured "?" tile, or the revealed product art */}
            <div className="relative aspect-[5/4] sm:aspect-auto sm:min-h-[280px] overflow-hidden bg-mesh">
              {!revealed ? (
                <div className="absolute inset-0 grid place-items-center">
                  <div
                    aria-hidden
                    className="relative grid place-items-center h-32 w-32 rounded-3xl text-white shadow-card"
                    style={{ background: 'linear-gradient(135deg,rgb(var(--accent2)),rgb(var(--brand2)))' }}
                  >
                    <span className="font-display font-bold text-7xl leading-none drop-shadow">?</span>
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-3xl animate-pulseRing"
                      style={{ boxShadow: '0 0 0 3px rgb(var(--accent2) / 0.4)' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 grid place-items-center animate-fadein">
                  <ProductIllustration
                    category={pick.category}
                    icon={pick.icon}
                    className="w-[60%] aspect-square rounded-3xl"
                    size={140}
                  />
                </div>
              )}
            </div>

            {/* Copy side */}
            <div className="p-6 sm:p-8 flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.18em] text-accent2 font-bold flex items-center gap-1.5">
                <Icon.spark width={11} height={11} />
                Today's mystery deal
              </span>
              <h3 className="font-display font-bold text-2xl sm:text-3xl mt-2 leading-tight">
                {revealed
                  ? <>Reveal locked in — <span className="gradient-text">{pick.name}</span></>
                  : <>A handpicked discount, hiding behind one click.</>}
              </h3>
              <p className="text-muted text-sm mt-2 leading-relaxed">
                {revealed
                  ? `Today only: ${discount}% off ${pick.name}. Stock goes fast on these.`
                  : 'One product, one big discount, one day. Tap to see what we set aside for today.'}
              </p>

              {revealed ? (
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-3xl font-bold gradient-text">${pick.price.toFixed(2)}</span>
                  {pick.oldPrice && (
                    <>
                      <span className="text-muted line-through">${pick.oldPrice.toFixed(2)}</span>
                      <span className="chip bg-danger text-white">−{discount}%</span>
                    </>
                  )}
                </div>
              ) : (
                <ul className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted">
                  <li className="flex items-center gap-1.5"><Icon.bolt width={11} height={11} className="text-brand" /> Up to 35% off</li>
                  <li className="flex items-center gap-1.5"><Icon.refresh width={11} height={11} className="text-brand" /> Resets daily</li>
                  <li className="flex items-center gap-1.5"><Icon.spark width={11} height={11} className="text-brand" /> Stocked picks</li>
                  <li className="flex items-center gap-1.5"><Icon.shield width={11} height={11} className="text-brand" /> Same warranty</li>
                </ul>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {revealed ? (
                  <Link href={`/product/${pick.slug || pick.id}`} className="btn-primary">
                    Grab it now <Icon.arrow width={14} height={14} />
                  </Link>
                ) : (
                  <button onClick={() => setRevealed(true)} className="btn-primary">
                    Reveal today's deal <Icon.arrow width={14} height={14} />
                  </button>
                )}
                <Link href="/shop?sort=price-asc" className="btn-ghost">Browse all deals</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function pickOfTheDay(candidates: EnrichedProduct[]): EnrichedProduct | null {
  if (candidates.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  let h = 0;
  for (let i = 0; i < today.length; i++) h = (h * 31 + today.charCodeAt(i)) >>> 0;
  return candidates[h % candidates.length];
}
