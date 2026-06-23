const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');
const { applyProductImageOptimization, optimizeCloudinaryUrl } = require('../utils/cloudinaryImage');

const toImage = (row) => row?.thumbnail || row?.image_url || row?.image || null;

/** Carousel picks — full-product shots that read clearly at hero size (not tight close-ups). */
const HERO_CATEGORY_PRODUCT_SLUGS = {
  'belts-ties': 'black-brown-reversible-dress-belt-09a9e37b',
  'track-suits': 'blue-white-nike-tracksuit-set-f54cbfb3',
};

const fetchHeroProductRow = async (slug) => {
  const r = await db.query(
    `SELECT p.name, p.slug, p.thumbnail, p.description, p.price,
            c.slug AS category_slug, c.name AS category_name,
            parent.slug AS parent_category_slug, parent.name AS parent_category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN categories parent ON c.parent_id = parent.id
     WHERE p.is_active = true AND p.thumbnail IS NOT NULL AND p.slug = $1
     LIMIT 1`,
    [slug]
  );
  return r.rows[0] || null;
};

const categoryKey = (row) => row.parent_category_slug || row.category_slug;

const HERO_COPY = {
  shirts: 'Presidential shirts cut for clean collars, confident structure, and a polished finish that reads well in boardrooms and formal settings.',
  suits: 'Tailored two-piece and three-piece suits selected for weddings, boardrooms, and evening occasions where sharp presentation matters.',
  shoes: 'Polished loafers and formal shoes with refined leather, balanced shape, and the kind of finish that lifts the full outfit.',
  linen: 'Breathable linen sets and trousers built for warm-weather dressing with ease, texture, and a clean silhouette.',
  'track-suits': 'Relaxed tracksuits in elevated fabrics for off-duty hours, travel days, and polished casual dressing.',
  'polo-t-shirts': 'Signature polos with a neat shape and premium hand-feel for smart weekends, lunches, and everyday wear.',
  belts: 'Refined leather belts chosen to finish the outfit with quiet structure and a clean, polished line.',
};

const buildHeroSlidesFromBanners = (rows) =>
  rows.map((b) => ({
    image: optimizeCloudinaryUrl(b.image, { width: 1600, height: 900, crop: 'fill' }),
    subtitle: b.subtitle || 'Prince Esquire',
    title: b.title,
    desc: b.subtitle || '',
    cta: 'Shop Now',
    link: b.link || '/products',
  }));

const HERO_PRODUCT_SELECT = `
  SELECT DISTINCT ON (COALESCE(parent.id, c.id))
         p.name, p.slug, p.thumbnail, p.description, p.price,
         c.slug AS category_slug, c.name AS category_name,
         parent.slug AS parent_category_slug, parent.name AS parent_category_name
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN categories parent ON c.parent_id = parent.id
  WHERE p.is_active = true
    AND p.thumbnail IS NOT NULL
`;

const mapHeroProductSlide = (p) => {
  const optimized = applyProductImageOptimization({ ...p });
  const img = toImage(optimized);
  const category = p.parent_category_slug || p.category_slug || 'products';
  const subtitle = p.parent_category_name || p.category_name || 'Collection';
  const desc = HERO_COPY[category] ||
    (p.description || `KSh ${parseFloat(p.price || 0).toLocaleString()}`)
      .split('\n')[0]
      .slice(0, 160);
  const useFitCrop = category === 'belts-ties' || category === 'track-suits';

  return {
    image: optimizeCloudinaryUrl(img, {
      width: 1600,
      height: 900,
      crop: useFitCrop ? 'fit' : 'fill',
    }),
    subtitle,
    title: p.name,
    desc,
    cta: 'View Product',
    link: `/product/${p.slug}`,
    fallbackLink: `/products?category=${category}`,
    productSlug: p.slug,
  };
};

const DEDICATED_CATEGORY_ROUTES = {
  'polo-t-shirts': '/polo-t-shirts',
  shoes: '/shoes',
  shirts: '/shirts',
  suits: '/suits',
  trousers: '/trousers',
  linen: '/linen',
};

/** Subcategories hidden from homepage product rows, tiles, and hero carousel. */
const HOMEPAGE_HIDDEN_CATEGORY_SLUGS = new Set(['casual', 'caps-hats']);

/** Homepage category rows shown first (replaces hidden categories in prominence). */
const HOMEPAGE_PRIORITY_CATEGORY_SLUGS = ['knitted-polos'];

const categoryViewAllPath = (row) => {
  const parentSlug = row.parent_slug;
  const slug = row.slug;
  const name = row.name;

  if (parentSlug && DEDICATED_CATEGORY_ROUTES[parentSlug]) {
    const base = DEDICATED_CATEGORY_ROUTES[parentSlug];
    return slug !== parentSlug ? `${base}?sub=${encodeURIComponent(name)}` : base;
  }
  if (DEDICATED_CATEGORY_ROUTES[slug]) return DEDICATED_CATEGORY_ROUTES[slug];
  if (parentSlug) return `/products?category=${parentSlug}&sub=${encodeURIComponent(name)}`;
  return `/products?category=${slug}`;
};

