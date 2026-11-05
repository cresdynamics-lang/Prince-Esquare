import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { CROSS_SURFACE_LABELS } from '../../data/categoryPages';
import { tileImageFor } from '../../data/categoryLooks';

function TileCard({ child, href, crossLine }) {
  const img = tileImageFor(child.slug, child.tileImage || child.image);

  return (
    <div className="min-w-0">
      <Link to={href} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden bg-navy-900">
          <img
            src={img}
            alt={`${child.name} at Prince Esquire, Nairobi`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </div>
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-lg leading-tight text-white transition-colors group-hover:text-gold-300 md:text-xl">
              {child.name}
            </p>
            <p className="mt-1 font-sans text-xs text-navy-200">
              {child.productCount ? `${child.productCount} ${child.productCount === 1 ? 'style' : 'styles'}` : crossLine || 'Shop now'}
            </p>
          </div>
          <ArrowUpRight
            size={18}
            className="mt-0.5 shrink-0 text-gold-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
      </Link>
    </div>
  );
}

const hasRealPhoto = (tile) => {
  const img = tileImageFor(tile.slug, tile.tileImage || tile.image);
  return Boolean(img) && !img.endsWith('.svg');
};

function buildTile(child, href, crossSurfacesBySlug) {
  const surfaces = crossSurfacesBySlug[child.slug] || child.crossSurfaces || [];
  const crossLine = surfaces.map((s) => CROSS_SURFACE_LABELS[s]).filter(Boolean)[0];
  return (
    <TileCard
      key={child.slug || href}
      child={child}
      href={href}
      crossLine={crossLine}
    />
  );
}

/**
 * Subcategory tiles with the name under the photo, so the model stays visible.
 * Empty subcategories hide themselves until they have products.
 */
export default function CategorySubTiles({
  children = [],
  childHref,
  crossSurfacesBySlug = {},
  crossLinkHeading,
  crossLinkTiles = [],
}) {
  const liveChildren = children.filter((child) => child.productCount !== 0);
  const liveLinks = crossLinkTiles.filter(hasRealPhoto);
  if (!liveChildren.length && !liveLinks.length) return null;

  const nativeTiles = liveChildren.map((child) =>
    buildTile(child, childHref(child.slug), crossSurfacesBySlug)
  );
  const linkTiles = liveLinks.map((tile) => buildTile(tile, tile.href, {}));

  const columns =
    liveChildren.length >= 5 ? 'md:grid-cols-5' : liveChildren.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';

  return (
    <section className="border-b border-gold-600/10 py-12 md:py-16">
      <div className="container mx-auto px-5 sm:px-6">
        <h2 className="mb-8 font-display text-3xl text-white md:text-4xl">Shop by style</h2>
        <div className={`grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 ${columns}`}>{nativeTiles}</div>
        {linkTiles.length > 0 ? (
          <div className="mt-10">
            {crossLinkHeading ? (
              <p className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">
                {crossLinkHeading}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-4">{linkTiles}</div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
