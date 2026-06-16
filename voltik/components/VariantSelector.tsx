'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { EnrichedProduct } from '@/lib/types';

interface Variant {
  id: string;
  label: string;
  /** Hex for colour swatches; falls back to the brand chip for size labels. */
  hex?: string;
  /** Short suffix shown below the label ("+$5", "Most popular"). */
  hint?: string;
}

interface VariantGroup {
  kind: 'colour' | 'size' | 'capacity' | 'connector';
  label: string;
  variants: Variant[];
  /** Index of the option marked as the default — drives the initial pill. */
  defaultIdx: number;
}

/**
 * Variant selector with animated brand underline that slides between
 * swatches as the user picks. The variant catalog isn't in the schema
 * yet — we derive a believable set from the product's category so the
 * UX shows the pattern. Selecting a variant is local-only (no SKU
 * swap), which keeps the demo honest while the inventory model catches
 * up.
 */
export function VariantSelector({ product }: { product: EnrichedProduct }) {
  const groups = useMemo(() => deriveGroups(product), [product]);
  if (groups.length === 0) return null;

  return (
    <div className="mt-6 space-y-5">
      {groups.map(g => <Group key={g.kind} group={g} />)}
    </div>
  );
}

function Group({ group }: { group: VariantGroup }) {
  const [active, setActive] = useState(group.defaultIdx);
  const railRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0, opacity: 0 });

  // Recalculate the underline position whenever the active swatch
  // changes or the row resizes (font scale, theme density switch).
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const recompute = () => {
      const btn = rail.querySelector<HTMLButtonElement>(`[data-idx="${active}"]`);
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const railRect = rail.getBoundingClientRect();
      setPill({
        left: rect.left - railRect.left,
        width: rect.width,
        opacity: 1
      });
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(rail);
    window.addEventListener('resize', recompute);
    return () => { ro.disconnect(); window.removeEventListener('resize', recompute); };
  }, [active]);

  const v = group.variants[active];

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 min-w-0">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted font-semibold shrink-0">{group.label}</span>
        <span className="text-sm text-ink font-semibold truncate text-right">{v.label}{v.hint ? <span className="text-muted font-normal"> · {v.hint}</span> : null}</span>
      </div>

      <div ref={railRef} className="relative mt-3 flex flex-wrap items-end gap-3">
        {group.variants.map((variant, i) => {
          const isActive = i === active;
          return (
            <button
              key={variant.id}
              type="button"
              data-idx={i}
              onClick={() => setActive(i)}
              aria-pressed={isActive}
              aria-label={variant.label}
              className={`group relative grid place-items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                variant.hex
                  ? `h-10 w-10 ${isActive ? 'ring-2 ring-brand ring-offset-2 ring-offset-bg' : 'ring-1 ring-line hover:ring-brand/40'}`
                  : `px-3.5 h-9 border ${isActive ? 'border-brand text-ink' : 'border-line text-muted hover:text-ink hover:border-brand/40'}`
              }`}
              style={variant.hex ? { background: variant.hex } : undefined}
            >
              {!variant.hex && <span className="text-xs font-semibold">{variant.label}</span>}
              {variant.hex && isActive && (
                <span className="absolute inset-0 rounded-full pointer-events-none animate-ping-once" style={{ boxShadow: `0 0 0 4px ${variant.hex}40` }} />
              )}
            </button>
          );
        })}

        {/* Animated brand underline — slides between swatches */}
        <span
          aria-hidden
          className="absolute -bottom-1.5 h-[2px] rounded-full bg-gradient-to-r from-brand to-brand2 transition-all duration-300"
          style={{
            left: pill.left,
            width: pill.width,
            opacity: pill.opacity,
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </div>
    </div>
  );
}

/* ─── Synthetic variant catalogues ─────────────────────────────── */

