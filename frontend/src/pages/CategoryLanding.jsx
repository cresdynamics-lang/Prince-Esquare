import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { buildBreadcrumbSchema, organizationSchema } from '../seo/seoData';
import HomeSignupBand from '../components/home/HomeSignupBand';
import CategorySubTiles from '../components/category/CategorySubTiles';
import CategoryFilterBar from '../components/category/CategoryFilterBar';
import CategoryEditorial from '../components/category/CategoryEditorial';
import CategoryCompleteLook from '../components/category/CategoryCompleteLook';
import { productAPI, taxonomyAPI } from '../services/api';
import {
  findTaxonBySlug,
  TAXONOMY_TREE,
  landingSeo,
  flattenTaxonomy,
} from '../data/taxonomy';
import {
  getCategoryPageConfig,
  getEditorialInsertAfter,
  SORT_OPTIONS,
} from '../data/categoryPages';
import { isEditorialPick } from '../utils/merchTags';
import { productMatchesFabrics } from '../utils/fabric';
import { trackViewCategory } from '../lib/metaPixel';

const shopHref = (...parts) => `/shop/${parts.filter(Boolean).join('/')}`;

function collectVariantMeta(products) {
  const sizes = new Set();
  const colors = new Set();
  for (const p of products) {
    const variants = Array.isArray(p.variants) ? p.variants : [];
    for (const v of variants) {
      if (v.size && v.size !== 'Standard') sizes.add(String(v.size));
      if (v.color) colors.add(String(v.color));
    }
  }
  return {
    sizes: [...sizes].sort((a, b) =>
      String(a).localeCompare(String(b), undefined, { numeric: true })
    ),
    colors: [...colors].sort((a, b) => a.localeCompare(b)),
  };
}

function productMatchesFilters(product, {
  selectedSubs,
  selectedSizes,
  selectedColors,
  selectedFabrics,
  minPrice,
  maxPrice,
  useSubFilter,
  useSizeFilter,
  useColorFilter,
}) {
  if (useSubFilter && selectedSubs.size > 0) {
    const slug = product.category_slug || '';
    if (!selectedSubs.has(slug)) return false;
  }
  if (!productMatchesFabrics(product, selectedFabrics)) return false;
  if (useSizeFilter && selectedSizes.size > 0) {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    if (!variants.some((v) => selectedSizes.has(String(v.size)))) return false;
  }
  if (useColorFilter && selectedColors.size > 0) {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    if (!variants.some((v) => selectedColors.has(String(v.color)))) return false;
  }
  const price = parseFloat(product.discount_price ?? product.price ?? 0);
  if (minPrice !== '' && !Number.isNaN(Number(minPrice)) && price < Number(minPrice)) return false;
  if (maxPrice !== '' && !Number.isNaN(Number(maxPrice)) && price > Number(maxPrice)) return false;
  return true;
}

/**
 * Category landing template (Suits + Shirts; reusable for remaining primaries).
 * Routes: /shop/:slug | /shop/:slug/:sub | /shop/:slug/:sub/:tier
 */
