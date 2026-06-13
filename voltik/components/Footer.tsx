import Link from 'next/link';
import { Icon } from './Icons';
import { NewsletterForm } from './NewsletterForm';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-x py-16 grid lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-10">
        <div>
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg">
            <span className="grid place-items-center h-8 w-8 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}>
              <Icon.bolt width={18} height={18} />
            </span>
            Voltik
          </Link>
          <p className="text-sm text-muted mt-4 max-w-xs leading-relaxed">
            Premium mobile accessories engineered for the way you live, work and play.
            Free worldwide shipping over $50.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {['Globe','Spark','Heart'].map(k => (
              <span key={k} className="grid place-items-center h-9 w-9 rounded-full border border-line text-muted hover:text-ink hover:border-brand transition">
                {k === 'Globe' && <Icon.globe width={16} height={16} />}
                {k === 'Spark' && <Icon.spark width={16} height={16} />}
                {k === 'Heart' && <Icon.heart width={16} height={16} />}
              </span>
            ))}
          </div>
        </div>

        <FooterCol title="Shop" links={[
          { label: 'All Products', href: '/shop' },
          { label: 'Charging',  href: '/shop?category=charging' },
          { label: 'Audio',     href: '/shop?category=audio' },
          { label: 'Cases',     href: '/shop?category=cases' },
          { label: 'Photography', href: '/shop?category=camera' }
        ]}/>

        <FooterCol title="Company" links={[
          { label: 'About Us', href: '#' },
          { label: 'Press', href: '#' },
          { label: 'Careers', href: '#' },
          { label: 'Sustainability', href: '#' }
        ]}/>

        <FooterCol title="Help" links={[
          { label: 'Shipping', href: '#' },
          { label: 'Returns', href: '#' },
          { label: 'Warranty', href: '#' },
          { label: 'Contact', href: '#' }
        ]}/>

        <div>
          <h4 className="font-semibold mb-3">Stay charged</h4>
          <p className="text-sm text-muted mb-3">Get early access to drops and 10% off your first order.</p>
          <NewsletterForm compact />
        </div>
      </div>

      <div className="container-x border-t border-line py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
        <span>© 2026 Voltik Technologies. All rights reserved.</span>
        <span className="flex items-center gap-4">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Cookies</a>
        </span>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="font-semibold mb-3">{title}</h4>
      <ul className="space-y-2 text-sm text-muted">
        {links.map(l => (
          <li key={l.label}>
            <Link href={l.href} className="hover:text-ink transition">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