function deriveGroups(p: EnrichedProduct): VariantGroup[] {
  const cat = p.category.toLowerCase();
  const name = p.name.toLowerCase();
  const groups: VariantGroup[] = [];

  // Cables — colour + length
  if (cat.includes('cable') || name.includes('cable') || name.includes('cord')) {
    groups.push({
      kind: 'colour', label: 'Sleeve', defaultIdx: 0,
      variants: [
        { id: 'midnight', label: 'Midnight',  hex: '#0f172a' },
        { id: 'arctic',   label: 'Arctic',    hex: '#e2e8f0' },
        { id: 'glacier',  label: 'Glacier',   hex: '#67e8f9' },
        { id: 'ember',    label: 'Ember',     hex: '#f97316', hint: '+$2' }
      ]
    });
    groups.push({
      kind: 'size', label: 'Length', defaultIdx: 1,
      variants: [
        { id: '0.5m', label: '0.5 m' },
        { id: '1m',   label: '1 m',   hint: 'Most popular' },
        { id: '2m',   label: '2 m',   hint: '+$3' },
        { id: '3m',   label: '3 m',   hint: '+$6' }
      ]
    });
    return groups;
  }

  // Power banks / chargers — capacity / wattage
  if (cat.includes('power') || cat.includes('battery') || name.includes('power bank')) {
    groups.push({
      kind: 'capacity', label: 'Capacity', defaultIdx: 1,
      variants: [
        { id: '10k',  label: '10K',  hint: 'Pocket' },
        { id: '20k',  label: '20K',  hint: 'Most popular' },
        { id: '27k',  label: '27K',  hint: '+$15' }
      ]
    });
    groups.push({
      kind: 'colour', label: 'Finish', defaultIdx: 0,
      variants: [
        { id: 'graphite', label: 'Graphite', hex: '#1f2937' },
        { id: 'silver',   label: 'Silver',   hex: '#cbd5e1' },
        { id: 'sand',     label: 'Sand',     hex: '#f5deb3' }
      ]
    });
    return groups;
  }

  if (cat.includes('charging') || cat.includes('charger') || name.includes('charger') || name.includes('gan')) {
    groups.push({
      kind: 'capacity', label: 'Power', defaultIdx: 1,
      variants: [
        { id: '30w',  label: '30W',  hint: 'Phone-only' },
        { id: '65w',  label: '65W',  hint: 'Most popular' },
        { id: '100w', label: '100W', hint: 'Pro · +$20' }
      ]
    });
    groups.push({
      kind: 'connector', label: 'Plug', defaultIdx: 0,
      variants: [
        { id: 'us', label: 'US' },
        { id: 'eu', label: 'EU' },
        { id: 'uk', label: 'UK' },
        { id: 'au', label: 'AU' }
      ]
    });
    return groups;
  }

  // Audio — colour, then maybe earbud tip size
  if (cat.includes('audio') || name.includes('buds') || name.includes('headphone') || name.includes('headset') || name.includes('speaker')) {
    groups.push({
      kind: 'colour', label: 'Colour', defaultIdx: 0,
      variants: [
        { id: 'jet',     label: 'Jet',     hex: '#0f172a' },
        { id: 'cloud',   label: 'Cloud',   hex: '#f8fafc' },
        { id: 'lilac',   label: 'Lilac',   hex: '#c4b5fd' },
        { id: 'meadow',  label: 'Meadow',  hex: '#86efac' }
      ]
    });
    if (name.includes('buds') || name.includes('earbud')) {
      groups.push({
        kind: 'size', label: 'Tip size', defaultIdx: 1,
        variants: [
          { id: 's', label: 'S' },
          { id: 'm', label: 'M', hint: 'Default' },
          { id: 'l', label: 'L' }
        ]
      });
    }
    return groups;
  }

  // Cases / covers — colour + device
  if (cat.includes('case') || name.includes('case') || name.includes('cover')) {
    groups.push({
      kind: 'colour', label: 'Colour', defaultIdx: 0,
      variants: [
        { id: 'midnight', label: 'Midnight', hex: '#0f172a' },
        { id: 'clay',     label: 'Clay',     hex: '#9a3412' },
        { id: 'sage',     label: 'Sage',     hex: '#65a30d' },
        { id: 'rose',     label: 'Rose',     hex: '#fb7185' },
        { id: 'cream',    label: 'Cream',    hex: '#fef3c7' }
      ]
    });
    return groups;
  }

  // Default — colour only.
  groups.push({
    kind: 'colour', label: 'Style', defaultIdx: 0,
    variants: [
      { id: 'classic', label: 'Classic', hex: '#1f2937' },
      { id: 'bright',  label: 'Bright',  hex: '#fbbf24' }
    ]
  });
  return groups;
}
