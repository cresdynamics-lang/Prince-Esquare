import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { tileImageFor } from '../data/categoryLooks';

/**
 * Full-width mega-menu: text links plus model photos. Empty categories are hidden
 * automatically and reappear as soon as they have products.
 */
const MegaMenu = ({ primary, onNavigate }) => {
  if (!primary) return null;
  const children = (primary.children || []).filter((col) => col.productCount !== 0);
  const allHref = shopPath(primary.slug);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.16 }}
      className="absolute inset-x-0 top-full z-50 border-y border-gold-500/20 bg-navy-950 shadow-2xl"
    >
      <div className="container mx-auto grid grid-cols-[minmax(180px,240px)_1fr] gap-8 px-6 py-7">
        <div>
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-400">Shop</p>
          <p className="mt-1.5 font-display text-3xl text-white">{primary.name}</p>
          <ul className="mt-4 space-y-2">
            {children.map((col) => (
              <li key={col.slug}>
                <Link
                  to={shopPath(primary.slug, col.slug)}
                  onClick={onNavigate}
                  className="font-sans text-sm text-navy-100 transition-colors hover:text-gold-300"
                >
                  {col.name}
                  {col.productCount ? <span className="ml-1.5 text-xs text-navy-300">({col.productCount})</span> : null}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to={allHref}
            onClick={onNavigate}
            className="mt-5 inline-block border-b border-gold-400 pb-0.5 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-gold-300 hover:text-gold-100"
          >
            Shop all {primary.name} →
          </Link>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {children.slice(0, 5).map((col) => {
            const image = tileImageFor(col.slug, col.tileImage || col.image);
            if (!image || image.endsWith('.svg')) return null;
            return (
              <Link key={col.slug} to={shopPath(primary.slug, col.slug)} onClick={onNavigate} className="group block">
                <div className="aspect-[3/4] max-h-[290px] w-full overflow-hidden bg-navy-900">
                  <img
                    src={image}
                    alt={`${col.name} at Prince Esquire`}
                    loading="lazy"
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <p className="mt-2 font-sans text-[13px] font-medium text-white group-hover:text-gold-300">{col.name}</p>
              </Link>
            );
          })}
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