const CategoryLanding = () => {
  const { slug, sub, tier } = useParams();
  const leafSlug = tier || sub || slug;
  const isPrimaryView = Boolean(slug) && !sub && !tier;
  const pathParts = useMemo(() => [slug, sub, tier].filter(Boolean), [slug, sub, tier]);
  const pageConfig = getCategoryPageConfig(slug);

  const [landing, setLanding] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  const [selectedSubs, setSelectedSubs] = useState(() => new Set());
  const [selectedSizes, setSelectedSizes] = useState(() => new Set());
  const [selectedColors, setSelectedColors] = useState(() => new Set());
  const [selectedFabrics, setSelectedFabrics] = useState(() => new Set());
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');

  const staticFallback = findTaxonBySlug(leafSlug, TAXONOMY_TREE);
  const primaryNode = findTaxonBySlug(slug, TAXONOMY_TREE);

  useEffect(() => {
    setSelectedSubs(new Set());
    setSelectedSizes(new Set());
    setSelectedColors(new Set());
    setSelectedFabrics(new Set());
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
  }, [leafSlug]);

  useEffect(() => {
    if (!isPrimaryView || !pageConfig) return;
    trackViewCategory({ name: pageConfig.eyebrow || pageConfig.slug, slug: pageConfig.slug });
  }, [isPrimaryView, pageConfig]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    taxonomyAPI
      .landing(leafSlug)
      .then((res) => {
        if (!cancelled) setLanding(res.data?.data || null);
      })
      .catch(() => {
        if (!cancelled && staticFallback) {
          const flat = flattenTaxonomy(TAXONOMY_TREE);
          const crumbs = [{ name: 'Home', href: '/' }];
          pathParts.forEach((part, i) => {
            const node = flat.find((r) => r.slug === part);
            crumbs.push({
              name: node?.name || part.replace(/-/g, ' '),
              href: shopHref(...pathParts.slice(0, i + 1)),
              slug: part,
            });
          });
          setLanding({
            category: {
              name: staticFallback.name,
              slug: staticFallback.slug,
              navCopy: staticFallback.copy || '',
              heroImage: staticFallback.heroImage || staticFallback.tileImage,
              tileImage: staticFallback.tileImage,
            },
            children: (staticFallback.children || []).map((c) => ({
              name: c.name,
              slug: c.slug,
              tileImage: c.tileImage,
              navCopy: c.copy || '',
              crossSurfaces: c.crossSurfaces || [],
            })),
            breadcrumbs: crumbs,
          });
        } else if (!cancelled) setLanding(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [leafSlug, pathParts, staticFallback]);

  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    const sortApi = SORT_OPTIONS.find((o) => o.id === sort)?.api || 'newest';
    productAPI
      .list({ taxonomy: leafSlug, limit: 48, page: 1, sort: sortApi })
      .then((res) => {
        if (!cancelled) setProducts(res.data?.data?.products || []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [leafSlug, sort]);

  const category = landing?.category;
  const children = useMemo(() => {
    const mapChild = (c) => {
      const node = findTaxonBySlug(c.slug, TAXONOMY_TREE);
      return {
        name: c.name,
        slug: c.slug,
        tileImage: c.tileImage || node?.tileImage,
        navCopy: c.navCopy || c.copy || node?.copy || '',
        crossSurfaces: c.crossSurfaces || node?.crossSurfaces || [],
      };
    };

    let list = [];
    const fromApi = landing?.children || [];
    if (fromApi.length) {
      list = fromApi.map(mapChild);
    } else if (isPrimaryView && primaryNode?.children?.length) {
      list = primaryNode.children.map(mapChild);
    }

    // Suits primary: drop the duplicate "Suits" / suit-sets tile — page is already Suits
    if (slug === 'suits' && isPrimaryView) {
      list = list.filter((c) => c.slug !== 'suit-sets');
    }
    return list;
  }, [landing, isPrimaryView, primaryNode, slug]);

  const breadcrumbs = landing?.breadcrumbs || [{ name: 'Home', href: '/' }];

  const heroImage =
    (isPrimaryView && pageConfig?.heroImage) ||
    category?.heroImage ||
    category?.tileImage ||
    `/placeholders/taxonomy/${leafSlug}-hero.svg`;
  const heroImageSm = (isPrimaryView && pageConfig?.heroImageSm) || heroImage;

  const eyebrow =
    (isPrimaryView && pageConfig?.eyebrow) ||
    (category?.name ? category.name : 'Collection');
  const h1 =
    (isPrimaryView && pageConfig?.h1) ||
    category?.navCopy ||
    category?.name ||
    leafSlug;
  const subhead =
    (isPrimaryView && pageConfig?.subhead) ||
    (isPrimaryView ? '' : category?.navCopy || '');

  const seo = landingSeo({
    name: category?.name,
    navCopy: pageConfig?.subhead || category?.navCopy,
    description: category?.description,
  });

  const childHref = (childSlug) => {
    if (tier) return shopHref(slug, sub, childSlug);
    if (sub) return shopHref(slug, sub, childSlug);
    return shopHref(slug, childSlug);
  };

  const nativeSlugSet = useMemo(() => {
    const list = pageConfig?.gridNativeSlugs;
    return list?.length ? new Set(list) : null;
  }, [pageConfig]);

  const catalogProducts = useMemo(() => {
    if (isPrimaryView && nativeSlugSet) {
      return products.filter((p) => nativeSlugSet.has(p.category_slug));
    }
    return products;
  }, [products, isPrimaryView, nativeSlugSet]);

  const { sizes: sizeOptions, colors: colorOptions } = useMemo(
    () => collectVariantMeta(catalogProducts),
    [catalogProducts]
  );

  const showSubcategoryFilter = Boolean(pageConfig?.showSubcategoryFilter) && isPrimaryView;
  const showColorFilter = Boolean(pageConfig?.showColorFilter);
  const sizeWhenSubs = pageConfig?.sizeFilterWhenSubs || [];
  const showSizeFilter =
    sizeWhenSubs.length > 0 &&
    (sizeWhenSubs.includes(leafSlug) ||
      (selectedSubs.size > 0 && [...selectedSubs].some((s) => sizeWhenSubs.includes(s))));

  // Clear size picks when Size filter hides (e.g. Belts unchecked)
  useEffect(() => {
    if (!showSizeFilter && selectedSizes.size > 0) setSelectedSizes(new Set());
  }, [showSizeFilter, selectedSizes.size]);

  const filtered = useMemo(
    () =>
      catalogProducts.filter((p) =>
        productMatchesFilters(p, {
          selectedSubs,
          selectedSizes,
          selectedColors,
          selectedFabrics,
          minPrice,
          maxPrice,
          useSubFilter: showSubcategoryFilter,
          useSizeFilter: showSizeFilter,
          useColorFilter: showColorFilter,
        })
      ),
    [
      catalogProducts,
      selectedSubs,
      selectedSizes,
      selectedColors,
      selectedFabrics,
      minPrice,
      maxPrice,
      showSubcategoryFilter,
      showSizeFilter,
      showColorFilter,
    ]
  );

  const editorialProduct = useMemo(
    () => filtered.find((p) => isEditorialPick(p)) || null,
    [filtered]
  );

  const editorialAfter = getEditorialInsertAfter(filtered.length);
  const gridHead = filtered.slice(0, editorialAfter);
  const gridTail = filtered.slice(editorialAfter);

  const toggleInSet = (setter) => (value) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const showSubTiles =
    isPrimaryView && (children.length > 0 || (pageConfig?.crossLinkTiles?.length || 0) > 0);
  const showCompleteLook = isPrimaryView && pageConfig?.completeLook;
  const showFabricFilter = Boolean(pageConfig?.showFabricFilter);
  const subTilesLayout = pageConfig?.subTilesLayout || 'scroll';

  const hideBestselling = useMemo(() => {
    const triggers = pageConfig?.hideBestsellingWhenSubs || [];
    return triggers.length > 0 && triggers.includes(leafSlug);
  }, [pageConfig, leafSlug]);

  const activeSortOptions = useMemo(
    () =>
      hideBestselling
        ? SORT_OPTIONS.filter((o) => o.id !== 'bestselling')
        : SORT_OPTIONS,
    [hideBestselling]
  );

  useEffect(() => {
    if (hideBestselling && sort === 'bestselling') setSort('newest');
  }, [hideBestselling, sort]);

  const clearFilters = () => {
    setSelectedSubs(new Set());
    setSelectedSizes(new Set());
    setSelectedColors(new Set());
    setSelectedFabrics(new Set());
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <div className="min-h-screen bg-navy-950">
      <SEO
        title={seo.title}
        description={seo.description}
        path={shopHref(...pathParts)}
        keywords={[
          category?.name,
          eyebrow,
          'Prince Esquire',
          'menswear Kenya',
          'Nairobi',
        ].filter(Boolean)}
        schema={[
          organizationSchema,
          buildBreadcrumbSchema(
            (breadcrumbs || []).map((c) => ({
              name: c.name,
              path: c.href || c.path || '/',
            }))
          ),
        ]}
      />
      <Navbar />

      {/* 1–2 Breadcrumb + Category hero */}
      <section className="relative overflow-hidden border-b border-gold-600/10 pt-24 md:min-h-[42vh]">
        <div className="absolute inset-0" aria-hidden>
          <img
            src={heroImage}
            srcSet={
              heroImageSm && heroImageSm !== heroImage
                ? `${heroImageSm} 800w, ${heroImage} 1600w`
                : undefined
            }
            sizes="100vw"
            alt=""
            className="h-full w-full object-cover object-center"
            onError={(e) => {
              e.currentTarget.src = `/placeholders/taxonomy/${leafSlug}.svg`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/88 to-navy-950/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-navy-950/40" />
        </div>

        <div className="container relative z-10 mx-auto flex min-h-[36vh] flex-col justify-end px-5 pb-10 pt-10 sm:px-6 md:pb-14 md:pt-14">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 font-sans text-[9px] uppercase tracking-[0.22em] text-gold-500/55"
          >
            {breadcrumbs.map((crumb, i) => (
              <span key={`${crumb.href}-${i}`}>
                {i > 0 ? <span className="mx-2 text-gold-500/25">/</span> : null}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-gold-400/90">{crumb.name}</span>
                ) : (
                  <Link to={crumb.href} className="transition-colors hover:text-gold-300">
                    {crumb.name}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          {loading ? (
            <p className="font-sans text-[10px] uppercase tracking-widest text-gold-500/50">Loading…</p>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="max-w-2xl space-y-4"
            >
              <p className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-gold-500">
                {eyebrow}
              </p>
              <h1 className="font-display text-3xl leading-[1.12] text-white sm:text-4xl md:text-5xl">
                {h1}
              </h1>
              {subhead ? (
                <p className="max-w-xl font-sans text-[15px] font-light leading-relaxed text-navy-100/90 md:text-base">
                  {subhead}
                </p>
              ) : null}
            </motion.div>
          )}
        </div>
      </section>

      {/* 3 Subcategory tiles */}
      {showSubTiles ? (
        <CategorySubTiles
          children={children}
          childHref={childHref}
          layout={subTilesLayout}
          crossLinkHeading={pageConfig?.crossLinkHeading}
          crossLinkTiles={pageConfig?.crossLinkTiles || []}
        />
      ) : null}

      {/* 4–7 Filter + product grid + editorial break */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-5 sm:px-6">
          <CategoryFilterBar
            sort={sort}
            onSortChange={setSort}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPrice={setMinPrice}
            onMaxPrice={setMaxPrice}
            showFabricFilter={showFabricFilter}
            selectedFabrics={selectedFabrics}
            onToggleFabric={toggleInSet(setSelectedFabrics)}
            sortOptions={activeSortOptions}
            showSubcategoryFilter={showSubcategoryFilter}
            subcategories={isPrimaryView ? children : []}
            selectedSubs={selectedSubs}
            onToggleSub={toggleInSet(setSelectedSubs)}
            showColorFilter={showColorFilter}
            colors={colorOptions}
            selectedColors={selectedColors}
            onToggleColor={toggleInSet(setSelectedColors)}
            showSizeFilter={showSizeFilter}
            sizes={sizeOptions}
            selectedSizes={selectedSizes}
            onToggleSize={toggleInSet(setSelectedSizes)}
          />

          <div className="mb-8 flex items-end justify-between gap-4 border-b border-gold-600/10 pb-6">
            <div>
              <p className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-gold-500">
                The collection
              </p>
              <h2 className="mt-2 font-display text-2xl text-white md:text-3xl">
                {category?.name ? `Shop ${category.name}` : 'Shop'}
              </h2>
            </div>
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-500/45">
              {productsLoading
                ? 'Loading…'
                : `${filtered.length} piece${filtered.length === 1 ? '' : 's'}`}
            </p>
          </div>

          {productsLoading ? (
            <p className="py-24 text-center font-sans text-[10px] uppercase tracking-widest text-gold-600/50">
              Loading collection…
            </p>
          ) : filtered.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 xl:grid-cols-4 xl:gap-x-8 xl:gap-y-14">
                <AnimatePresence mode="popLayout">
                  {gridHead.map((product, i) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      motionProps={{
                        layout: true,
                        initial: { opacity: 0, y: 14 },
                        animate: { opacity: 1, y: 0 },
                        exit: { opacity: 0 },
                        transition: { delay: Math.min(i, 12) * 0.02 },
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* 6 Editorial insert */}
              {isPrimaryView ? (
                <CategoryEditorial
                  product={editorialProduct}
                  brandLine={pageConfig?.editorialFallbackLine || pageConfig?.h1}
                  fallbackEyebrow={pageConfig?.editorialFallbackEyebrow || pageConfig?.eyebrow}
                  fallbackCtas={pageConfig?.editorialFallbackCtas || []}
                />
              ) : null}

              {/* 7 Continue grid */}
              {gridTail.length > 0 ? (
                <div
                  id="category-grid-continue"
                  className="grid scroll-mt-28 grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 xl:grid-cols-4 xl:gap-x-8 xl:gap-y-14"
                >
                  <AnimatePresence mode="popLayout">
                    {gridTail.map((product, i) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        motionProps={{
                          layout: true,
                          initial: { opacity: 0, y: 14 },
                          animate: { opacity: 1, y: 0 },
                          exit: { opacity: 0 },
                          transition: { delay: Math.min(i, 12) * 0.02 },
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : null}
            </>
          ) : (
            <div className="space-y-6 py-24 text-center">
              <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-gold-600/40">
                No pieces match these filters
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="font-sans text-[10px] font-bold uppercase tracking-widest text-gold-500 underline underline-offset-4"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 8 Complete the Look */}
      {showCompleteLook ? <CategoryCompleteLook config={pageConfig.completeLook} /> : null}

      {/* 9 Sign-up */}
      <HomeSignupBand />

      {/* 10 Footer */}
      <Footer />
    </div>
  );
};

export default CategoryLanding;
