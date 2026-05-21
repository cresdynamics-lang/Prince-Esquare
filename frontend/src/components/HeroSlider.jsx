import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const slides = [
  {
    image: '/WhatsApp Image 2026-05-12 at 8.07.17 PM.jpeg',
    subtitle: 'Bespoke Craftsmanship',
    title: 'THE PRESIDENTIAL COLLECTION',
    desc: 'Exquisite shirts tailored for the modern leader. Experience the pinnacle of sartorial excellence.',
    cta: 'Discover Collection',
    link: '/products?category=shirts'
  },
  {
    image: '/WhatsApp Image 2026-05-12 at 8.07.12 PM.jpeg',
    subtitle: 'Luxury Footwear',
    title: 'THE SANTONI EDIT',
    desc: 'Handcrafted Italian loafers and formal shoes that define sophistication in every step.',
    cta: 'Shop Footwear',
    link: '/products?category=shoes'
  },
  {
    image: '/WhatsApp Image 2026-05-12 at 8.07.21 PM.jpeg',
    subtitle: 'Summer Elegance',
    title: 'LINEN MASTERY',
    desc: 'Lightweight linen sets and trousers for the gentleman who values comfort without compromising style.',
    cta: 'View Linen',
    link: '/products?category=linen'
  },
  {
    image: '/WhatsApp Image 2026-05-12 at 8.07.38 PM.jpeg',
    subtitle: 'Premium Tracksuits',
    title: 'CASUAL LUXURY',
    desc: 'Elevate your off-duty look with our signature velour and cotton tracksuits.',
    cta: 'Shop Tracksuits',
    link: '/products?category=tracksuits'
  },
  {
    image: '/WhatsApp Image 2026-05-12 at 8.07.41 PM.jpeg',
    subtitle: 'Modern Gentlemen',
    title: 'SIGNATURE POLOS',
    desc: 'The perfect blend of comfort and style for any casual occasion.',
    cta: 'View Polos',
    link: '/products?category=polo'
  }
];

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  if (!slides || slides.length === 0) return null;

  return (
    <section className="relative h-screen bg-navy-950 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] scale-110"
            style={{
              backgroundImage: `url('${slides[current].image}')`,
              transform: 'scale(1.1) translateZ(0)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="container mx-auto px-6 h-full flex items-center relative z-10">
        <div className="max-w-4xl space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-4">
                <div className="h-px w-12 bg-gold-600" />
                <p className="text-gold-500 tracking-[0.4em] uppercase text-[10px] font-bold">
                  {slides[current].subtitle}
                </p>
              </div>

              <h1 className="text-6xl md:text-8xl font-serif text-white leading-tight uppercase tracking-tighter">
                {slides[current].title.split(' ').map((word, i) => (
                  <span key={i} className={i % 2 === 1 ? 'text-gold-500 italic' : ''}>
                    {word}{' '}
                  </span>
                ))}
              </h1>

              <p className="text-lg text-slate-300 max-w-xl font-light leading-relaxed">
                {slides[current].desc}
              </p>

              <div className="pt-8">
                <Link
                  to={slides[current].link}
                  className="bg-gold-600 text-navy-950 px-12 py-5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gold-500 transition-all flex items-center space-x-4 w-fit group"
                >
                  <span>{slides[current].cta}</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-12 right-12 flex items-center space-x-6 z-20">
        <div className="flex items-center space-x-2 mr-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 transition-all duration-500 ${current === i ? 'w-12 bg-gold-500' : 'w-4 bg-gold-500/20'
                }`}
            />
          ))}
        </div>
        <button
          onClick={prevSlide}
          className="w-12 h-12 border border-gold-500/30 flex items-center justify-center text-gold-500 hover:bg-gold-500 hover:text-navy-950 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={nextSlide}
          className="w-12 h-12 border border-gold-500/30 flex items-center justify-center text-gold-500 hover:bg-gold-500 hover:text-navy-950 transition-all"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Vertical Side Text */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 origin-center rotate-90 hidden lg:block">
        <p className="text-gold-600/20 text-[10px] font-bold tracking-[1em] uppercase whitespace-nowrap">
          ESTABLISHED 2026 · NAIROBI · LUXURY
        </p>
      </div>
    </section>
  );
};

export default HeroSlider;
