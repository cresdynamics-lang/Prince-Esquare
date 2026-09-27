import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productCardSrcSet, hasProductImage } from '../../utils/cloudinary';
import { EDITORIAL_CAPTIONS } from '../../data/homepageContent';

function editorialBadge(product) {
  const tags = Array.isArray(product?.merch_tags) ? product.merch_tags : [];
  if (tags.includes('presidential_pick')) {
    return { id: 'presidential_pick', label: 'Presidential Pick' };
  }
  if (tags.includes('editors_choice')) {
    return { id: 'editors_choice', label: "Editor's Choice" };
  }
  return null;
}

function captionFor(product, badge) {
  const focus = String(product?.focus_description || '').trim();
  if (focus) return focus;
  if (badge?.id && EDITORIAL_CAPTIONS[badge.id]) return EDITORIAL_CAPTIONS[badge.id];
  return EDITORIAL_CAPTIONS.default;
}

/**
 * Section 6 — fixed 2/3-up editorial grid (capped curated picks, no scroll).
 */
export default function HomeEditorial({ products = [] }) {
  const list = (products || []).filter(hasProductImage).slice(0, 6);
  if (!list.length) return null;

  const count = list.length;
  const gridClass =
    count <= 2
      ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
      : count === 3
        ? 'grid-cols-1 sm:grid-cols-3 max-w-5xl mx-auto'
        : count === 4
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="border-t border-gold-600/10 bg-navy-950 py-20 md:py-28">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl space-y-4 text-center md:mb-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold-500">The House Recommends</p>
          <h2 className="font-serif text-3xl leading-tight text-white md:text-4xl">
            A handful of pieces we&apos;d put our name on.
          </h2>
        </div>

        <div className={`grid gap-8 md:gap-10 ${gridClass}`}>
          {list.map((product, i) => {
            const badge = editorialBadge(product);
            const raw = product.thumbnail_optimized || product.thumbnail || product.image_url || '';
            const { src, srcSet } = productCardSrcSet(raw);
            if (!src) return null;
            return (
              <motion.div
                key={product.id || product.slug}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className="group flex flex-col"
              >
                <Link to={`/product/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-navy-900">
                  <img
                    src={src}
                    srcSet={srcSet || undefined}
                    alt={product.name || ''}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  {badge ? (
                    <span className="absolute left-4 top-4 z-10 bg-gold-600 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-navy-950 shadow-lg">
                      {badge.label}
                    </span>
                  ) : null}
                </Link>
                <div className="space-y-2 pt-5">
                  <Link
                    to={`/product/${product.slug}`}
                    className="font-serif text-lg leading-snug text-white transition-colors group-hover:text-gold-400 md:text-xl"
                  >
                    {product.name}
                  </Link>
                  <p className="text-[13px] font-light leading-relaxed text-navy-300/90">
                    {captionFor(product, badge)}
                  </p>
                  <p className="pt-1 text-sm text-gold-400">
                    KSh {parseFloat(product.discount_price || product.price || 0).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
