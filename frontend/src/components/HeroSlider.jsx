import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BRAND_TAGLINE, BRAND_LOCATION } from '../data/homepageContent';

/**
 * Single static hero — no carousel.
 * One line that lands: Come. We dress you.
 */
export default function HeroSlider() {
  return (
    <section className="hero-section relative overflow-hidden bg-navy-950">
      {/* Atmospheric plane — one still, not a carousel */}
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src="/hero/presidential-1600.webp"
          srcSet="/hero/presidential-800.webp 800w, /hero/presidential-1600.webp 1600w"
          sizes="100vw"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_18%] md:object-center scale-105"
          decoding="async"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/75 via-navy-950/55 to-navy-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(201,162,39,0.12),transparent_55%)]" />
      </div>

      <div className="relative z-10 flex min-h-[min(88svh,720px)] flex-col justify-end px-5 pb-10 pt-28 sm:px-6 sm:pb-14 md:min-h-[min(90vh,820px)] md:justify-center md:pb-20 md:pt-36">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-gold-600" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold-500">
                {BRAND_TAGLINE}
              </p>
            </div>

            <h1 className="font-serif text-[2.65rem] leading-[0.98] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Come.
              <br />
              <span className="italic text-gold-400">We dress you.</span>
            </h1>

            <p className="max-w-md text-[15px] font-light leading-relaxed text-navy-100/90 sm:text-lg md:max-w-lg">
              Not another outfit — the version of you you&apos;ve been waiting to meet.
              Walk in uncertain. Walk out himself.
            </p>

            <div className="pt-1">
              <Link
                to="/new-arrivals"
                className="group inline-flex items-center gap-3 rounded-full bg-gold-600 px-8 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-navy-950 shadow-lg shadow-navy-950/40 transition-all hover:bg-gold-500 sm:px-10 sm:py-4.5"
              >
                <span>New Arrivals</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="space-y-2 border-t border-gold-500/15 pt-6">
              <div className="flex items-center gap-2 text-gold-500/85">
                <MapPin size={13} className="shrink-0" strokeWidth={1.75} />
                <span className="text-[10px] font-medium uppercase tracking-[0.28em]">
                  {BRAND_LOCATION}
                </span>
              </div>
              <p className="max-w-sm pl-5 text-[12px] font-light leading-snug text-navy-200/80 sm:text-[13px]">
                Come visit us at Yala Towers. We dress the man you are becoming.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
