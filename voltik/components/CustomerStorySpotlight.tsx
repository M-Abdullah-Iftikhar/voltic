'use client';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';
import { Avatar } from './Avatar';

type Story = {
  quote: string;
  name: string;
  city: string;
  role: string;
  productLine: string;
};

const STORIES: Story[] = [
  {
    quote: 'The CinePro lens kit replaced my GoPro for travel B-roll. The macro shots of plants and watches are honestly stunning.',
    name: 'Maya R.',
    city: 'Berlin',
    role: 'Photographer',
    productLine: 'Voltik CinePro 4K Lens Kit'
  },
  {
    quote: 'GaN Cube 100W charges my MacBook, iPhone and Pixel simultaneously without breaking a sweat. One brick, one outlet, three devices.',
    name: 'Daniel K.',
    city: 'San Francisco',
    role: 'Engineer',
    productLine: 'Voltik GaN Cube 100W'
  },
  {
    quote: 'Volt Buds Pro 2 have the cleanest ANC I have ever used. Spatial audio on a 12-hour flight changed how I watch movies.',
    name: 'Priya S.',
    city: 'Mumbai',
    role: 'Creator',
    productLine: 'Voltik Volt Buds Pro 2'
  },
  {
    quote: 'Diamond 9H screen guards have survived three drops onto kitchen tile. Genuine 9H — not marketing 9H.',
    name: 'Hassan R.',
    city: 'Karachi',
    role: 'Student',
    productLine: 'Voltik GlassShield Diamond 9H'
  }
];

/**
 * Headline customer story panel. Rotates through real testimonials every
 * 8 seconds with a slide+fade cross-transition. Pause-on-hover.
 */
export function CustomerStorySpotlight() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx(i => (i + 1) % STORIES.length), 8000);
    return () => clearInterval(t);
  }, [paused]);

  const s = STORIES[idx];

  return (
    <section className="container-x py-20">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none" />
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand/15 blur-3xl pointer-events-none"
        />

        <div
          className="relative grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center p-8 sm:p-12"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Quote column */}
          <div className="min-h-[180px]">
            <div className="text-xs uppercase tracking-[0.18em] font-semibold text-brand mb-4">
              Customer spotlight
            </div>

            <blockquote
              key={s.quote}
              className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight text-balance text-ink animate-slidein"
            >
              <span className="text-brand mr-1">“</span>
              {s.quote}
              <span className="text-brand ml-1">”</span>
            </blockquote>

            <div key={s.name} className="mt-6 flex items-center gap-3 animate-slidein" style={{ animationDelay: '120ms' }}>
              <Avatar name={s.name} seed={`${s.name}-${s.city}`} size={44} />
              <div>
                <div className="text-sm font-semibold">{s.name}</div>
                <div className="text-xs text-muted">{s.role} · {s.city}</div>
              </div>
              <span className="ml-3 chip bg-elev text-muted">
                <Icon.bolt width={11} height={11} className="text-brand" />
                {s.productLine}
              </span>
            </div>
          </div>

          {/* Indicator dots */}
          <div className="flex lg:flex-col items-center justify-center lg:justify-end gap-2 lg:gap-3">
            {STORIES.map((st, i) => (
              <button
                key={st.name}
                onClick={() => setIdx(i)}
                aria-label={`Show ${st.name}'s story`}
                aria-current={i === idx}
                className={`relative h-1.5 rounded-full transition-all overflow-hidden ${i === idx ? 'w-10 bg-ink/20' : 'w-1.5 bg-ink/15 hover:bg-ink/30'}`}
              >
                {i === idx && !paused && (
                  <span
                    key={idx}
                    className="absolute inset-y-0 left-0 bg-ink rounded-full"
                    style={{ animation: 'progress 8000ms linear forwards', width: 0 }}
                  />
                )}
              </button>
            ))}
            <style jsx>{`@keyframes progress { from { width: 0; } to { width: 100%; } }`}</style>
          </div>
        </div>
      </div>
    </section>
  );
}
