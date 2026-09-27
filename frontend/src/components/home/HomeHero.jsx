import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HOME_HERO } from '../../data/homepageContent';

/**
 * Section 2 — full-bleed editorial hero. No product data, no carousel.
 */
export default function HomeHero() {
  const hero = HOME_HERO;

  const scrollToCategories = (e) => {
    e.preventDefault();
    const el = document.getElementById('shop-by-category');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="relative overflow-hidden bg-navy-950">
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src={hero.image}
          srcSet={`${hero.imageSm} 800w, ${hero.image} 1600w`}
          sizes="100vw"
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover object-[center_18%] md:object-center"
          decoding="async"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-navy-950/50 to-navy-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_28%_18%,rgba(201,162,39,0.14),transparent_55%)]" />
      </div>

      <div className="relative z-10 flex min-h-[min(92svh,820px)] flex-col justify-end px-5 pb-12 pt-28 sm:px-6 sm:pb-16 md:min-h-[min(92vh,900px)] md:justify-center md:pb-24 md:pt-36">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 sm:space-y-8"
          >
            <h1 className="font-display text-[2.4rem] leading-[1.08] text-white sm:text-5xl md:text-6xl lg:text-[3.85rem]">
              {hero.title}
            </h1>

            <p className="max-w-xl font-sans text-[15px] font-light leading-relaxed text-navy-100/90 sm:text-lg">
              {hero.subhead}
            </p>

            <div className="flex flex-col items-start gap-5 pt-2 sm:flex-row sm:items-center sm:gap-8">
              <Link
                to={hero.primaryCta.href}
                className="group inline-flex items-center gap-3 rounded-full bg-gold-600 px-8 py-4 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-navy-950 shadow-lg shadow-navy-950/40 transition-all hover:bg-gold-500"
              >
                <span>{hero.primaryCta.label}</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href={hero.secondaryCta.href}
                onClick={scrollToCategories}
                className="font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-gold-400/90 underline decoration-gold-500/30 underline-offset-8 transition-colors hover:text-gold-200 hover:decoration-gold-400"
              >
                {hero.secondaryCta.label}
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
