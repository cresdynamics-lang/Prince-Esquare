import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { CROSS_SURFACE_LABELS } from '../../data/categoryPages';
import HomeScrollRail from '../home/HomeScrollRail';

function TileCard({ child, href, crossLine, i, compact }) {
  const img = child.tileImage || child.image || `/placeholders/taxonomy/${child.slug}.svg`;

  return (
    <motion.div
      initial={{ opacity: 0, y: compact ? 0 : 12, x: compact ? 18 : 0 }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(i, 6) * 0.05 }}
      className={
        compact
          ? 'w-[30vw] max-w-[140px] shrink-0 sm:w-[28vw] sm:max-w-[180px] md:w-[22vw] md:max-w-[200px] lg:w-[18vw] lg:max-w-[220px]'
          : 'min-w-0'
      }
    >
      <Link to={href} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden border border-gold-500/10 bg-navy-900">
          <img
            src={img}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/25 to-transparent" />
          <div
            className={`absolute inset-x-0 bottom-0 ${
              compact ? 'p-2.5 sm:p-3.5 md:p-4' : 'p-3 sm:p-4 md:p-5'
            }`}
          >
            <span
              className={`inline-flex items-center gap-1 font-display leading-tight text-gold-300 ${
                compact
                  ? 'text-[11px] sm:gap-1.5 sm:text-sm md:text-base'
                  : 'text-sm sm:text-base md:text-lg'
              }`}
            >
              {child.name}
              <ArrowUpRight
                size={compact ? 12 : 14}
                className="shrink-0 text-gold-500/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </span>
            {crossLine ? (
              <p
                className={`mt-1 font-sans font-medium uppercase text-gold-500/55 ${
                  compact
                    ? 'text-[7px] tracking-[0.14em] sm:text-[8px] sm:tracking-[0.16em]'
                    : 'text-[8px] tracking-[0.16em] sm:text-[9px]'
                }`}
              >
                {crossLine}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function buildTile(child, href, i, compact, crossSurfacesBySlug) {
  const surfaces = crossSurfacesBySlug[child.slug] || child.crossSurfaces || [];
  const crossLine = surfaces.map((s) => CROSS_SURFACE_LABELS[s]).filter(Boolean)[0];
  return (
    <TileCard
      key={child.slug || href}
      child={child}
      href={href}
      crossLine={crossLine}
      i={i}
      compact={compact}
    />
  );
}

/**
 * Subcategory tiles — scroll (Suits), grid (Shirts/Trousers), or split
 * (Jackets: native row + cross-tagged link-out row).
 */
export default function CategorySubTiles({
  children = [],
  childHref,
  crossSurfacesBySlug = {},
  layout = 'scroll',
  crossLinkHeading,
  crossLinkTiles = [],
}) {
  if (!children.length && !crossLinkTiles.length) return null;

  const compact = layout === 'scroll';

  const nativeTiles = children.map((child, i) =>
    buildTile(child, childHref(child.slug), i, compact, crossSurfacesBySlug)
  );

  const linkTiles = crossLinkTiles.map((tile, i) =>
    buildTile(
      tile,
      tile.href,
      children.length + i,
      false,
      {}
    )
  );

  return (
    <section className="border-b border-gold-600/10 py-14 md:py-20">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="mb-10">
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-gold-500">
            Browse by edit
          </p>
          <h2 className="mt-2 font-display text-2xl text-white md:text-3xl">Choose your lane</h2>
        </div>

        {layout === 'split' ? (
          <div className="space-y-10 md:space-y-12">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5">
              {nativeTiles}
            </div>
            {linkTiles.length > 0 ? (
              <div>
                {crossLinkHeading ? (
                  <p className="mb-5 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-gold-500/70">
                    {crossLinkHeading}
                  </p>
                ) : null}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:max-w-2xl md:gap-5">
                  {linkTiles}
                </div>
              </div>
            ) : null}
          </div>
        ) : layout === 'grid' ? (
          <div
            className={`grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 ${
              children.length >= 5
                ? 'md:grid-cols-5'
                : children.length === 4
                  ? 'md:grid-cols-4'
                  : 'md:grid-cols-3'
            }`}
          >
            {nativeTiles}
          </div>
        ) : (
          <HomeScrollRail ariaLabel="Browse by edit" gapClass="gap-2 sm:gap-3 md:gap-4">
            {nativeTiles}
          </HomeScrollRail>
        )}
      </div>
    </section>
  );
}
