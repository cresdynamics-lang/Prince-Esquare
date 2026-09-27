const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');
const { recordSiteEvent } = require('../utils/siteAnalytics');
const { recordProductEvent } = require('../utils/productAnalytics');

const SITE_URL = 'https://prince-esquire.co.ke';

const TIME_WINDOWS = [
  { key: 'live', label: 'Live right now', interval: '5 minutes' },
  { key: '30m', label: 'Last 30 minutes', interval: '30 minutes' },
  { key: '3h', label: 'Last 3 hours', interval: '3 hours' },
  { key: '6h', label: 'Last 6 hours', interval: '6 hours' },
  { key: '12h', label: 'Last 12 hours', interval: '12 hours' },
  { key: '24h', label: 'Last 24 hours (1 day)', interval: '24 hours' },
  { key: '2d', label: 'Last 2 days', interval: '2 days' },
];

const emptyWindows = () =>
  TIME_WINDOWS.map((w) => ({
    key: w.key,
    label: w.label,
    visitors: 0,
    pageViews: 0,
    productViews: 0,
    cartAdds: 0,
    whatsappClicks: 0,
    events: 0,
  }));

const PRODUCT_SELECT = `
  SELECT p.id, p.name, p.slug, p.price, p.thumbnail, p.stock_quantity, p.is_featured, p.is_active, p.is_on_sale,
         b.name AS brand_name, c.name AS category_name, c.slug AS category_slug,
         p_cat.name AS parent_category_name
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN categories p_cat ON c.parent_id = p_cat.id
  LEFT JOIN brands b ON p.brand_id = b.id
`;

function mapSaleProduct(p) {
  return {
    ...p,
    storefrontUrl: `${SITE_URL}/sale`,
    productUrl: `${SITE_URL}/product/${p.slug}`,
    visibleOnSale: Boolean(p.is_on_sale),
  };
}

exports.trackEvent = async (req, res, next) => {
  try {
    const { session_id, event_type, path, product_id, product_slug, product_name, product_price } = req.body;

    if (!session_id || !event_type) {
      return formatResponse(res, 400, false, 'session_id and event_type are required');
    }

    const allowed = ['page_view', 'product_click', 'product_add_cart', 'whatsapp_order_click'];
    if (!allowed.includes(event_type)) {
      return formatResponse(res, 400, false, 'Invalid event_type');
    }

    await recordSiteEvent({
      sessionId: String(session_id).slice(0, 64),
      eventType: event_type,
      path: path ? String(path).slice(0, 512) : null,
      productId: product_id || null,
      productSlug: product_slug || null,
      productName: product_name || null,
      productPrice: product_price != null ? product_price : null,
    });

    if (event_type === 'product_click' && product_id) {
      recordProductEvent(product_id, 'view');
    }
    if (event_type === 'product_add_cart' && product_id) {
      recordProductEvent(product_id, 'cart_add');
    }
    if (event_type === 'whatsapp_order_click' && product_id) {
      recordProductEvent(product_id, 'cart_add');
    }

    formatResponse(res, 200, true, 'Tracked');
  } catch (error) {
    next(error);
  }
};

async function windowStats(interval) {
  const result = await db.query(
    `SELECT
        COUNT(DISTINCT session_id)::int AS visitors,
        COUNT(*) FILTER (WHERE event_type = 'page_view')::int AS page_views,
        COUNT(*) FILTER (WHERE event_type = 'product_click')::int AS product_views,
        COUNT(*) FILTER (WHERE event_type = 'product_add_cart')::int AS cart_adds,
        COUNT(*) FILTER (WHERE event_type = 'whatsapp_order_click')::int AS whatsapp_clicks,
        COUNT(*)::int AS events
     FROM site_visitor_events
     WHERE created_at >= NOW() - INTERVAL '${interval}'`
  );
  return result.rows[0] || {};
}

