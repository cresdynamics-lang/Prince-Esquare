import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * Wide merchandising mega-menu: labeled columns with modeled placeholder thumbs.
 */
const MegaMenu = ({ primary, onNavigate, onClose }) => {
  if (!primary) return null;
  const children = primary.children || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="absolute left-1/2 top-full z-50 w-[min(920px,92vw)] -translate-x-1/2 pt-4"
      role="menu"
      aria-label={`${primary.name} menu`}
    >
      <div className="border border-gold-500/20 bg-navy-950/98 p-6 shadow-2xl backdrop-blur-xl md:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-gold-500/10 pb-4">
          <div>
            <p className="font-sans text-[9px] font-bold uppercase tracking-[0.35em] text-gold-500">
              Shop the edit
            </p>
            <h3 className="mt-1 font-serif text-2xl text-white md:text-3xl">{primary.name}</h3>
            {primary.navCopy || primary.description ? (
              <p className="mt-2 max-w-xl font-sans text-sm font-light leading-relaxed text-navy-200">
                {primary.navCopy || primary.description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onNavigate(primary.slug)}
            className="font-sans text-[9px] font-semibold uppercase tracking-[0.22em] text-gold-400 transition-colors hover:text-gold-200"
          >
            Shop all {primary.name} →
          </button>
        </div>

        <div
          className={`grid gap-4 ${
            children.length <= 3
              ? 'grid-cols-2 md:grid-cols-3'
              : children.length <= 4
                ? 'grid-cols-2 md:grid-cols-4'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
          }`}
        >
          {children.map((col) => {
            const hasNested = Array.isArray(col.children) && col.children.length > 0;
            const img = col.tileImage || col.image || `/placeholders/taxonomy/${col.slug}.svg`;
            return (
              <div key={col.slug} className="group flex flex-col">
                <button
                  type="button"
                  onClick={() => onNavigate(primary.slug, col.slug)}
                  className="text-left"
                >
                  <div className="relative mb-3 aspect-[4/5] overflow-hidden bg-navy-900 ring-1 ring-gold-500/15 transition-all group-hover:ring-gold-500/40">
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 right-3 font-serif text-base text-white md:text-lg">
                      {col.name}
                    </span>
                  </div>
                </button>
                {hasNested ? (
                  <ul className="mt-1 space-y-1.5 pl-0.5">
                    {col.children.map((tier) => (
                      <li key={tier.slug}>
                        <button
                          type="button"
                          onClick={() => onNavigate(primary.slug, col.slug, tier.slug)}
                          className="font-sans text-[9px] font-medium uppercase tracking-[0.16em] text-navy-200 transition-colors hover:text-gold-400"
                        >
                          {tier.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end border-t border-gold-500/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="font-sans text-[9px] uppercase tracking-[0.2em] text-navy-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MegaMenu;

/** Helpers shared with Navbar — Phase 2 landings live under /shop */
export const shopPath = (category, sub, tier) => {
  const parts = [category, sub, tier].filter(Boolean);
  if (!parts.length) return '/products';
  return `/shop/${parts.join('/')}`;
};

export const buildProductsPath = (category, sub) => shopPath(category, sub);
