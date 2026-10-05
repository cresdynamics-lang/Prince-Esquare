import { Link } from 'react-router-dom';
import { getFitItWithItems } from '../../lib/fitItWith';

/**
 * Compact complementary category tiles on PDP — leaf categories only.
 * Renders on mobile and desktop, above “You may also like”.
 */
export default function FitItWith({ product }) {
  const { items } = getFitItWithItems(product);
  if (!items.length) return null;

  return (
    <section
      aria-labelledby="fit-it-with-heading"
      className="mt-16 pt-12 border-t border-gold-600/10 md:mt-20"
    >
      <div className="mb-6 md:mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold-500/70 mb-2">
          Complete the look
        </p>
        <h2
          id="fit-it-with-heading"
          className="font-serif text-xl md:text-2xl text-white leading-snug"
        >
          Fit it with
        </h2>
        <p className="mt-2 max-w-xl text-sm text-navy-200/90 leading-relaxed">
          Smaller categories that usually finish this piece — shirts, shoes, trousers, or a layer —
          so the outfit holds together from collar to sole.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 max-w-2xl">
        {items.map((item) => (
          <Link
            key={item.slug}
            to={item.href}
            className="group block"
          >
            <div className="relative aspect-square overflow-hidden bg-navy-900 border border-gold-600/15">
              <img
                src={item.image}
                alt={item.alt}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                onError={(e) => {
                  e.currentTarget.src = `/placeholders/taxonomy/${item.slug}.svg`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/20 to-transparent" />
              <span className="absolute bottom-2.5 left-2.5 right-2.5 font-serif text-[13px] md:text-sm text-white leading-tight">
                {item.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
