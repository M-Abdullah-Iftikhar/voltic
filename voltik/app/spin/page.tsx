import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SpinPageClient } from './SpinPageClient';

export const metadata: Metadata = {
  title: 'Spin to win · Voltik',
  description: 'One spin, one chance — drop your email for a fresh code on every visit.'
};

export default function SpinPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="container-x py-16">
        <SpinPageClient />
      </main>
      <Footer />
    </>
  );
}
