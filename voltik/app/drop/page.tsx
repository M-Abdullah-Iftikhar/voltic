import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { DropEventLanding } from '@/components/DropEventLanding';
import { db } from '@/lib/db';
import { enrichOne } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Voltik · Drop event',
  description: 'A limited Voltik drop. Reserve your spot in the queue before it goes live.'
};

/**
 * `/drop` — the live-stream-style hype page. Picks a product to anchor
 * the drop deterministically (the first New-badged SKU; falls back to
 * the highest-rated one if no badge match) and sets the launch window
 * 36 hours out so the countdown always has something to show in the
 * demo.
 */
export default async function DropPage() {
  const raw = await db.listProducts();
  if (raw.length === 0) notFound();

  const target =
    raw.find(p => p.badge === 'New') ||
    raw.find(p => p.badge === 'Bestseller') ||
    raw.slice().sort((a, b) => b.price - a.price)[0];
  const product = await enrichOne(target);

  // Drop window: 36h from request time so the page is always counting.
  // Real launches will key off an `ads` collection entry — see the
  // promotional content model task in IMPROVEMENTS.md.
  const dropAt = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();

  return (
    <>
      <Navbar />
      <main id="main">
        <DropEventLanding product={product} dropAt={dropAt} />
      </main>
      <Footer />
    </>
  );
}
