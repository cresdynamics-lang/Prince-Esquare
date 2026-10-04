import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { HOME_CATEGORY_CARDS } from '../../data/homepageContent';

/**
 * Section 3 — primary navigation surface.
 * Mobile: 2 columns · Desktop: 4 columns per row.
 */
export default function HomeCategoryRail() {
  return (
    <section id="shop-by-category" className="scroll-mt-28 border-t border-gold-600/10 bg-navy-950 py-20 md:py-28">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="mb-10 max-w-2xl space-y-4 md:mb-14">
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold-500">
            Shop by Category
          </p>
          <h2 className="font-display text-3xl leading-tight text-white md:text-4xl lg:text-[2.75rem]">
            Everything the man who&apos;s arrived needs in one place.
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-5 lg:gap-6">
          {HOME_CATEGORY_CARDS.map((card, i) => (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.45 }}
            >
              <Link
                to={card.href}
                className="group relative block aspect-[3/4] overflow-hidden border border-gold-500/10 sm:aspect-[4/5]"
              >
                <img
                  src={card.imageSm || card.image}
                  srcSet={card.imageSm ? `${card.imageSm} 800w, ${card.image} 1600w` : undefined}
                  sizes="(max-width: 767px) 50vw, 25vw"
                  alt=""
                  loading={i < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/25 to-transparent opacity-90" />
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 md:p-5 lg:p-6">
                  <span className="inline-flex items-center gap-1.5 font-display text-[13px] leading-tight text-gold-300 sm:gap-2 sm:text-base md:text-lg lg:text-xl">
                    {card.name}
                    <ArrowUpRight
                      size={14}
                      strokeWidth={1.75}
                      className="shrink-0 text-gold-500/80 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold-300 sm:h-4 sm:w-4 md:h-[18px] md:w-[18px]"
                      aria-hidden
                    />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
