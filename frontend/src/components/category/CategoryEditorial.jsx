import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productCardSrcSet, hasProductImage } from '../../utils/cloudinary';
import { getProductMerchBadges, isEditorialPick, bespokeLeadCopy } from '../../utils/merchTags';

/**
 * Mid-grid editorial break — featured pick if one exists, else brand-voice fallback.
 */
export default function CategoryEditorial({
  product,
  brandLine,
  fallbackEyebrow = 'Collection',
  fallbackCtas = [],
}) {
  const pick = product && hasProductImage(product) && isEditorialPick(product) ? product : null;

  if (pick) {
    const raw = pick.thumbnail_optimized || pick.thumbnail || pick.image_url || '';
    const { src, srcSet } = productCardSrcSet(raw);
    const { primary } = getProductMerchBadges(pick);
    const bespokeLead = bespokeLeadCopy(pick);
    const caption =
      pick.focus_description ||
      "The suit we'd send a man to the boardroom in without a second thought.";

    return (
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="my-14 overflow-hidden border border-gold-600/15 bg-navy-900 md:my-20"
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          <Link to={`/product/${pick.slug}`} className="relative aspect-[4/5] md:aspect-auto md:min-h-[420px]">
            <img
              src={src}
              srcSet={srcSet || undefined}
              alt={pick.name}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            {primary ? (
              <span className="absolute left-4 top-4 bg-gold-600 px-3 py-1.5 font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-navy-950">
                {primary.label}
              </span>
            ) : null}
          </Link>
          <div className="flex flex-col justify-center space-y-5 px-6 py-10 md:px-12">
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-gold-500">
              The House Recommends
            </p>
            <Link
              to={`/product/${pick.slug}`}
              className="font-display text-3xl leading-tight text-white transition-colors hover:text-gold-300 md:text-4xl"
            >
              {pick.name}
            </Link>
            <p className="max-w-md font-sans text-[15px] font-light leading-relaxed text-navy-200">
              {caption}
            </p>
            <div>
              <p className="font-sans text-sm text-gold-400">
                KSh {parseFloat(pick.discount_price || pick.price || 0).toLocaleString()}
              </p>
              {bespokeLead ? (
                <p className="mt-1.5 font-sans text-[10px] font-medium tracking-[0.04em] text-gold-500/50">
                  {bespokeLead}
                </p>
              ) : null}
            </div>
            <Link
              to={`/product/${pick.slug}`}
              className="inline-flex w-fit items-center rounded-full bg-gold-600 px-7 py-3 font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-navy-950 transition-colors hover:bg-gold-500"
            >
              View piece
            </Link>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-14 border border-gold-600/15 bg-navy-900 px-6 py-14 text-center md:my-20 md:px-12 md:py-20"
    >
      <p className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-gold-500">
        {fallbackEyebrow}
      </p>
      <h3 className="mx-auto mt-4 max-w-2xl font-display text-3xl leading-tight text-white md:text-4xl">
        {brandLine || 'The rooms you walk into decide faster than the words you say.'}
      </h3>
      {fallbackCtas.length > 0 ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {fallbackCtas.map((cta) => (
            <Link
              key={cta.href}
              to={cta.href}
              className="border border-gold-500/40 px-6 py-3 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-gold-400 transition-colors hover:border-gold-400 hover:bg-gold-600 hover:text-navy-950"
            >
              {cta.label}
            </Link>
          ))}
          <a
            href="#category-grid-continue"
            className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-gold-500/70 underline decoration-gold-500/30 underline-offset-8 hover:text-gold-300"
          >
            Keep scrolling
          </a>
        </div>
      ) : null}
    </motion.section>
  );
}
