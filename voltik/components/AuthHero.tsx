import Link from 'next/link';
import { Icon } from './Icons';

/** Shared brand panel used by /login and /signup. */
export function AuthHero({ headline, bullets }: { headline: React.ReactNode; bullets: string[] }) {
  return (
    <div className="relative hidden lg:flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-mesh" />
      <div className="absolute inset-0 noise" />
      <div className="relative z-10 max-w-md p-12">
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-2xl">
          <span className="grid place-items-center h-10 w-10 rounded-2xl text-white" style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}>
            <Icon.bolt width={22} height={22} />
          </span>
          Voltik
        </Link>
        <h1 className="font-display font-bold text-4xl mt-10 leading-tight text-balance">{headline}</h1>
        <ul className="mt-10 space-y-3">
          {bullets.map(b => (
            <li key={b} className="flex items-center gap-2 text-sm">
              <Icon.check width={16} height={16} className="text-success" /> {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
