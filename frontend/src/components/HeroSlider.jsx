import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HERO_SLIDES } from '../data/homepageContent';
import { heroImageUrl, isCloudinaryUrl } from '../utils/cloudinary';

const getSlideImage = (slide) => {
  const src = slide?.image;
  if (!src) return '';
  return isCloudinaryUrl(src) ? heroImageUrl(src) : src;
};

const normalizeSlides = (rows = []) =>
  rows
    .filter((slide) => slide?.image)
    .map((slide) => ({
      ...slide,
      image: getSlideImage(slide),
      link: slide.link || slide.fallbackLink || '/products',
      cta: slide.cta || 'View Product',
      desc: slide.desc || slide.description || slide.subtitle || '',
    }));

const HeroSlider = ({ heroSlides }) => {
  const fallbackSlides = useMemo(() => normalizeSlides(HERO_SLIDES), []);
  const liveSlides = useMemo(
    () => (heroSlides?.length ? normalizeSlides(heroSlides) : null),
    [heroSlides]
  );
  const slides = liveSlides?.length ? liveSlides : fallbackSlides;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setCurrent(0);
  }, [slides]);

  useEffect(() => {
    if (!slides.length) return undefined;

    const preload = (idx) => {
      const slide = slides[idx];
      if (!slide?.image) return;
      const img = new Image();
      img.src = slide.image;
    };

    preload(0);
    preload(1);

    const timer = setInterval(() => {
      setCurrent((prev) => {
        const next = prev === slides.length - 1 ? 0 : prev + 1;
        preload((next + 1) % slides.length);
        return next;
      });
    }, 6000);

    return () => clearInterval(timer);
  }, [slides]);

  const nextSlide = () => setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  if (!slides.length) return null;

  const slide = slides[current];

  return (
    <section className="relative h-screen bg-navy-950 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${slide.link}-${current}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          {slide.image && (
            <img
              src={slide.image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover object-center"
              decoding="async"
              fetchPriority={current === 0 ? 'high' : 'auto'}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/55 to-navy-950/15" />
        </motion.div>
      </AnimatePresence>

      <div className="container mx-auto px-6 h-full flex items-center relative z-10">
        <div className="max-w-4xl space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${slide.link}-${current}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-4">
                <div className="h-px w-12 bg-gold-600" />
                <p className="text-gold-500 tracking-[0.4em]  text-[10px] font-bold">
                  {slide.subtitle}
                </p>
              </div>

              <h1 className="text-4xl md:text-7xl lg:text-8xl font-serif text-white leading-tight  tracking-tighter">
                {slide.title.split(' ').map((word, i) => (
                  <span key={i} className={i % 2 === 1 ? 'text-gold-500 italic' : ''}>
                    {word}{' '}
                  </span>
                ))}
              </h1>

              <p className="text-lg text-slate-300 max-w-xl font-light leading-relaxed line-clamp-3">
                {slide.desc}
              </p>

              <div className="pt-8">
                <Link
                  to={slide.link}
                  className="bg-gold-600 text-navy-950 px-12 py-5 text-[10px] font-bold  tracking-[0.2em] hover:bg-gold-500 transition-all flex items-center space-x-4 w-fit group"
                >
                  <span>{slide.cta}</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-12 right-12 flex items-center space-x-6 z-20">
          <div className="flex items-center space-x-2 mr-8">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={`h-1 transition-all duration-500 ${current === i ? 'w-12 bg-gold-500' : 'w-4 bg-gold-500/20'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={prevSlide}
            className="w-12 h-12 border border-gold-500/30 flex items-center justify-center text-gold-500 hover:bg-gold-500 hover:text-navy-950 transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="w-12 h-12 border border-gold-500/30 flex items-center justify-center text-gold-500 hover:bg-gold-500 hover:text-navy-950 transition-all"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      <div className="absolute right-10 top-1/2 -translate-y-1/2 origin-center rotate-90 hidden lg:block">
        <p className="text-gold-600/20 text-[10px] font-bold tracking-[1em]  whitespace-nowrap">
          ESTABLISHED 2026 · NAIROBI · LUXURY
        </p>
      </div>
    </section>
  );
};

export default HeroSlider;
