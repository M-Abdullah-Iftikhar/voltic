'use client';
import { useEffect, useRef, useState } from 'react';

interface Section { id: string; label: string }

/**
 * Vertical pagination dots that snap-scroll the landing page between
 * named sections. Sections are identified by their DOM `id` and a short
 * label rendered in the dot's tooltip. Active dot is determined by the
 * topmost section whose threshold of visibility has been crossed.
 *
 * Sits on the right rail at lg+; hidden under reduced-motion (since the
 * smooth-scroll behaviour is the point) and on small viewports.
 */
export function SnapScrollIndicator({ sections }: { sections: Section[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    setEnabled(true);

    // Track which section's top is closest to the viewport top.
    const els = sections
      .map(s => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);

    // Use IntersectionObserver to pick the section that owns the largest
    // visible chunk; updates the highlight as the user scrolls past each.
    observerRef.current = new IntersectionObserver((entries) => {
      // Take the entry with the largest intersectionRatio that's currently
      // intersecting; fall back to whatever just left the top.
      const sorted = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (sorted[0]) setActiveId((sorted[0].target as HTMLElement).id);
    }, { rootMargin: '-30% 0px -50% 0px', threshold: [0.1, 0.3, 0.6] });

    for (const el of els) observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [sections]);

  const jumpTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!enabled) return null;

  return (
    <nav
      aria-label="Page sections"
      className="hidden lg:flex fixed right-4 xl:right-6 top-1/2 -translate-y-1/2 z-30 flex-col gap-2 print:hidden"
    >
      {sections.map(s => {
        const active = s.id === activeId;
        return (
          <button
            key={s.id}
            onClick={() => jumpTo(s.id)}
            aria-label={`Jump to ${s.label}`}
            aria-current={active ? 'true' : undefined}
            className="group relative grid place-items-center h-6 w-6"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                active ? 'h-2.5 w-2.5 bg-brand' : 'h-1.5 w-1.5 bg-line group-hover:bg-muted'
              }`}
            />
            <span
              className={`absolute right-full mr-3 whitespace-nowrap text-[10px] uppercase tracking-[0.18em] font-semibold px-2 py-1 rounded-md bg-surface border border-line text-ink opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition pointer-events-none ${active ? 'opacity-100' : ''}`}
            >
              {s.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
