import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const SHORTCUTS = [
  { name: 'Suits', href: '/shop/suits' },
  { name: 'Shirts', href: '/shop/shirts' },
  { name: 'Shoes', href: '/shop/shoes' },
  { name: 'New Arrivals', href: '/new-arrivals' },
];

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-navy-950">
      <SEO
        title="Page not found"
        description="The page you requested could not be found at Prince Esquire."
        path="/"
        noindex
      />
      <Navbar />
      <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-6 pb-20 pt-44 text-center">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">Error 404</p>
        <h1 className="mt-4 font-display text-4xl text-white md:text-5xl">This page has left the room.</h1>
        <p className="mt-4 max-w-md font-sans text-base font-light leading-relaxed text-navy-100">
          The link may be old, or the piece may have sold out. Try one of these instead.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {SHORTCUTS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="border border-gold-500/40 px-5 py-3 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-gold-300 transition-colors hover:bg-gold-500 hover:text-navy-950"
            >
              {link.name}
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
