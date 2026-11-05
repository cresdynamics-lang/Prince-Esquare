import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BRAND_TAGLINE, HOME_HERO } from '../../data/homepageContent';

/**
 * Full-bleed hero with a short scroll-reveal portrait.
 * Phones and tablets scroll straight away with no pin: a pinned hero looks frozen under the
 * first swipe, because the page stays put while only the photo moves inside it.
 */
const PIN_QUERY = '(min-width: 1024px)';
const PHONE_OBJECT_POSITION = '58% 0%';

export default function HomeHero() {
  const hero = HOME_HERO;
  const sectionRef = useRef(null);
  const [pinned, setPinned] = useState(() => window.matchMedia(PIN_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(PIN_QUERY);
    const onChange = (e) => setPinned(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Face → torso/feet — finish early so scroll feels responsive
  const objectPosY = useTransform(scrollYProgress, [0, 0.55], [0, 78]);
  const objectPosition = useTransform(objectPosY, (y) => `58% ${y}%`);

  const copyOpacity = useTransform(scrollYProgress, [0, 0.18, 0.38], [1, 0.45, 0]);
  const copyY = useTransform(scrollYProgress, [0, 0.38], [0, 28]);
  const scrimOpacity = useTransform(scrollYProgress, [0, 0.28, 0.55], [1, 0.5, 0.18]);
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  const scrollToCategories = (e) => {
    e.preventDefault();
    const el = document.getElementById('shop-by-category');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      ref={sectionRef}
      className="relative h-[100svh] bg-navy-950 lg:h-[155vh]"
    >
      <div className="relative h-[100svh] overflow-hidden lg:sticky lg:top-0 lg:h-screen">
        <div className="absolute inset-0" aria-hidden="true">
          <motion.img
            src={hero.image}
            srcSet={`${hero.imageSm} 800w, ${hero.image} 1600w`}
            sizes="100vw"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-top md:object-[58%_top]"
            style={{ objectPosition: pinned ? objectPosition : PHONE_OBJECT_POSITION }}
            decoding="async"
            loading="eager"
            fetchPriority="high"
          />
          <motion.div className="absolute inset-0" style={pinned ? { opacity: scrimOpacity } : undefined}>
            <div className="absolute inset-0 bg-gradient-to-r from-navy-950/88 via-navy-950/40 to-transparent md:from-navy-950/80 md:via-navy-950/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/25 to-navy-950/20 md:from-navy-950/75 md:via-transparent md:to-navy-950/25" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_30%,rgba(201,162,39,0.12),transparent_50%)]" />
          </motion.div>
        </div>

        <motion.div
          style={pinned ? { opacity: copyOpacity, y: copyY } : undefined}
          className="relative z-10 flex h-full flex-col justify-end px-5 pb-16 pt-28 sm:px-6 sm:pb-20 md:justify-center md:pb-24 md:pt-36"
        >
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-xl space-y-5 sm:max-w-2xl sm:space-y-7 md:max-w-[34rem]"
            >
              <div className="space-y-2">
                <p className="font-display text-2xl tracking-[0.04em] text-gold-300 drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)] sm:text-3xl md:text-[2.15rem]">
                  Prince Esquire
                </p>
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.42em] text-gold-400/95 drop-shadow-[0_1px_10px_rgba(0,0,0,0.45)]">
                  {BRAND_TAGLINE}
                </p>
              </div>

              <h1 className="font-display text-[2.15rem] leading-[1.12] text-white drop-shadow-[0_3px_24px_rgba(0,0,0,0.65)] sm:text-[2.75rem] md:text-5xl lg:text-[3.35rem]">
                {hero.title}
              </h1>

              <p className="max-w-md font-sans text-[15px] font-light leading-relaxed text-white/92 drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)] sm:max-w-lg sm:text-lg">
                {hero.subhead}
              </p>

              <div className="flex flex-col items-start gap-5 pt-1 sm:flex-row sm:items-center sm:gap-8">
                <Link
                  to={hero.primaryCta.href}
                  className="group inline-flex items-center gap-3 rounded-full bg-gold-600 px-8 py-4 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-navy-950 shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-all hover:bg-gold-500"
                >
                  <span>{hero.primaryCta.label}</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href={hero.secondaryCta.href}
                  onClick={scrollToCategories}
                  className="font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-gold-200 underline decoration-gold-400/50 underline-offset-8 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] transition-colors hover:text-white hover:decoration-gold-300"
                >
                  {hero.secondaryCta.label}
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.p
          style={{ opacity: scrollHintOpacity }}
          className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 font-sans text-[9px] font-bold uppercase tracking-[0.35em] text-gold-300/80"
        >
          Scroll to see the look
        </motion.p>
      </div>
    </section>
  );
}
