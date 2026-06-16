import Link from 'next/link';
import { Icon, type IconKey } from './Icons';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface Props {
  /** Section name — rendered above the headline. */
  kicker: string;
  title: string;
  body: string;
  /** Icon glyph that anchors the hero card. */
  icon?: IconKey;
  /** Optional teaser bullets to set expectations. */
  bullets?: string[];
  /** Where the secondary "Go back" CTA points; defaults to home. */
  backHref?: string;
}

/**
 * Friendly "this is on the way" landing — used for sections we link to
 * but haven't fully built yet. Renders as a full page (Navbar + Footer)
 * with a brand-mesh hero card so it never reads like a 404.
 *
 * Includes a newsletter teaser so the page still does something useful
 * for the visitor even if the feature isn't live.
 */
export function ComingSoon({
  kicker, title, body, icon = 'spark', bullets, backHref = '/'
}: Props) {
  const Glyph = Icon[icon];
  return (
    <>
      <Navbar />
      <main id="main" className="container-x py-20">
        <div className="relative max-w-2xl mx-auto">
          <div
            aria-hidden
            className="absolute -inset-3 rounded-[28px] pointer-events-none opacity-70"
            style={{
              background: 'conic-gradient(from 120deg at 50% 50%, rgb(var(--brand)/0.35), rgb(var(--brand2)/0.35), rgb(var(--accent2)/0.35), rgb(var(--brand)/0.35))',
              filter: 'blur(18px)'
            }}
          />
          <div className="relative card overflow-hidden p-10 sm:p-14 text-center">
            <div className="absolute inset-0 bg-mesh opacity-50" aria-hidden />
            <div className="relative">
              <span
                aria-hidden
                className="inline-grid place-items-center h-14 w-14 rounded-2xl text-white"
                style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}
              >
                <Glyph width={24} height={24} />
              </span>
              <div className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold mt-5">
                {kicker}
              </div>
              <h1 className="font-display font-bold text-3xl sm:text-4xl mt-2 leading-tight text-balance">
                {title}
              </h1>
              <p className="text-muted text-sm sm:text-base mt-3 max-w-md mx-auto leading-relaxed">
                {body}
              </p>

              {bullets && bullets.length > 0 && (
                <ul className="mt-6 grid sm:grid-cols-2 gap-2 max-w-md mx-auto text-left">
                  {bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted">
                      <Icon.check width={11} height={11} className="text-brand shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link href={backHref} className="btn-primary text-sm">
                  Back to where you were <Icon.arrow width={12} height={12} />
                </Link>
                <Link href="/shop" className="btn-ghost text-sm">
                  Browse the shop
                </Link>
              </div>

              <p className="text-[11px] text-muted mt-6">
                Want a nudge when it ships? Drop your email at the{' '}
                <Link href="/#snap-newsletter" className="text-brand hover:underline">newsletter</Link>{' '}
                or {' '}
                <Link href="/spin" className="text-brand hover:underline">spin the wheel</Link> for something to do in the meantime.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
