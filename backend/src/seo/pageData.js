/**
 * Database reads for server-rendered pages and the sitemap.
 * Category stats are cached briefly because every page render and the nav use them.
 */

const db = require('../config/db');
const { LEGACY_SLUG_ALIASES } = require('../data/taxonomy');

const STATS_TTL_MS = 5 * 60 * 1000;
let statsCache = { at: 0, promise: null };

const HAS_IMAGE_SQL = `p.thumbnail IS NOT NULL
  AND TRIM(p.thumbnail::text) <> ''
  AND LOWER(TRIM(p.thumbnail::text)) NOT IN ('null', 'undefined', '{}', '[]')`;

const PRODUCT_COLUMNS = `p.id, p.name, p.slug, p.price, p.discount_price, p.thumbnail, p.images, p.description,
  p.focus_description, p.sku, p.stock_quantity, p.updated_at, p.ratings_avg, p.ratings_count,
  b.name AS brand_name, c.name AS category_name, c.slug AS category_slug,
  p_cat.name AS parent_category_name, p_cat.slug AS parent_category_slug`;

const PRODUCT_JOINS = `FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN categories p_cat ON c.parent_id = p_cat.id
  LEFT JOIN brands b ON p.brand_id = b.id`;

function loadCategoryStats() {
  if (statsCache.promise && Date.now() - statsCache.at < STATS_TTL_MS) return statsCache.promise;

  const promise = (async () => {
    const [categories, products] = await Promise.all([
      db.query('SELECT id, slug, name, parent_id FROM categories'),
      db.query(
        `SELECT p.category_id, p.cross_tags, COALESCE(p.discount_price, p.price) AS price
         FROM products p WHERE p.is_active = true AND ${HAS_IMAGE_SQL}`
      ),
    ]);
    return { categories: categories.rows, products: products.rows };
  })();

  statsCache = { at: Date.now(), promise };
  promise.catch(() => {
    statsCache = { at: 0, promise: null };
  });
  return promise;
}

/** Same matching rule as GET /api/products?taxonomy=: home category tree + cross tags. */
function statsForSlug(stats, rawSlug) {
  const slug = LEGACY_SLUG_ALIASES[rawSlug] || rawSlug;
  const root = stats.categories.find((c) => c.slug === slug);
  const ids = new Set();
  if (root) {
    const queue = [root.id];
    while (queue.length) {
      const id = queue.shift();
      ids.add(id);
      stats.categories.filter((c) => c.parent_id === id).forEach((c) => queue.push(c.id));
    }
  }
  const prices = stats.products
    .filter((p) => ids.has(p.category_id) || (Array.isArray(p.cross_tags) && p.cross_tags.includes(slug)))
    .map((p) => Number(p.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  return {
    count: prices.length,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
  };
}

async function fetchProduct(slug) {
  const result = await db.query(
    `SELECT ${PRODUCT_COLUMNS} ${PRODUCT_JOINS}
     WHERE p.slug = $1 AND p.is_active = true AND ${HAS_IMAGE_SQL} LIMIT 1`,
    [slug]
  );
  const product = result.rows[0];
  if (!product) return null;
  const variants = await db
    .query('SELECT size, color, stock_quantity FROM product_variants WHERE product_id = $1', [product.id])
    .catch(() => ({ rows: [] }));
  return { ...product, variants: variants.rows };
}

async function fetchProductsForCategory(rawSlug, limit = 120) {
  const slug = LEGACY_SLUG_ALIASES[rawSlug] || rawSlug;
  const result = await db.query(
    `WITH RECURSIVE tree AS (
       SELECT id FROM categories WHERE slug = $1::text
       UNION ALL
       SELECT c.id FROM categories c JOIN tree t ON c.parent_id = t.id
     )
     SELECT ${PRODUCT_COLUMNS} ${PRODUCT_JOINS}
     WHERE p.is_active = true AND ${HAS_IMAGE_SQL}
       AND (p.category_id IN (SELECT id FROM tree) OR $1::text = ANY(COALESCE(p.cross_tags, '{}')))
     ORDER BY p.is_featured DESC NULLS LAST, p.created_at DESC
     LIMIT $2`,
    [slug, limit]
  );
  return result.rows;
}

async function fetchRecentProducts(limit = 48) {
  const result = await db.query(
    `SELECT ${PRODUCT_COLUMNS} ${PRODUCT_JOINS}
     WHERE p.is_active = true AND ${HAS_IMAGE_SQL}
     ORDER BY p.created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function fetchFeaturedProducts(limit = 24) {
  const result = await db.query(
    `SELECT ${PRODUCT_COLUMNS} ${PRODUCT_JOINS}
     WHERE p.is_active = true AND ${HAS_IMAGE_SQL}
     ORDER BY p.is_featured DESC NULLS LAST, p.created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function fetchSaleProducts(limit = 80) {
  const result = await db.query(
    `SELECT ${PRODUCT_COLUMNS} ${PRODUCT_JOINS}
     WHERE p.is_active = true AND p.is_on_sale = true AND ${HAS_IMAGE_SQL}
     ORDER BY p.is_featured DESC NULLS LAST, p.name ASC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function fetchAllProducts() {
  const result = await db.query(
    `SELECT ${PRODUCT_COLUMNS} ${PRODUCT_JOINS}
     WHERE p.is_active = true AND ${HAS_IMAGE_SQL}
     ORDER BY p.is_featured DESC NULLS LAST, p.created_at DESC LIMIT 500`
  );
  return result.rows;
}

async function fetchBlogPost(slug) {
  const result = await db.query(
    `SELECT title, slug, excerpt, content, featured_image_url, published_date, updated_at, meta_title, meta_description
     FROM blog_posts WHERE slug = $1 AND is_published = true LIMIT 1`,
    [slug]
  );
  return result.rows[0] || null;
}

async function fetchBlogList() {
  const result = await db
    .query(
      `SELECT title, slug, excerpt, featured_image_url, COALESCE(updated_at, published_date) AS updated_at
       FROM blog_posts WHERE is_published = true
       ORDER BY COALESCE(published_date, updated_at) DESC`
    )
    .catch(() => ({ rows: [] }));
  return result.rows;
}

/** Journal posts about a category, for its page. Refreshed with the category stats. */
let postsCache = { at: 0, rows: [] };
async function relatedPosts(slug, keywords = [], limit = 3) {
  if (!keywords.length) return [];
  if (Date.now() - postsCache.at > STATS_TTL_MS) {
    postsCache = { at: Date.now(), rows: await fetchBlogList() };
  }
  const score = (post) => {
    const title = String(post.title || '').toLowerCase();
    return keywords.reduce((sum, word, i) => sum + (title.includes(word) ? keywords.length - i : 0), 0);
  };
  return postsCache.rows
    .map((post) => ({ post, points: score(post) }))
    .filter((row) => row.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, limit)
    .map(({ post }) => ({ title: post.title, slug: post.slug }));
}

module.exports = {
  relatedPosts,
  loadCategoryStats,
  statsForSlug,
  fetchProduct,
  fetchProductsForCategory,
  fetchRecentProducts,
  fetchFeaturedProducts,
  fetchSaleProducts,
  fetchAllProducts,
  fetchBlogPost,
  fetchBlogList,
};
