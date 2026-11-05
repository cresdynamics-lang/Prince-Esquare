import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from '../ProductCard';
import { productAPI } from '../../services/api';

const TABS = [
  { label: 'Suits', slug: 'suits', href: '/shop/suits' },
  { label: 'Shirts', slug: 'shirts', href: '/shop/shirts' },
  { label: 'Shoes', slug: 'shoes', href: '/shop/shoes' },
  { label: 'Trousers', slug: 'trousers', href: '/shop/trousers' },
];

const PER_TAB = 8;

/** Lets a shopper browse the main departments in one tap, in a grid rather than a sideways rail. */
export default function HomeCategoryTabs() {
  const [active, setActive] = useState(TABS[0]);
  const [lists, setLists] = useState({});

  const { slug } = active;
  useEffect(() => {
    if (lists[slug]) return undefined;
    let cancelled = false;
    productAPI
      .list({ taxonomy: slug, limit: PER_TAB, page: 1, sort: 'newest' })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data || {};
        setLists((prev) => ({
          ...prev,
          [slug]: { products: data.products || [], total: data.pagination?.total ?? data.total ?? null },
        }));
      })
      .catch(() => {
        if (!cancelled) setLists((prev) => ({ ...prev, [slug]: { products: [], total: null } }));
      });
    return () => {
      cancelled = true;
    };
  }, [slug, lists]);

  const current = lists[slug];

  return (
    <section id="home-shop-tabs" className="border-t border-gold-600/10 bg-navy-950 py-16 md:py-24">
      <div className="container mx-auto px-5 sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold-500">Shop the Collection</p>
        <h2 className="mt-4 font-serif text-3xl leading-tight text-white md:text-4xl">
          Start with what today calls for.
        </h2>

        <div role="tablist" aria-label="Shop by department" className="mt-8 grid grid-cols-4 gap-1.5 sm:flex sm:gap-2">
          {TABS.map((tab) => {
            const selected = tab.slug === slug;
            return (
              <button
                key={tab.slug}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(tab)}
                className={`min-h-11 min-w-0 touch-manipulation border px-1 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors sm:px-5 sm:text-xs sm:tracking-[0.16em] ${
                  selected
                    ? 'border-gold-500 bg-gold-500 text-navy-950'
                    : 'border-gold-500/30 text-gold-200 hover:border-gold-400'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-6">
          {current
            ? current.products.map((product) => (
                <div key={product.id || product.slug} className="min-w-0">
                  <ProductCard product={product} />
                </div>
              ))
            : Array.from({ length: PER_TAB }, (_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse bg-navy-900/80" />
              ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to={active.href}
            className="inline-flex min-h-11 items-center gap-2 border border-gold-500/50 px-7 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-gold-200 transition-colors hover:border-gold-300 hover:text-gold-100"
          >
            View all {current?.total ? `${current.total} ` : ''}
            {active.label.toLowerCase()}
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