const buildCategoryProductRows = async () => {
  const result = await db.query(
    `SELECT
       p.id, p.slug, p.name, p.price, p.thumbnail, p.stock_quantity, p.is_featured,
       b.name AS brand_name,
       c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
       parent.name AS parent_category_name, parent.slug AS parent_category_slug
     FROM products p
     JOIN categories c ON p.category_id = c.id
     LEFT JOIN categories parent ON c.parent_id = parent.id
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE p.is_active = true
       AND p.thumbnail IS NOT NULL
       AND COALESCE(p.stock_quantity, 0) > 0
     ORDER BY c.name ASC, p.is_featured DESC, p.created_at DESC`
  );

  const groups = new Map();

  for (const row of result.rows) {
    if (HOMEPAGE_HIDDEN_CATEGORY_SLUGS.has(row.category_slug)) continue;

    const key = row.category_slug;
    if (!groups.has(key)) {
      groups.set(key, {
        title: row.category_name,
        slug: row.category_slug,
        parent_slug: row.parent_category_slug || null,
        parent_name: row.parent_category_name || null,
        name: row.category_name,
        products: [],
      });
    }
    const group = groups.get(key);
    if (group.products.length < 6) {
      const thumb = row.thumbnail;
      group.products.push({
        id: row.id,
        slug: row.slug,
        name: row.name,
        price: row.price,
        brand_name: row.brand_name,
        category_name: row.category_name,
        category_slug: row.category_slug,
        parent_category_name: row.parent_category_name,
        parent_category_slug: row.parent_category_slug,
        image_url: thumb ? optimizeCloudinaryUrl(thumb, { width: 400 }) : thumb,
      });
    }
  }

  return [...groups.values()]
    .filter((group) => group.products.length > 0)
    .sort((a, b) => {
      const aPri = HOMEPAGE_PRIORITY_CATEGORY_SLUGS.indexOf(a.slug);
      const bPri = HOMEPAGE_PRIORITY_CATEGORY_SLUGS.indexOf(b.slug);
      if (aPri !== -1 || bPri !== -1) {
        if (aPri === -1) return 1;
        if (bPri === -1) return -1;
        return aPri - bPri;
      }
      const aFeatured = a.products.some((p) => p.is_featured);
      const bFeatured = b.products.some((p) => p.is_featured);
      if (aFeatured !== bFeatured) return bFeatured ? 1 : -1;
      return a.title.localeCompare(b.title);
    })
    .slice(0, 14)
    .map((group) => ({
      title: group.parent_name ? group.title : group.title,
      slug: group.slug,
      parentSlug: group.parent_slug,
      path: categoryViewAllPath(group),
      products: group.products,
    }));
};

const applyHeroCategoryOverrides = async (rows, slides) => {
  const nextRows = [...rows];
  const nextSlides = [...slides];

  for (const [catSlug, productSlug] of Object.entries(HERO_CATEGORY_PRODUCT_SLUGS)) {
    const override = await fetchHeroProductRow(productSlug);
    if (!override) continue;

    const idx = nextRows.findIndex((row) => categoryKey(row) === catSlug);
    const slide = mapHeroProductSlide(override);
    if (idx >= 0) {
      nextRows[idx] = override;
      nextSlides[idx] = slide;
    } else {
      nextRows.push(override);
      nextSlides.push(slide);
    }
  }

  return { rows: nextRows, slides: nextSlides };
};

const buildHeroSlidesFromProducts = async () => {
  let result = await db.query(
    `${HERO_PRODUCT_SELECT}
       AND p.is_featured = true
     ORDER BY COALESCE(parent.id, c.id), p.created_at DESC
     LIMIT 6`
  );

  if (result.rows.length < 3) {
    result = await db.query(
      `${HERO_PRODUCT_SELECT}
       ORDER BY COALESCE(parent.id, c.id), p.is_featured DESC, p.created_at DESC
       LIMIT 6`
    );
  }

  const slides = result.rows
    .filter((p) => !HOMEPAGE_HIDDEN_CATEGORY_SLUGS.has(p.category_slug))
    .map(mapHeroProductSlide);
  const { slides: merged } = await applyHeroCategoryOverrides(result.rows, slides);
  return merged;
};

