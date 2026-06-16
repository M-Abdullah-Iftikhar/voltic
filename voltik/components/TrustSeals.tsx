import { Icon, type IconKey } from './Icons';

const SEALS: { icon: IconKey; label: string; sub: string }[] = [
  { icon: 'shield',  label: 'SSL secured',         sub: '256-bit encryption end-to-end' },
  { icon: 'refresh', label: '30-day returns',      sub: 'No-questions-asked refund' },
  { icon: 'truck',   label: 'Worldwide shipping',  sub: 'Free over $50 · 120 countries' },
  { icon: 'check',   label: '2-year warranty',     sub: 'Every Voltik product is covered' }
];

/** Compact reassurance row used in the footer. */
export function TrustSeals() {
  return (
    <div className="container-x py-6 border-t border-line/60">
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SEALS.map(s => {
          const Glyph = Icon[s.icon];
          return (
            <li key={s.label} className="flex items-center gap-3">
              <span className="grid place-items-center h-9 w-9 rounded-full bg-brand/10 text-brand shrink-0">
                <Glyph width={16} height={16} />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-ink line-clamp-1">{s.label}</div>
                <div className="text-[11px] text-muted line-clamp-1">{s.sub}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
