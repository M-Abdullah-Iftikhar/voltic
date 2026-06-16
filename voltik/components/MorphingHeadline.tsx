'use client';
import { useEffect, useState } from 'react';

/** Headline whose last word rotates through a list with a vertical fade. */
const WORDS = ['mobile life', 'workflow', 'creative side', 'commute', 'weekend', 'battery anxiety'];

export function MorphingHeadline() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % WORDS.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] mt-5 text-balance">
      Power up your{' '}
      <span className="inline-block relative align-baseline">
        {WORDS.map((w, i) => (
          <span
            key={w}
            aria-hidden={i !== idx}
            className={`gradient-text transition-all duration-500 ease-out ${
              i === idx
                ? 'opacity-100 translate-y-0 relative'
                : 'opacity-0 translate-y-2 absolute inset-0'
            }`}
          >
            {w}.
          </span>
        ))}
      </span>
    </h1>
  );
}