const buildCategoryTiles = async () => {
  const result = await db.query(
    `SELECT c.id, c.name, c.slug,
            p_cat.slug AS parent_slug,
            (
              SELECT p.thumbnail
              FROM products p
              WHERE p.is_active = true
                AND p.thumbnail IS NOT NULL
                AND (p.category_id = c.id OR p.category_id IN (
                  SELECT id FROM categories WHERE parent_id = c.id
                ))
              ORDER BY p.is_featured DESC, p.created_at DESC
              LIMIT 1
            ) AS image
     FROM categories c
     LEFT JOIN categories p_cat ON c.parent_id = p_cat.id
     ORDER BY c.is_featured DESC NULLS LAST, c.name ASC
     LIMIT 8`
  );

  const tiles = result.rows
    .filter((c) => c.image && !HOMEPAGE_HIDDEN_CATEGORY_SLUGS.has(c.slug))
    .sort((a, b) => {
      const aPri = HOMEPAGE_PRIORITY_CATEGORY_SLUGS.indexOf(a.slug);
      const bPri = HOMEPAGE_PRIORITY_CATEGORY_SLUGS.indexOf(b.slug);
      if (aPri !== -1 || bPri !== -1) {
        if (aPri === -1) return 1;
        if (bPri === -1) return -1;
        return aPri - bPri;
      }
      return a.name.localeCompare(b.name);
    })
    .map((c, index) => ({
      title: c.name,
      subtitle: 'Shop Collection',
      image: c.image,
      category: c.parent_slug || c.slug,
      slug: c.slug,
      path: c.parent_slug ? `/${c.parent_slug}` : `/products?category=${c.slug}`,
      span: index === 0 ? 'md:col-span-1 md:row-span-2' : index === 3 ? 'md:col-span-2 md:row-span-1' : 'md:col-span-1 md:row-span-1',
    }));

  for (const tile of tiles) {
    const preferredSlug = HERO_CATEGORY_PRODUCT_SLUGS[tile.slug] || HERO_CATEGORY_PRODUCT_SLUGS[tile.category];
    if (!preferredSlug) continue;
    const row = await fetchHeroProductRow(preferredSlug);
    if (row?.thumbnail) {
      tile.image = optimizeCloudinaryUrl(row.thumbnail, { width: 800, height: 600, crop: 'fill' });
    }
  }

  return tiles.map(({ slug, ...tile }) => tile);
};

exports.getActiveBanners = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM banners WHERE is_active = true ORDER BY position, created_at DESC');
    formatResponse(res, 200, true, 'Active banners fetched', result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getHomepageData = async (req, res, next) => {
  try {
    const [banners, categories, newArrivals, bestSellers, heroSlides, categoryTiles, categoryRows] = await Promise.all([
      db.query('SELECT * FROM banners WHERE is_active = true ORDER BY position, created_at DESC'),
      db.query('SELECT * FROM categories WHERE is_featured = true ORDER BY name LIMIT 6'),
      db.query('SELECT p.*, c.name AS category_name, c.slug AS category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = true ORDER BY p.created_at DESC LIMIT 8'),
      db.query('SELECT p.*, c.name AS category_name, c.slug AS category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = true ORDER BY p.ratings_count DESC NULLS LAST LIMIT 8'),
      (async () => {
        const bannerR = await db.query('SELECT * FROM banners WHERE is_active = true ORDER BY position, created_at DESC');
        if (bannerR.rows.length) return buildHeroSlidesFromBanners(bannerR.rows);
        return buildHeroSlidesFromProducts();
      })(),
      buildCategoryTiles(),
      buildCategoryProductRows(),
    ]);

    const mapProduct = (p) => applyProductImageOptimization({
      ...p,
      image_url: toImage(p),
    });

    formatResponse(res, 200, true, 'Homepage data fetched', {
      banners: banners.rows,
      heroSlides,
      categoryTiles,
      featuredCategories: categories.rows,
      newArrivals: newArrivals.rows.map(mapProduct),
      bestSellers: bestSellers.rows.map(mapProduct),
      categoryRows,
    });
  } catch (error) {
    next(error);
  }
};

exports.adminGetBanners = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM banners ORDER BY created_at DESC');
    formatResponse(res, 200, true, 'All banners fetched', result.rows);
  } catch (error) {
    next(error);
  }
};

exports.createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, image, link, position, is_active } = req.body;
    const result = await db.query(
      'INSERT INTO banners (title, subtitle, image, link, position, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, subtitle, image, link, position, is_active]
    );
    formatResponse(res, 201, true, 'Banner created', result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, subtitle, image, link, position, is_active } = req.body;
    const result = await db.query(
      'UPDATE banners SET title = $1, subtitle = $2, image = $3, link = $4, position = $5, is_active = $6 WHERE id = $7 RETURNING *',
      [title, subtitle, image, link, position, is_active, id]
    );
    formatResponse(res, 200, true, 'Banner updated', result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM banners WHERE id = $1', [id]);
    formatResponse(res, 200, true, 'Banner deleted');
  } catch (error) {
    next(error);
  }
};
