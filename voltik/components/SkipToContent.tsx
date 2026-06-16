/**
 * A11y skip link. Hidden until focused, then jumps to <main id="main">.
 * Every page already wraps its real content in <main>; we set id="main"
 * on the body root via the layout wrapper so this always lands somewhere.
 */
export function SkipToContent() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-full focus:bg-ink focus:text-bg focus:font-semibold focus:shadow-soft focus:outline-none focus:ring-2 focus:ring-brand"
    >
      Skip to content
    </a>
  );
}
