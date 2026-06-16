import { Icon, type IconKey } from './Icons';

type Spec = {
  label: string;
  /** ours value (numeric for the bar) */
  ours: number;
  /** average value (numeric for the bar) */
  avg: number;
  /** unit displayed next to the numbers */
  unit?: string;
  /** higher number = better? (defaults true) */
  higherIsBetter?: boolean;
};

const SPECS: Spec[] = [
  { label: 'Power delivery', ours: 65, avg: 18, unit: 'W' },
  { label: 'Bend lifespan',  ours: 20000, avg: 3000, unit: 'cycles' },
  { label: 'Cable warranty', ours: 24, avg: 3, unit: 'months' },
  { label: 'Outer braid',    ours: 3, avg: 1, unit: 'layers' }
];

/**
 * Side-by-side spec comparison. Two cards (Voltik vs. average $5 cable)
 * with bar charts showing the gap. Pure server-render — no client deps.
 */
export function ComparisonCards() {
  return (
    <section className="container-x py-20">
      <header className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs uppercase tracking-[0.18em] font-semibold text-brand">Voltik vs. the bargain bin</span>
        <h2 className="font-display font-bold text-3xl sm:text-4xl mt-2 leading-tight text-balance">
          The same cable shape, an entirely different cable.
        </h2>
        <p className="text-muted mt-3">
          We benchmarked our $19.99 65W USB-C cable against a typical $5 unbranded
          model from a popular marketplace. The gap is bigger than the price tag.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-4 max-w-4xl mx-auto">
        <ComparisonCard
          variant="ours"
          title="Voltik TurboFlow 65W"
          subtitle="$19.99 · lifetime warranty"
          icon="bolt"
          specs={SPECS}
        />
        <ComparisonCard
          variant="avg"
          title="Average $5 cable"
          subtitle="No brand · no warranty"
          icon="cable"
          specs={SPECS}
        />
      </div>

      <p className="text-center text-xs text-muted mt-6 max-w-md mx-auto">
        Benchmarks measured in our lab against a representative sample of three best-selling unbranded cables.
      </p>
    </section>
  );
}

function ComparisonCard({
  variant, title, subtitle, icon, specs
}: {
  variant: 'ours' | 'avg';
  title: string;
  subtitle: string;
  icon: IconKey;
  specs: Spec[];
}) {
  const Glyph = Icon[icon];
  const isOurs = variant === 'ours';

  return (
    <div className={`card relative overflow-hidden p-6 ${isOurs ? 'border-brand/40' : ''}`}>
      {isOurs && (
        <span
          aria-hidden
          className="absolute top-0 right-0 px-3 py-1 rounded-bl-2xl text-[10px] uppercase tracking-wider font-bold text-white"
          style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}
        >
          Recommended
        </span>
      )}

      <div className="flex items-center gap-3">
        <span className={`grid place-items-center h-11 w-11 rounded-2xl ${isOurs ? 'bg-brand/15 text-brand' : 'bg-elev text-muted'}`}>
          <Glyph width={20} height={20} />
        </span>
        <div className="min-w-0">
          <div className="font-display font-bold text-lg leading-tight">{title}</div>
          <div className="text-xs text-muted">{subtitle}</div>
        </div>
      </div>

      <ul className="mt-5 space-y-4">
        {specs.map(s => {
          const max = Math.max(s.ours, s.avg);
          const value = isOurs ? s.ours : s.avg;
          const pct = max ? (value / max) * 100 : 0;
          const winner = isOurs ? s.ours >= s.avg : s.avg > s.ours;
          return (
            <li key={s.label}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted">{s.label}</span>
                <span className={`font-bold tabular-nums ${winner ? 'text-ink' : 'text-muted'}`}>
                  {value.toLocaleString()}{s.unit ? ` ${s.unit}` : ''}
                </span>
              </div>
              <div className="h-2 rounded-full bg-elev overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: isOurs
                      ? 'linear-gradient(90deg, rgb(var(--brand)), rgb(var(--brand2)))'
                      : 'rgb(var(--muted) / 0.5)'
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
