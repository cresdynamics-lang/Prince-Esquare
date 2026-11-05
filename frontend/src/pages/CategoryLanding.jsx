import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { buildBreadcrumbSchema, buildFaqSchema, organizationSchema, SITE_URL } from '../seo/seoData';
import { looksFor } from '../data/categoryLooks';
import HomeSignupBand from '../components/home/HomeSignupBand';
import CategorySubTiles from '../components/category/CategorySubTiles';
import DeliveryVisitStrip from '../components/category/DeliveryVisitStrip';
import CategoryFilterBar from '../components/category/CategoryFilterBar';
import CategoryEditorial from '../components/category/CategoryEditorial';
import CategoryCompleteLook from '../components/category/CategoryCompleteLook';
import { productAPI, taxonomyAPI } from '../services/api';
import {
  findTaxonBySlug,
  TAXONOMY_TREE,
  landingSeo,
  canonicalShopPath,
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

const PAGE_SIZE = 24;
/** Show the page's namesake first: real suits before blazers on the Suits page. */
const LEAD_SLUGS = { suits: ['two-piece', 'three-piece'] };

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
  const [, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  const [selectedSubs, setSelectedSubs] = useState(() => new Set());
  const [selectedSizes, setSelectedSizes] = useState(() => new Set());
  const [selectedColors, setSelectedColors] = useState(() => new Set());
  const [selectedFabrics, setSelectedFabrics] = useState(() => new Set());
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
    setVisibleCount(PAGE_SIZE);
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
      .list({ taxonomy: leafSlug, limit: 200, page: 1, sort: sortApi })
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
        productCount: c.productCount,
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
    '';

  const apiSeo = landing?.seo;
  const fallbackSeo = landingSeo({ name: category?.name, description: category?.description });
  const categoryName = category?.name || staticFallback?.name || leafSlug.replace(/-/g, ' ');
  const h1 = apiSeo?.h1 || `${categoryName} for Men in Kenya`;
  const seoTitle = apiSeo?.title || fallbackSeo.title;
  const seoDescription = apiSeo?.description || fallbackSeo.description;
  const seoIntro = apiSeo?.intro || '';
  const faqs = apiSeo?.faqs || [];
  const guide = apiSeo?.guide || [];
  const relatedPosts = apiSeo?.relatedPosts || [];
  /** Brand voice stays on the page as a tagline under the descriptive H1. */
  const tagline = (isPrimaryView && pageConfig?.h1) || category?.navCopy || '';

  const looks = useMemo(() => {
    const curated = looksFor(leafSlug, slug);
    if (curated.length) return curated;
    return heroImage && !heroImage.endsWith('.svg') ? [heroImage] : [];
  }, [leafSlug, slug, heroImage]);

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
    const list =
      isPrimaryView && nativeSlugSet
        ? products.filter((p) => nativeSlugSet.has(p.category_slug))
        : products;
    const lead = LEAD_SLUGS[leafSlug];
    if (!lead || sort !== 'newest') return list;
    return [...list].sort(
      (a, b) => Number(lead.includes(b.category_slug)) - Number(lead.includes(a.category_slug))
    );
  }, [products, isPrimaryView, nativeSlugSet, leafSlug, sort]);

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

  const visibleProducts = filtered.slice(0, visibleCount);
  const editorialAfter = getEditorialInsertAfter(visibleProducts.length);
  const gridHead = visibleProducts.slice(0, editorialAfter);
  const gridTail = visibleProducts.slice(editorialAfter);
  const cardMotion = (i) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: Math.min(i, 8) * 0.02 },
  });

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
        title={seoTitle}
        description={seoDescription}
        path={staticFallback ? canonicalShopPath(leafSlug) : shopHref(...pathParts)}
        noindex={apiSeo?.count === 0}
        image={looks[0] ? `${SITE_URL}${looks[0]}` : undefined}
        schema={[
          organizationSchema,
          buildBreadcrumbSchema(
            (breadcrumbs || []).map((c) => ({
              name: c.name,
              path: c.href || c.path || '/',
            }))
          ),
          apiSeo?.count > 0 ? buildFaqSchema(faqs) : null,
        ]}
      />
      <Navbar />

      {/* Category hero: the name people search for, next to full-length model photos */}
      <section className="border-b border-gold-600/10 pt-[68px] sm:pt-24 lg:pt-[136px]">
        <div className="container mx-auto grid grid-cols-1 gap-6 px-5 pb-8 pt-6 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-10 lg:pb-12">
          <div className="min-w-0 lg:col-span-5">
            <nav aria-label="Breadcrumb" className="mb-5 font-sans text-xs text-navy-200">
              {breadcrumbs.map((crumb, i) => (
                <span key={`${crumb.href}-${i}`}>
                  {i > 0 ? <span className="mx-1.5 text-gold-400/70">/</span> : null}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="text-gold-300">{crumb.name}</span>
                  ) : (
                    <Link to={crumb.href} className="transition-colors hover:text-gold-300">
                      {crumb.name}
                    </Link>
                  )}
                </span>
              ))}
            </nav>

            <h1 className="font-display text-[2.1rem] leading-[1.08] text-white sm:text-5xl lg:text-[3.4rem]">{h1}</h1>
            {tagline ? (
              <p className="mt-4 max-w-lg font-serif text-lg italic leading-snug text-gold-200 md:text-xl">{tagline}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a
                href="#collection"
                className="bg-gold-500 px-6 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-navy-950 transition-colors hover:bg-gold-300"
              >
                Shop the collection
              </a>
              {apiSeo?.count > 0 ? (
                <p className="font-sans text-sm text-navy-100">
                  {apiSeo.count} {apiSeo.count === 1 ? 'style' : 'styles'}
                  {apiSeo.minPrice ? ` from KSh ${Number(apiSeo.minPrice).toLocaleString('en-KE')}` : ''}
                </p>
              ) : null}
            </div>
          </div>

          {looks.length > 0 ? (
            <div className="min-w-0 lg:col-span-7">
              <div className="-mx-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:grid lg:grid-cols-3 lg:overflow-visible">
                {looks.slice(0, 3).map((src, i) => (
                  <div
                    key={src}
                    className={`relative aspect-[3/4] shrink-0 snap-start overflow-hidden bg-navy-900 lg:w-auto ${
                      looks.length === 1 ? 'w-full lg:col-span-2 lg:col-start-2' : 'w-[72vw] sm:w-[38vw]'
                    }`}
                  >
                    <img
                      src={src}
                      alt={`${categoryName} for men at Prince Esquire, Nairobi, look ${i + 1}`}
                      width={675}
                      height={900}
                      fetchPriority={i === 0 ? 'high' : 'auto'}
                      decoding="async"
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <DeliveryVisitStrip />

      {/* 3 Subcategory tiles */}
      {showSubTiles ? (
        <CategorySubTiles
          children={children}
          childHref={childHref}
          crossLinkHeading={pageConfig?.crossLinkHeading}
          crossLinkTiles={pageConfig?.crossLinkTiles || []}
        />
      ) : null}

      {/* 4–7 Filter + product grid + editorial break */}
      <section id="collection" className="scroll-mt-24 py-10 md:py-14 lg:scroll-mt-32">
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

          <div className="mb-7 flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl text-white md:text-4xl">Shop {categoryName}</h2>
            <p className="shrink-0 font-sans text-sm text-navy-100">
              {productsLoading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'piece' : 'pieces'}`}
            </p>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading collection">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse bg-navy-900/70" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-7">
                {gridHead.map((product, i) => (
                    <ProductCard key={product.id} product={product} motionProps={cardMotion(i)} />
                  ))}
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
                  className="scroll-mt-28 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-7"
                >
                  {gridTail.map((product, i) => (
                    <ProductCard key={product.id} product={product} motionProps={cardMotion(i)} />
                  ))}
                </div>
              ) : null}

              {filtered.length > visibleProducts.length ? (
                <div className="mt-12 flex flex-col items-center gap-4">
                  <p className="font-sans text-sm text-navy-100">
                    Showing {visibleProducts.length} of {filtered.length}
                  </p>
                  <div className="h-0.5 w-56 bg-navy-800">
                    <div
                      className="h-full bg-gold-400"
                      style={{ width: `${(visibleProducts.length / filtered.length) * 100}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                    className="border border-gold-400 px-8 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-gold-200 transition-colors hover:bg-gold-400 hover:text-navy-950"
                  >
                    Show more
                  </button>
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

      {/* About this category + FAQ: useful to shoppers and to search engines */}
      {seoIntro ? (
        <section className="border-t border-gold-600/10 py-12 md:py-16">
          <div className="container mx-auto grid gap-10 px-5 sm:px-6 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="font-display text-3xl text-white">About {categoryName}</h2>
              <p className="mt-4 font-sans text-base font-light leading-relaxed text-navy-100">{seoIntro}</p>
            </div>
            {apiSeo?.count > 0 && faqs.length > 0 ? (
              <div>
                <h2 className="font-display text-3xl text-white">Good to know</h2>
                <div className="mt-3 divide-y divide-gold-500/15">
                  {faqs.map((faq) => (
                    <details key={faq.question} className="group py-3.5">
                      <summary className="cursor-pointer list-none font-sans text-[15px] font-medium text-white marker:hidden hover:text-gold-300">
                        {faq.question}
                      </summary>
                      <p className="mt-2 font-sans text-sm font-light leading-relaxed text-navy-100">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Buying guidance and journal links */}
      {guide.length > 0 || relatedPosts.length > 0 ? (
        <section className="border-t border-gold-600/10 py-12 md:py-16">
          <div className="container mx-auto px-5 sm:px-6">
            {guide.length > 0 ? (
              <>
                <h2 className="font-display text-3xl text-white">Buying guide</h2>
                <div className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {guide.map((item) => (
                    <div key={item.heading}>
                      <h3 className="font-sans text-[15px] font-semibold text-gold-200">{item.heading}</h3>
                      <p className="mt-2 font-sans text-sm font-light leading-relaxed text-navy-100">{item.body}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            {relatedPosts.length > 0 ? (
              <div className={guide.length > 0 ? 'mt-10 border-t border-gold-500/15 pt-8' : ''}>
                <h2 className="font-display text-2xl text-white">From the Style Journal</h2>
                <ul className="mt-4 grid gap-3 md:grid-cols-3">
                  {relatedPosts.map((post) => (
                    <li key={post.slug}>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="font-sans text-sm text-gold-300 underline decoration-gold-500/30 underline-offset-4 hover:text-gold-100"
                      >
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

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
