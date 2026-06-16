'use client';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';

/**
 * Floating spec callouts that fan out around the product illustration on
 * hover (or always-visible on touch). Each callout is plucked from the
 * product's `features` list and lands at a position around an invisible
 * orbit so the result reads like a sci-fi product chart.
 *
 * Disabled gracefully under prefers-reduced-motion (renders nothing) and
 * gated to ≥4 features so it doesn't look thin.
 */
interface Props {
  /** Lines lifted from product.features — the component condenses each
   *  to a short keyword + value pair. */
  features: string[];
  /** Visible by default on touch; toggled on parent hover otherwise. */
  alwaysOn?: boolean;
}

type Callout = { key: string; label: string; value: string; angle: number; radius: number };

export function SpecHoverHalo({ features, alwaysOn }: Props) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Build callouts from the first few features; skip if we don't have
  // enough material to fill the orbit cleanly.
  const callouts = buildCallouts(features);
  if (callouts.length < 4 || reduced) return null;

  return (
    <div
      aria-hidden
      // Parent wrapper applies `group` — when hover or focus, halo lights up.
      // Touch devices get `alwaysOn` so they're not stuck without the cue.
      className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${alwaysOn ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}`}
    >
      {/* Faint orbit ring */}
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-brand/30"
        style={{ width: '92%', height: '92%' }}
      />

      {callouts.map((c, i) => {
        const rad = (c.angle * Math.PI) / 180;
        const x = 50 + Math.cos(rad) * c.radius;   // % of container
        const y = 50 + Math.sin(rad) * c.radius;
        return (
          <span
            key={c.key}
            className="absolute -translate-x-1/2 -translate-y-1/2 animate-fadein"
            style={{
              left: `${x}%`,
              top:  `${y}%`,
              animationDelay: `${i * 70}ms`
            }}
          >
            <Pill label={c.label} value={c.value} angle={c.angle} />
          </span>
        );
      })}
    </div>
  );
}

function Pill({ label, value, angle }: { label: string; value: string; angle: number }) {
  // Anchor leans toward the centre — a tiny dot + line to evoke "tagged".
  const towardCentre = angle > 90 && angle < 270 ? 'right-full mr-2' : 'left-full ml-2';
  return (
    <span className="relative flex items-center">
      <span
        className={`absolute top-1/2 -translate-y-1/2 ${towardCentre} h-px w-6 bg-brand/40`}
        aria-hidden
      />
      <span
        className="relative rounded-xl bg-surface/95 backdrop-blur-sm border border-brand/30 px-3 py-1.5 shadow-soft text-left whitespace-nowrap"
        style={{ boxShadow: '0 8px 24px -10px rgb(var(--brand) / 0.45)' }}
      >
        <span className="block text-[9px] uppercase tracking-[0.18em] text-muted font-semibold">{label}</span>
        <span className="block text-[12px] font-bold text-ink mt-0.5 flex items-center gap-1">
          <Icon.spark width={9} height={9} className="text-brand" />
          {value}
        </span>
      </span>
    </span>
  );
}

/**
 * Compress each feature line into a {label, value} pair. We look for
 * unit-tagged numbers (15W, IPX7, 30hr, 65W, USB-C, ANC, Bluetooth 5.3)
 * and pull them out; the rest of the line is the supporting label.
 */
function buildCallouts(features: string[]): Callout[] {
  const angles = [-30, 30, 150, 210, 90, 270, -60, 60];   // around 360°, paired
  const used = new Set<string>();
  const out: Callout[] = [];

  for (let i = 0; i < features.length && out.length < 6; i++) {
    const raw = features[i].trim();
    if (!raw) continue;

    const pulled = extractSpec(raw);
    if (!pulled) continue;
    const key = pulled.value.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);

    out.push({
      key: `${i}-${pulled.value}`,
      label: pulled.label,
      value: pulled.value,
      angle: angles[out.length] ?? 0,
      // Push outer-orbit pills further out so they don't crowd the illustration.
      radius: 48 + (out.length % 2 === 0 ? 0 : 4)
    });
  }
  return out;
}

const SPEC_RE = /\b(\d+(?:\.\d+)?\s?(?:W|hr|hrs|h|kHz|mAh|mm|GB|TB|°|°C|m|ft|Hz|dB|Mbps|Gbps)|IPX?\d|USB-?C|USB-?A|HDMI|ANC|Bluetooth\s?\d(?:\.\d)?|MagSafe|GaN|Hi-Res|Qi\d?|PD\s?\d+)\b/i;

function extractSpec(line: string): { label: string; value: string } | null {
  const m = line.match(SPEC_RE);
  if (!m) return null;
  const value = m[0].replace(/\s+/g, '');
  // Build a short label from the surrounding context.
  const cleaned = line.replace(SPEC_RE, '').replace(/[—–\-:]/g, ' ').trim();
  const label = cleaned.split(/\s+/).slice(0, 3).join(' ') || 'Spec';
  return { label, value };
}
