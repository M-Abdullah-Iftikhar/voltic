'use client';
import { useEffect, useState } from 'react';

/**
 * "As featured in" strip — fake but believable press wordmarks rendered
 * as inline SVG. Muted greyscale at rest, brand-ink on hover. No external
 * assets, no rights issues.
 *
 * Below the logo row, a single short pull-quote auto-rotates every six
 * seconds. The quote sources align with the visible logos so the social
 * proof reads as one coherent claim rather than two disconnected rows.
 */

interface Quote { source: string; text: string }
const QUOTES: Quote[] = [
  { source: 'The Verge',  text: '"Voltik is what the accessory aisle has been missing — fast, honest, and small enough to live in a pocket."' },
  { source: 'WIRED',      text: '"The GaN Cube punches several brackets above its price."' },
  { source: 'Engadget',   text: '"Our new go-to recommendation for travellers who refuse to carry three bricks."' },
  { source: 'TechCrunch', text: '"A rare D2C brand whose engineering keeps up with the marketing copy."' },
  { source: 'MKBHD',      text: '"These hold up. I\'ve been daily-driving them for four months."' }
];

const LOGOS: { name: string; node: React.ReactNode }[] = [
  {
    name: 'The Verge',
    node: (
      <svg viewBox="0 0 110 24" className="h-5 w-auto" aria-hidden>
        <text x="0" y="18" fontFamily="'Space Grotesk', Inter, sans-serif" fontWeight="700" fontSize="20" letterSpacing="-1" fill="currentColor">
          The<tspan fontStyle="italic" dx="2">Verge</tspan>
        </text>
      </svg>
    )
  },
  {
    name: 'Wired',
    node: (
      <svg viewBox="0 0 90 24" className="h-5 w-auto" aria-hidden>
        <text x="0" y="20" fontFamily="'Space Grotesk', Inter, sans-serif" fontWeight="900" fontSize="22" letterSpacing="-1" fill="currentColor">
          WIRED
        </text>
      </svg>
    )
  },
  {
    name: 'Engadget',
    node: (
      <svg viewBox="0 0 130 24" className="h-5 w-auto" aria-hidden>
        <text x="0" y="18" fontFamily="'Space Grotesk', Inter, sans-serif" fontWeight="600" fontSize="19" letterSpacing="-0.5" fill="currentColor">
          engadget
        </text>
      </svg>
    )
  },
  {
    name: 'TechCrunch',
    node: (
      <svg viewBox="0 0 160 24" className="h-5 w-auto" aria-hidden>
        <text x="0" y="18" fontFamily="'Space Grotesk', Inter, sans-serif" fontWeight="700" fontSize="18" letterSpacing="-0.6" fill="currentColor">
          TechCrunch
        </text>
      </svg>
    )
  },
  {
    name: 'Gizmodo',
    node: (
      <svg viewBox="0 0 110 24" className="h-5 w-auto" aria-hidden>
        <text x="0" y="18" fontFamily="'Space Grotesk', Inter, sans-serif" fontWeight="700" fontSize="19" letterSpacing="-0.5" fill="currentColor">
          Gizmodo
        </text>
      </svg>
    )
  },
  {
    name: 'MKBHD',
    node: (
      <svg viewBox="0 0 90 24" className="h-5 w-auto" aria-hidden>
        <text x="0" y="18" fontFamily="'Space Grotesk', Inter, sans-serif" fontWeight="800" fontSize="18" letterSpacing="0" fill="currentColor">
          MKBHD
        </text>
      </svg>
    )
  }
];

export function PressLogos() {
  const [qIdx, setQIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  // Respect prefers-reduced-motion — auto-rotators must not steal
  // attention from users who asked for stillness.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const t = setInterval(() => setQIdx(i => (i + 1) % QUOTES.length), 6000);
    return () => clearInterval(t);
  }, [paused, reduced]);

  const quote = QUOTES[qIdx];

  return (
    <section
      className="container-x py-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <p className="text-center text-[10px] uppercase tracking-[0.22em] font-semibold text-muted mb-6">
        As featured in
      </p>
      <ul className="flex items-center justify-center gap-x-10 gap-y-5 flex-wrap text-muted">
        {LOGOS.map(l => (
          <li
            key={l.name}
            className="opacity-60 grayscale hover:opacity-100 hover:grayscale-0 hover:text-ink transition-all"
            aria-label={l.name}
          >
            {l.node}
          </li>
        ))}
      </ul>

      {/* Rotating pull-quote — ties the logos to an actual statement so
          the row reads as social proof, not decoration. */}
      <figure
        key={qIdx}
        className="mt-6 max-w-2xl mx-auto text-center animate-fadein"
        aria-live="polite"
      >
        <blockquote className="font-display italic text-base sm:text-lg leading-snug text-ink/90">
          {quote.text}
        </blockquote>
        <figcaption className="mt-1.5 text-[10px] uppercase tracking-[0.22em] text-brand font-semibold">
          — {quote.source}
        </figcaption>
      </figure>

      {/* Dot pager — also a click target so users can hop directly */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {QUOTES.map((_, i) => (
          <button
            key={i}
            onClick={() => setQIdx(i)}
            aria-label={`Quote ${i + 1}`}
            aria-current={i === qIdx}
            className={`h-1.5 rounded-full transition-all ${i === qIdx ? 'w-6 bg-brand' : 'w-1.5 bg-line hover:bg-muted'}`}
          />
        ))}
      </div>
    </section>
  );
}