exports.getLiveVisitors = async (req, res, next) => {
  try {
    const requested = String(req.query.window || '24h');
    const selectedWindow = TIME_WINDOWS.find((w) => w.key === requested) || TIME_WINDOWS.find((w) => w.key === '24h');
    const detailInterval = selectedWindow.interval;

    const windowRows = await Promise.all(
      TIME_WINDOWS.map(async (w) => {
        const row = await windowStats(w.interval);
        return {
          key: w.key,
          label: w.label,
          visitors: row.visitors || 0,
          pageViews: row.page_views || 0,
          productViews: row.product_views || 0,
          cartAdds: row.cart_adds || 0,
          whatsappClicks: row.whatsapp_clicks || 0,
          events: row.events || 0,
        };
      })
    );

    const [sessions, recentEvents, pages, clickedProducts, cartProducts, whatsappProducts, hourly] = await Promise.all([
      db.query(
        `SELECT session_id,
                MIN(created_at) AS first_seen,
                MAX(created_at) AS last_seen,
                COUNT(*)::int AS event_count,
                COUNT(*) FILTER (WHERE event_type = 'page_view')::int AS page_views,
                COUNT(*) FILTER (WHERE event_type = 'product_click')::int AS product_clicks,
                COUNT(*) FILTER (WHERE event_type = 'product_add_cart')::int AS cart_adds,
                COUNT(*) FILTER (WHERE event_type = 'whatsapp_order_click')::int AS whatsapp_clicks,
                ARRAY_AGG(DISTINCT path) FILTER (WHERE path IS NOT NULL) AS paths
         FROM site_visitor_events
         WHERE created_at >= NOW() - INTERVAL '${detailInterval}'
         GROUP BY session_id
         ORDER BY last_seen DESC
         LIMIT 80`
      ),
      db.query(
        `SELECT e.id, e.session_id, e.event_type, e.path, e.product_slug, e.product_name, e.product_price, e.created_at
         FROM site_visitor_events e
         WHERE e.created_at >= NOW() - INTERVAL '${detailInterval}'
         ORDER BY e.created_at DESC
         LIMIT 120`
      ),
      db.query(
        `SELECT path, COUNT(*)::int AS views
         FROM site_visitor_events
         WHERE event_type = 'page_view'
           AND created_at >= NOW() - INTERVAL '${detailInterval}'
           AND path IS NOT NULL
         GROUP BY path
         ORDER BY views DESC
         LIMIT 30`
      ),
      db.query(
        `SELECT product_slug, product_name, product_price,
                COUNT(*)::int AS clicks
         FROM site_visitor_events
         WHERE event_type = 'product_click'
           AND product_slug IS NOT NULL
           AND created_at >= NOW() - INTERVAL '${detailInterval}'
         GROUP BY product_slug, product_name, product_price
         ORDER BY clicks DESC
         LIMIT 40`
      ),
      db.query(
        `SELECT product_slug, product_name, product_price,
                COUNT(*)::int AS cart_adds
         FROM site_visitor_events
         WHERE event_type = 'product_add_cart'
           AND product_slug IS NOT NULL
           AND created_at >= NOW() - INTERVAL '${detailInterval}'
         GROUP BY product_slug, product_name, product_price
         ORDER BY cart_adds DESC
         LIMIT 40`
      ),
      db.query(
        `SELECT product_slug, product_name, product_price,
                COUNT(*)::int AS whatsapp_clicks
         FROM site_visitor_events
         WHERE event_type = 'whatsapp_order_click'
           AND product_slug IS NOT NULL
           AND created_at >= NOW() - INTERVAL '${detailInterval}'
         GROUP BY product_slug, product_name, product_price
         ORDER BY whatsapp_clicks DESC
         LIMIT 40`
      ),
      db.query(
        `SELECT DATE_TRUNC('hour', created_at) AS hour,
                COUNT(DISTINCT session_id)::int AS visitors,
                COUNT(*)::int AS events
         FROM site_visitor_events
         WHERE created_at >= NOW() - INTERVAL '2 days'
         GROUP BY hour
         ORDER BY hour ASC`
      ),
    ]);

    const liveNow = windowRows.find((w) => w.key === 'live') || { visitors: 0 };
    const selected = windowRows.find((w) => w.key === selectedWindow.key) || windowRows[0];

    formatResponse(res, 200, true, 'Live visitors', {
      liveCount: liveNow.visitors || 0,
      selectedWindow: selectedWindow.key,
      selectedLabel: selectedWindow.label,
      windows: windowRows,
      summary: {
        visitors: selected.visitors || 0,
        pageViews: selected.pageViews || 0,
        productViews: selected.productViews || 0,
        cartAdds: selected.cartAdds || 0,
        whatsappClicks: selected.whatsappClicks || 0,
        uniqueProductsClicked: clickedProducts.rows.length,
        uniqueProductsCarted: cartProducts.rows.length,
        uniqueProductsWhatsApp: whatsappProducts.rows.length,
        uniquePages: pages.rows.length,
      },
      sessions: sessions.rows.map((s) => ({
        ...s,
        paths: s.paths || [],
      })),
      recentEvents: recentEvents.rows,
      pagesViewed: pages.rows,
      productsClicked: clickedProducts.rows.map((p) => ({
        ...p,
        productUrl: `${SITE_URL}/product/${p.product_slug}`,
      })),
      productsAddedToCart: cartProducts.rows.map((p) => ({
        ...p,
        productUrl: `${SITE_URL}/product/${p.product_slug}`,
      })),
      productsWhatsApp: whatsappProducts.rows.map((p) => ({
        ...p,
        productUrl: `${SITE_URL}/product/${p.product_slug}`,
      })),
      topPages: pages.rows,
      topProducts: clickedProducts.rows.map((p) => ({
        ...p,
        clicks: p.clicks,
        cart_adds: 0,
        productUrl: `${SITE_URL}/product/${p.product_slug}`,
      })),
      hourlyTraffic: hourly.rows,
    });
  } catch (error) {
    if (error.code === '42P01') {
      return formatResponse(res, 200, true, 'Live visitors', {
        liveCount: 0,
        selectedWindow: '24h',
        selectedLabel: 'Last 24 hours (1 day)',
        windows: emptyWindows(),
        summary: {
          visitors: 0,
          pageViews: 0,
          productViews: 0,
          cartAdds: 0,
          whatsappClicks: 0,
          uniqueProductsClicked: 0,
          uniqueProductsCarted: 0,
          uniqueProductsWhatsApp: 0,
          uniquePages: 0,
        },
        sessions: [],
        recentEvents: [],
        pagesViewed: [],
        productsClicked: [],
        productsAddedToCart: [],
        productsWhatsApp: [],
        topPages: [],
        topProducts: [],
        hourlyTraffic: [],
        migrationRequired: true,
      });
    }
    next(error);
  }
};

