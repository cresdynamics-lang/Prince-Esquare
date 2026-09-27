import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard';
import HomeScrollRail from '../home/HomeScrollRail';
import { productAPI } from '../../services/api';
import { hasProductImage } from '../../utils/cloudinary';

/**
 * Cross-category nudge — smaller cards from related taxonomies.
 * `config.compact` = lighter "finishing touch" treatment (Accessories).
 */
export default function CategoryCompleteLook({ config }) {
  const [products, setProducts] = useState([]);
  const compact = Boolean(config?.compact);

  useEffect(() => {
    if (!config?.sources?.length) return undefined;
    let cancelled = false;
    const max = config.limit || 5;

    Promise.all(
      config.sources.map((tax) =>
        productAPI
          .list({ taxonomy: tax, limit: 8, page: 1, sort: 'updated' })
          .then((res) => {
            const list = res.data?.data?.products || res.data?.data || [];
            return Array.isArray(list) ? list : [];
          })
          .catch(() => [])
      )
    ).then((groups) => {
      if (cancelled) return;
      const seen = new Set();
      const merged = [];
      const bestsellerOnly = Boolean(config.bestsellerOnly);
      let depth = 0;
      let progressed = true;
      while (merged.length < max && progressed) {
        progressed = false;
        for (const group of groups) {
          if (depth >= group.length) continue;
          const p = group[depth];
          const isBestseller =
            Array.isArray(p?.merch_tags) && p.merch_tags.includes('bestseller');
          if (
            !p?.id ||
            seen.has(p.id) ||
            !hasProductImage(p) ||
            (bestsellerOnly && !isBestseller)
          ) {
            progressed = true;
            continue;
          }
          seen.add(p.id);
          merged.push(p);
          progressed = true;
          if (merged.length >= max) break;
        }
        depth += 1;
      }
      // Fallback: if no bestsellers tagged yet, show top of the source list
      if (bestsellerOnly && merged.length === 0) {
        for (const group of groups) {
          for (const p of group) {
            if (!p?.id || seen.has(p.id) || !hasProductImage(p)) continue;
            seen.add(p.id);
            merged.push(p);
            if (merged.length >= max) break;
          }
          if (merged.length >= max) break;
        }
      }
      setProducts(merged);
    });

    return () => {
      cancelled = true;
    };
  }, [config]);

  if (!config || products.length === 0) return null;

  return (
    <section
      className={`border-t border-gold-600/10 ${
        compact ? 'py-10 md:py-14' : 'py-16 md:py-24'
      }`}
    >
      <div className="container mx-auto px-5 sm:px-6">
        <div className={`max-w-xl space-y-2 ${compact ? 'mb-6' : 'mb-10 space-y-3'}`}>
          <p
            className={`font-sans font-bold uppercase tracking-[0.35em] text-gold-500 ${
              compact ? 'text-[9px] text-gold-500/70' : 'text-[10px]'
            }`}
          >
            {config.eyebrow}
          </p>
          <h2
            className={`font-display text-white ${
              compact ? 'text-xl text-white/90 md:text-2xl' : 'text-2xl md:text-3xl'
            }`}
          >
            {config.title}
          </h2>
        </div>

        <HomeScrollRail ariaLabel={config.title} gapClass={compact ? 'gap-2 md:gap-3' : 'gap-3 md:gap-4'}>
          {products.map((product, i) => (
            <div
              key={product.id}
              className={
                compact
                  ? 'w-[36vw] max-w-[140px] shrink-0 sm:w-[22vw] md:w-[12vw] md:max-w-[140px]'
                  : 'w-[42vw] max-w-[180px] shrink-0 sm:w-[28vw] md:w-[16vw] md:max-w-[180px]'
              }
            >
              <ProductCard
                product={product}
                priority={i < 2}
                sizes={compact ? '140px' : '180px'}
                showVariantMeta={!compact}
              />
            </div>
          ))}
          {config.cta?.href ? (
            <div
              className={`flex shrink-0 items-center justify-center ${
                compact
                  ? 'w-[30vw] max-w-[110px] md:w-[10vw]'
                  : 'w-[36vw] max-w-[140px] md:w-[12vw]'
              }`}
            >
              <Link
                to={config.cta.href}
                className={`flex h-full w-full flex-col items-center justify-center gap-2 border px-3 text-center font-sans font-bold uppercase tracking-[0.2em] text-gold-400 hover:border-gold-500/45 ${
                  compact
                    ? 'min-h-[140px] border-gold-500/15 text-[8px] text-gold-500/70'
                    : 'min-h-[200px] border-gold-500/20 text-[9px]'
                }`}
              >
                {config.cta.label || 'Shop more'}
              </Link>
            </div>
          ) : null}
        </HomeScrollRail>
      </div>
    </section>
  );
}
