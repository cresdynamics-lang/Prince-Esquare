const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');

const PRODUCT_FIELDS = `
  p.id, p.name, p.slug, p.price, p.discount_price, p.thumbnail,
  p.stock_quantity, p.is_active, p.is_featured,
  c.name AS category_name, b.name AS brand_name
`;

const BASE_FROM = `
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN brands b ON p.brand_id = b.id
`;

function normalizeQuery(q) {
  return String(q || '').trim().slice(0, 120);
}

function searchTokens(q) {
  return normalizeQuery(q)
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

async function fetchDirectMatches(q, limit = 8) {
  const term = normalizeQuery(q);
  if (!term) return [];

  const like = `%${term}%`;
  const prefix = `${term}%`;

  const result = await db.query(
    `SELECT ${PRODUCT_FIELDS}
     ${BASE_FROM}
     WHERE p.is_active = true
       AND (
         p.name ILIKE $1 OR p.slug ILIKE $1 OR COALESCE(p.description, '') ILIKE $1
         OR COALESCE(b.name, '') ILIKE $1 OR COALESCE(c.name, '') ILIKE $1
       )
     ORDER BY
       CASE WHEN p.name ILIKE $2 THEN 0 WHEN p.name ILIKE $1 THEN 1 ELSE 2 END,
       p.is_featured DESC NULLS LAST,
       p.name ASC
     LIMIT $3`,
    [like, prefix, limit]
  );
  return result.rows;
}

async function fetchRelatedMatches(q, excludeIds = [], limit = 6) {
  const term = normalizeQuery(q);
  if (!term) return [];

  const tokens = searchTokens(q);
  const terms = tokens.length > 0 ? tokens : [term];

  const params = [];
  const conditions = ['p.is_active = true'];

  if (excludeIds.length > 0) {
    params.push(excludeIds);
    conditions.push(`p.id <> ALL($${params.length}::uuid[])`);
  }

  const tokenClauses = terms.map((token) => {
    params.push(`%${token}%`);
    const idx = params.length;
    return `(
      p.name ILIKE $${idx} OR COALESCE(p.description, '') ILIKE $${idx}
      OR COALESCE(b.name, '') ILIKE $${idx} OR COALESCE(c.name, '') ILIKE $${idx}
    )`;
  });
  conditions.push(`(${tokenClauses.join(' OR ')})`);

  params.push(limit);
  const result = await db.query(
    `SELECT ${PRODUCT_FIELDS}
     ${BASE_FROM}
     WHERE ${conditions.join(' AND ')}
     ORDER BY p.is_featured DESC NULLS LAST, p.ratings_count DESC NULLS LAST, p.created_at DESC
     LIMIT $${params.length}`,
    params
  );

  if (result.rows.length > 0) return result.rows;

  const catParams = excludeIds.length ? [excludeIds] : [];
  catParams.push(`%${term}%`);
  const catIdx = catParams.length;
  const catExclude = excludeIds.length ? 'AND p.id <> ALL($1::uuid[])' : '';
  const catResult = await db.query(
    `SELECT ${PRODUCT_FIELDS}
     ${BASE_FROM}
     LEFT JOIN categories parent ON c.parent_id = parent.id
     WHERE p.is_active = true ${catExclude}
       AND (
         c.name ILIKE $${catIdx} OR parent.name ILIKE $${catIdx}
         OR c.slug ILIKE $${catIdx} OR parent.slug ILIKE $${catIdx}
       )
     ORDER BY p.is_featured DESC NULLS LAST, p.created_at DESC
     LIMIT $${catIdx + 1}`,
    [...catParams, limit]
  );

  return catResult.rows;
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

async function buildSearchResponse(q) {
  const query = normalizeQuery(q);
  if (!query) {
    return {
      query,
      matchType: 'none',
      products: [],
      related: [],
      showRestockPrompt: false,
      message: null,
    };
  }

  const products = await fetchDirectMatches(query);
  if (products.length > 0) {
    return {
      query,
      matchType: 'exact',
      products,
      related: [],
      showRestockPrompt: false,
      message: null,
    };
  }

  const related = await fetchRelatedMatches(query, [], 6);
  if (related.length > 0) {
    return {
      query,
      matchType: 'related',
      products: [],
      related,
      showRestockPrompt: false,
      message: `No exact match for "${query}". Here are related items you might like.`,
    };
  }

  const inactiveName = await findInactiveMatch(query);
  const label = inactiveName || query;
  return {
    query,
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
    const data = await buildSearchResponse(q);
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

    const products = await fetchDirectMatches(q, 6);
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
