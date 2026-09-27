import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';

const MIN_ROW_PRODUCTS = 4;

const toCardProduct = (product) => ({
  ...product,
  thumbnail:
    product.thumbnail_optimized ||
    product.thumbnail ||
    product.image_url ||
    '',
});

/**
 * Homepage category rails: horizontal scroll, newest-first products, lazy images.
 */
const ProductShowcase = ({ categoryRows = [] }) => {
  const rows = categoryRows
    .map((row) => {
      const products = [...(row.products || [])]
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at || 0) -
            new Date(a.updated_at || a.created_at || 0),
        );
      return { ...row, products };
    })
    .filter((row) => row.products.length >= MIN_ROW_PRODUCTS);

  if (!rows.length) return null;

  return (
    <section className="bg-navy-950 pb-16 pt-6 md:pb-24 md:pt-8">
      <div className="space-y-10 md:space-y-14">
        {rows.map((row, rowIndex) => (
          <div key={row.slug || row.title}>
            <div className="container mx-auto mb-4 flex items-end justify-between gap-4 px-5 sm:px-6 md:mb-5">
              <div>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.35em] text-gold-500/70">
                  Just in
                </p>
                <h2 className="font-serif text-xl text-white md:text-2xl">{row.title}</h2>
              </div>
              <Link
                to={row.path || '/products'}
                className="flex shrink-0 items-center gap-2 text-[10px] font-bold tracking-[0.28em] text-gold-500 transition-all hover:gap-3"
              >
                View All <ArrowRight size={14} />
              </Link>
            </div>

            <div
              className="homepage-product-rail flex gap-3 overflow-x-auto overscroll-x-contain px-5 pb-2 sm:gap-4 sm:px-6 md:gap-5"
              style={{
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              aria-label={`${row.title} products`}
            >
              {row.products.map((product, i) => (
                <div
                  key={product.id}
                  className="w-[42vw] max-w-[200px] shrink-0 snap-start sm:w-[30vw] sm:max-w-[220px] md:w-[22vw] md:max-w-[240px] lg:w-[18vw] lg:max-w-[260px]"
                >
                  <ProductCard
                    product={toCardProduct(product)}
                    priority={rowIndex === 0 && i < 2}
                    className="h-full"
                    sizes="(max-width: 640px) 42vw, (max-width: 1024px) 28vw, 240px"
                  />
                </div>
              ))}
              {/* end spacer so last card clears the edge */}
              <div className="w-1 shrink-0" aria-hidden="true" />
            </div>
          </div>
        ))}

        <div className="flex justify-center px-6 pt-2">
          <Link
            to="/products"
            className="inline-flex items-center gap-3 rounded-full border border-gold-500/50 px-10 py-4 text-[10px] font-bold tracking-[0.35em] text-gold-500 transition-all hover:bg-gold-500 hover:text-navy-950"
          >
            View All Products <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      <style>{`
        .homepage-product-rail::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
};

export default ProductShowcase;