exports.getSaleCatalogAdmin = async (_req, res, next) => {
  try {
    const result = await db.query(
      `${PRODUCT_SELECT}
       WHERE p.is_on_sale = true
       ORDER BY p.is_featured DESC, p.name ASC`
    );

    const products = result.rows.map(mapSaleProduct);

    formatResponse(res, 200, true, 'Sale catalog products', {
      count: products.length,
      salePageUrl: `${SITE_URL}/sale`,
      metaFeedUrl: `${SITE_URL}/feeds/meta-sale-catalog.csv`,
      products,
    });
  } catch (error) {
    next(error);
  }
};

exports.getSaleCatalogPicker = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const tab = String(req.query.tab || 'all'); // all | on_sale | not_on_sale
    const params = [];
    const where = ['p.is_active = true'];

    if (tab === 'on_sale') where.push('p.is_on_sale = true');
    if (tab === 'not_on_sale') where.push('p.is_on_sale = false');

    if (q) {
      params.push(`%${q}%`);
      where.push(`(p.name ILIKE $${params.length} OR p.slug ILIKE $${params.length} OR c.name ILIKE $${params.length} OR b.name ILIKE $${params.length})`);
    }

    const result = await db.query(
      `${PRODUCT_SELECT}
       WHERE ${where.join(' AND ')}
       ORDER BY p.is_on_sale DESC, p.name ASC
       LIMIT 300`,
      params
    );

    const onSale = await db.query(`SELECT COUNT(*)::int AS count FROM products WHERE is_on_sale = true`);
    const available = await db.query(`SELECT COUNT(*)::int AS count FROM products WHERE is_active = true AND is_on_sale = false`);

    formatResponse(res, 200, true, 'Sale catalog picker', {
      onSaleCount: onSale.rows[0]?.count || 0,
      availableCount: available.rows[0]?.count || 0,
      products: result.rows.map(mapSaleProduct),
    });
  } catch (error) {
    next(error);
  }
};

exports.setSaleCatalogProducts = async (req, res, next) => {
  try {
    const { product_ids: productIds, is_on_sale: isOnSale } = req.body || {};

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return formatResponse(res, 400, false, 'product_ids array is required');
    }
    if (typeof isOnSale !== 'boolean') {
      return formatResponse(res, 400, false, 'is_on_sale boolean is required');
    }

    const uniqueIds = [...new Set(productIds.map(String))];
    const result = await db.query(
      `UPDATE products
       SET is_on_sale = $1, updated_at = NOW()
       WHERE id = ANY($2::uuid[])
       RETURNING id, name, slug, is_on_sale`,
      [isOnSale, uniqueIds]
    );

    formatResponse(res, 200, true, isOnSale ? 'Products added to sale' : 'Products removed from sale', {
      updated: result.rows.length,
      products: result.rows,
    });
  } catch (error) {
    next(error);
  }
};
