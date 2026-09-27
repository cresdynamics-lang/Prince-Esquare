import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * Wide seasonal / occasion banner (Linen Edit, Gift Sets).
 */
export default function HomeWideBanner({ eyebrow, title, cta, image, imageSm }) {
  return (
    <section className="relative flex min-h-[420px] items-end overflow-hidden md:min-h-[520px]">
      <img
        src={image}
        srcSet={imageSm ? `${imageSm} 800w, ${image} 1600w` : undefined}
        sizes="100vw"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/55 to-navy-950/25" />
      <div className="container relative z-10 mx-auto px-5 pb-14 pt-32 sm:px-6 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-xl space-y-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold-500">{eyebrow}</p>
          <h2 className="font-serif text-3xl leading-tight text-white md:text-5xl">{title}</h2>
          <Link
            to={cta.href}
            className="inline-flex items-center rounded-full bg-gold-600 px-8 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-navy-950 transition-colors hover:bg-gold-500"
          >
            {cta.label}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
