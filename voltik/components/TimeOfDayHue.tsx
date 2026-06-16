'use client';
import { useEffect, useState } from 'react';

/**
 * Drops a CSS variable (`--tod-hue`) onto the document root that the
 * hero gradient picks up. Morning leans warm (yellow), midday cool
 * (cyan-violet, the brand baseline), evening leans purple/pink. Subtle
 * — a 12° rotation either way. Honours reduced-motion.
 */
export function TimeOfDayHue() {
  const [hue, setHue] = useState<number | null>(null);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const h = new Date().getHours();
    // Map: 6-11 → +12deg warmer, 11-17 → 0 (baseline), 17-22 → -12deg cooler,
    // 22-6 → -18deg deep night.
    const rot =
      h >= 6  && h < 11 ?  12 :
      h >= 11 && h < 17 ?   0 :
      h >= 17 && h < 22 ? -12 :
                          -18;
    setHue(rot);
  }, []);

  if (hue == null) return null;

  // The hero gradient now reacts to BOTH the time-of-day baseline AND the
  // scroll-driven offset (`--scroll-hue`, written by ScrollHueShifter).
  // Calc lets us add them in CSS so the two systems compose cleanly.
  return (
    <style>{`
      :root { --tod-hue: ${hue}deg; --scroll-hue: 0deg; }
      .hero-tod { filter: hue-rotate(calc(var(--tod-hue, 0deg) + var(--scroll-hue, 0deg))); transition: filter .15s linear; }
    `}</style>
  );
}
