import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HOME_BESPOKE } from '../../data/homepageContent';

/**
 * Section 7 — full-width process strip (not a product rail).
 */
export default function HomeBespokeStrip({ leadDays } = {}) {
  const days = Number(leadDays) > 0 ? Math.round(Number(leadDays)) : HOME_BESPOKE.defaultLeadDays;
  const weeks = Math.max(1, Math.ceil(days / 7));
  const body = HOME_BESPOKE.bodyTemplate.replace('{weeks}', String(weeks));

  return (
    <section className="relative overflow-hidden border-y border-gold-600/10 bg-navy-900 py-24 md:py-32">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse at 20% 50%, rgba(197,138,61,0.12), transparent 50%), radial-gradient(ellipse at 80% 30%, rgba(197,138,61,0.06), transparent 45%)',
        }}
      />
      <div className="container relative z-10 mx-auto max-w-3xl px-5 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold-500">{HOME_BESPOKE.eyebrow}</p>
          <h2 className="font-serif text-3xl leading-tight text-white md:text-5xl">{HOME_BESPOKE.title}</h2>
          <p className="mx-auto max-w-xl text-[15px] font-light leading-relaxed text-navy-200 md:text-base">
            {body}
          </p>
          <div className="pt-4">
            <Link
              to={HOME_BESPOKE.cta.href}
              className="inline-flex items-center rounded-full border border-gold-500/50 bg-transparent px-10 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-gold-400 transition-all hover:border-gold-400 hover:bg-gold-600 hover:text-navy-950"
            >
              {HOME_BESPOKE.cta.label}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
