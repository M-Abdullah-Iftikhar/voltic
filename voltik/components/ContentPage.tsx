import Link from 'next/link';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Icon, type IconKey } from './Icons';

type Crumb = { href?: string; label: string };

interface Props {
  title: string;
  /** Short tagline rendered under the title. */
  kicker?: string;
  /** Icon to drop in the hero plate (e.g. 'shield', 'truck'). */
  icon?: IconKey;
  crumbs?: Crumb[];
  children: React.ReactNode;
}

/**
 * Generic shell for static informational pages (About, FAQ, Privacy…)
 * Wraps the content in Navbar/Footer + a consistent hero band so all
 * marketing pages feel like one product.
 */
export function ContentPage({ title, kicker, icon, crumbs, children }: Props) {
  const Glyph = icon ? Icon[icon] : null;
  return (
    <>
      <Navbar />
      <main id="main" className="container-x py-10">
        {(crumbs?.length ?? 0) > 0 && (
          <nav className="text-xs text-muted mb-6 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-ink">Home</Link>
            {crumbs!.map((c, i) => (
              <span key={i} className="flex items-center gap-2">
                <span>/</span>
                {c.href ? <Link href={c.href} className="hover:text-ink">{c.label}</Link> : <span className="text-ink">{c.label}</span>}
              </span>
            ))}
          </nav>
        )}

        <header className="mb-10 flex items-start gap-5">
          {Glyph && (
            <span
              className="grid place-items-center h-14 w-14 rounded-2xl text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}
              aria-hidden
            >
              <Glyph width={26} height={26} />
            </span>
          )}
          <div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl">{title}</h1>
            {kicker && <p className="text-muted mt-2 max-w-2xl leading-relaxed">{kicker}</p>}
          </div>
        </header>

        <article className="voltik-prose max-w-3xl space-y-6 text-sm leading-relaxed">
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}
