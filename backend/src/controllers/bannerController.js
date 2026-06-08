const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');
const { applyProductImageOptimization } = require('../utils/cloudinaryImage');

const toImage = (row) => row?.thumbnail || row?.image_url || row?.image || null;

const buildHeroSlidesFromBanners = (rows) =>
  rows.map((b) => ({
    image: b.image,
    subtitle: b.subtitle || 'Prince Esquire',
    title: b.title,
    desc: b.subtitle || '',
    cta: 'Shop Now',
    link: b.link || '/products',
  }));

const buildHeroSlidesFromProducts = async () => {
  let result = await db.query(
    `SELECT p.name, p.slug, p.thumbnail, p.description, p.price,
            c.slug AS category_slug, c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.is_active = true AND p.is_featured = true AND p.thumbnail IS NOT NULL
     ORDER BY p.created_at DESC
     LIMIT 6`
  );

  if (!result.rows.length) {
    result = await db.query(
      `SELECT p.name, p.slug, p.thumbnail, p.description, p.price,
              c.slug AS category_slug, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = true AND p.thumbnail IS NOT NULL
       ORDER BY p.created_at DESC
       LIMIT 6`
    );
  }

  return result.rows.map((p) => {
    const optimized = applyProductImageOptimization({ ...p });
    const img = toImage(optimized);
    const category = p.category_slug || 'products';
    return {
      image: img,
      subtitle: p.category_name || 'Collection',
      title: p.name,
      desc: (p.description || `KSh ${parseFloat(p.price || 0).toLocaleString()}`).slice(0, 140),
      cta: 'View Product',
      link: `/product/${p.slug}`,
      fallbackLink: `/products?category=${category}`,
    };
  });
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

  return result.rows
    .filter((c) => c.image)
    .map((c, index) => ({
      title: c.name,
      subtitle: 'Shop Collection',
      image: c.image,
      category: c.parent_slug || c.slug,
      path: c.parent_slug ? `/${c.parent_slug}` : `/products?category=${c.slug}`,
      span: index === 0 ? 'md:col-span-1 md:row-span-2' : index === 3 ? 'md:col-span-2 md:row-span-1' : 'md:col-span-1 md:row-span-1',
    }));
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
    const [banners, categories, newArrivals, bestSellers, heroSlides, categoryTiles] = await Promise.all([
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
