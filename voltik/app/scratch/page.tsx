import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScratchCard } from '@/components/ScratchCard';

export const metadata: Metadata = {
  title: 'Scratch & win · Voltik',
  description: 'Drag your finger across the foil. Whatever\'s under it is yours.'
};

export default function ScratchPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="container-x py-16">
        <div className="max-w-2xl mx-auto">
          <header className="text-center mb-10">
            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-accent2">Voltik · scratch & win</span>
            <h1 className="font-display font-bold text-3xl sm:text-5xl mt-2 leading-tight">
              One card. One drag. One code.
            </h1>
            <p className="text-muted text-sm sm:text-base mt-3 max-w-md mx-auto leading-relaxed">
              Drag your finger across the foil. Whatever lands under it is yours — no purchase required.
            </p>
          </header>

          <ScratchCard />

          <div className="text-center mt-10 text-xs text-muted">
            <Link href="/spin" className="text-brand hover:underline">
              Prefer a wheel? Spin one over here →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
