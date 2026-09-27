import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from '../ProductCard';
import HomeScrollRail from './HomeScrollRail';

/**
 * Horizontal product rail with section chrome + end-of-row CTA.
 */
export default function HomeProductRail({
  id,
  eyebrow,
  title,
  products = [],
  endHref,
  endLabel,
  badgeMode,
  loading = false,
}) {
  if (!loading && (!products || products.length === 0)) return null;

  return (
    <section id={id} className="border-t border-gold-600/10 bg-navy-950 py-20 md:py-28">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold-500">{eyebrow}</p>
            <h2 className="font-serif text-3xl leading-tight text-white md:text-4xl">{title}</h2>
          </div>
          {endHref && endLabel ? (
            <Link
              to={endHref}
              className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-gold-400 transition-colors hover:text-gold-200 md:inline-flex"
            >
              {endLabel}
              <ArrowRight size={14} />
            </Link>
          ) : null}
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2, 3].map((k) => (
              <div key={k} className="h-72 w-48 shrink-0 animate-pulse bg-navy-900/80 md:w-56" />
            ))}
          </div>
        ) : (
          <HomeScrollRail ariaLabel={title} gapClass="gap-4 md:gap-6">
            {products.map((product, i) => (
              <div
                key={product.id || product.slug}
                className="w-[68vw] max-w-[240px] shrink-0 sm:w-[40vw] md:w-[22vw] md:max-w-[240px] lg:w-[18vw]"
              >
                <ProductCard product={product} badgeMode={badgeMode} priority={i < 2} />
              </div>
            ))}
            {endHref && endLabel ? (
              <div className="flex w-[52vw] max-w-[200px] shrink-0 items-center justify-center sm:w-[32vw] md:w-[16vw]">
                <Link
                  to={endHref}
                  className="group flex h-full min-h-[240px] w-full flex-col items-center justify-center gap-3 border border-gold-500/20 bg-navy-900/40 px-4 text-center transition-colors hover:border-gold-500/45 hover:bg-navy-900/70"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold-400 group-hover:text-gold-200">
                    {endLabel}
                  </span>
                  <ArrowRight size={16} className="text-gold-500 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            ) : null}
          </HomeScrollRail>
        )}

        {endHref && endLabel ? (
          <div className="mt-8 md:hidden">
            <Link
              to={endHref}
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-gold-400"
            >
              {endLabel}
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
