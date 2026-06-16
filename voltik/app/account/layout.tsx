import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AccountSidebar } from '@/components/AccountSidebar';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main" className="container-x py-10">
        <header className="mb-8">
          <span className="text-xs uppercase tracking-[0.18em] font-semibold text-brand">Your account</span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl mt-2">Dashboard</h1>
          <p className="text-muted mt-2 max-w-2xl">Orders, reviews, favourites and profile — all in one place.</p>
        </header>
        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          <AccountSidebar />
          <section className="min-w-0">{children}</section>
        </div>
      </main>
      <Footer />
    </>
  );
}
