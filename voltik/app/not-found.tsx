import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { EmptyState } from '@/components/EmptyState';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="main" className="container-x py-20">
        <EmptyState
          kind="notfound"
          title="Page not found"
          body="The accessory you're looking for might be out of stock — or simply mis-wired."
          primary={{ href: '/shop', label: 'Shop catalog' }}
          secondary={{ href: '/', label: 'Back home' }}
        />
      </main>
      <Footer />
    </>
  );
}
