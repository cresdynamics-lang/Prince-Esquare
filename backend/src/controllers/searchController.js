const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');
const { searchCatalog, matchCategories } = require('../services/searchEngine');
const { canonicalShopPath, flattenTaxonomy, TAXONOMY_TREE } = require('../data/taxonomy');

const CATALOG_TTL_MS = 60 * 1000;
let catalogCache = { at: 0, promise: null };

/** Searchable catalogue + category counts, refreshed at most once a minute. */
function loadSearchCatalog() {
  if (catalogCache.promise && Date.now() - catalogCache.at < CATALOG_TTL_MS) {
    return catalogCache.promise;
  }
  const promise = (async () => {
    const result = await db.query(
      `SELECT p.id, p.name, p.slug, p.price, p.discount_price, p.thumbnail, p.description,
              p.stock_quantity, p.is_active, p.is_featured,
              c.name AS category_name, c.slug AS category_slug,
              parent.name AS parent_category_name, b.name AS brand_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN categories parent ON c.parent_id = parent.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.is_active = true
         AND p.thumbnail IS NOT NULL
         AND TRIM(p.thumbnail::text) <> ''`
    );
    const products = result.rows;
    const counts = products.reduce((acc, p) => {
      if (p.category_slug) acc[p.category_slug] = (acc[p.category_slug] || 0) + 1;
      return acc;
    }, {});
    const flat = flattenTaxonomy(TAXONOMY_TREE);
    const countFor = (slug) =>
      (counts[slug] || 0) +
      flat.filter((row) => row.parentSlug === slug).reduce((sum, row) => sum + countFor(row.slug), 0);
    const categories = flat
      .map((row) => ({
        name: row.name,
        slug: row.slug,
        href: canonicalShopPath(row.slug),
        count: countFor(row.slug),
      }))
      .filter((row) => row.count > 0);
    return { products, categories };
  })();
  catalogCache = { at: Date.now(), promise };
  promise.catch(() => {
    catalogCache = { at: 0, promise: null };
  });
  return promise;
}

const stripForList = ({ description, ...product }) => product;

function normalizeQuery(q) {
  return String(q || '').trim().slice(0, 120);
}

function searchTokens(q) {
  return normalizeQuery(q)
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

async function findInactiveMatch(q) {
  const term = normalizeQuery(q);
  if (!term) return null;
  const result = await db.query(
    `SELECT name FROM products
     WHERE is_active = false AND name ILIKE $1
     ORDER BY updated_at DESC NULLS LAST
     LIMIT 1`,
    [`%${term}%`]
  );
  return result.rows[0]?.name || null;
}

async function buildSearchResponse(q, limit = 8) {
  const query = normalizeQuery(q);
  if (!query) {
    return {
      query,
      matchType: 'none',
      products: [],
      related: [],
      categories: [],
      total: 0,
      correctedQuery: null,
      showRestockPrompt: false,
      message: null,
    };
  }

  const { products, categories } = await loadSearchCatalog();
  const hit = searchCatalog(query, products, { categories, limit });
  const shared = {
    query,
    categories: matchCategories(hit.correctedQuery || query, categories),
    total: hit.total,
    correctedQuery: hit.correctedQuery,
  };

  if (hit.matchType === 'exact') {
    return {
      ...shared,
      matchType: 'exact',
      products: hit.products.map(stripForList),
      related: [],
      showRestockPrompt: false,
      message: null,
    };
  }

  if (hit.matchType === 'related') {
    return {
      ...shared,
      matchType: 'related',
      products: [],
      related: hit.products.map(stripForList),
      showRestockPrompt: false,
      message: `No exact match for "${query}". Here are related items you might like.`,
    };
  }

  const inactiveName = await findInactiveMatch(query);
  const label = inactiveName || query;
  return {
    ...shared,
    matchType: 'none',
    products: [],
    related: [],
    showRestockPrompt: true,
    message:
      `We couldn't find "${label}" in the shop right now. ` +
      'Leave your email and we\'ll notify you when similar items arrive.',
  };
}

exports.search = async (req, res, next) => {
  try {
    const q = normalizeQuery(req.query.q || req.query.query);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 200);
    const data = await buildSearchResponse(q, limit);
    formatResponse(res, 200, true, 'Search results fetched', data);
  } catch (error) {
    next(error);
  }
};

exports.getSuggestions = async (req, res, next) => {
  try {
    const q = normalizeQuery(req.query.q);
    if (!q) {
      return formatResponse(res, 200, true, 'Search suggestions fetched', { suggestions: [] });
    }

    const catalog = await loadSearchCatalog();
    const { products } = searchCatalog(q, catalog.products, { categories: catalog.categories, limit: 6 });
    const suggestions = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      thumbnail: p.thumbnail,
      category_name: p.category_name,
      brand_name: p.brand_name,
    }));

    formatResponse(res, 200, true, 'Search suggestions fetched', { suggestions });
  } catch (error) {
    next(error);
  }
};

exports.restockAlert = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const query = normalizeQuery(req.body.query || req.body.search_query);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return formatResponse(res, 400, false, 'A valid email address is required');
    }
    if (!query) {
      return formatResponse(res, 400, false, 'Search query is required');
    }

    await db.query(
      `INSERT INTO restock_alerts (email, search_query)
       VALUES ($1, $2)
       ON CONFLICT (email, search_query) DO UPDATE SET created_at = CURRENT_TIMESTAMP`,
      [email, query]
    );

    await db.query(
      'INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT DO NOTHING',
      [email]
    );

    formatResponse(res, 201, true, 'Thanks! We\'ll email you when this item is restocked or back in stock.');
  } catch (error) {
    next(error);
  }
};
