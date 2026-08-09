const { buildSaleFeed, buildFullFeed } = require('../feeds/metaCatalogFeed');

async function sendFeed(res, builder, delimiter, contentType, filename) {
  const { count, body } = await builder(delimiter);
  // Short cache so Meta scheduled fetches pick up availability/inventory quickly.
  res.set('Cache-Control', 'public, max-age=60, must-revalidate');
  res.set('X-Product-Count', String(count));
  res.set('Content-Disposition', `inline; filename="${filename}"`);
  res.type(contentType).send(`${body}\n`);
}

exports.metaSaleCatalogDat = async (req, res, next) => {
  try {
    await sendFeed(res, buildSaleFeed, '\t', 'text/tab-separated-values; charset=utf-8', 'meta-sale-catalog.tsv');
  } catch (error) {
    next(error);
  }
};

exports.metaSaleCatalogTsv = exports.metaSaleCatalogDat;

exports.metaSaleCatalogCsv = async (req, res, next) => {
  try {
    await sendFeed(res, buildSaleFeed, ',', 'text/csv; charset=utf-8', 'meta-sale-catalog.csv');
  } catch (error) {
    next(error);
  }
};

exports.metaFullCatalogDat = async (req, res, next) => {
  try {
    await sendFeed(res, buildFullFeed, '\t', 'text/tab-separated-values; charset=utf-8', 'meta-catalog.tsv');
  } catch (error) {
    next(error);
  }
};

exports.metaFullCatalogCsv = async (req, res, next) => {
  try {
    await sendFeed(res, buildFullFeed, ',', 'text/csv; charset=utf-8', 'meta-catalog.csv');
  } catch (error) {
    next(error);
  }
};

/** Meta fetches /api/feeds/ by mistake — serve full in-stock CSV unless JSON explicitly requested. */
exports.metaFeedRoot = async (req, res, next) => {
  const wantsJson =
    req.query.format === 'json' ||
    (req.accepts('json') && !req.accepts(['text/csv', 'text/plain', 'text/tab-separated-values']));

  if (!wantsJson) {
    return exports.metaFullCatalogCsv(req, res, next);
  }

  return exports.metaFeedInfo(req, res);
};

exports.metaFeedInfo = async (_req, res) => {
  res.json({
    success: true,
    message: 'Meta catalog feed URLs for Commerce Manager',
    feeds: {
      saleCsv: 'https://prince-esquire.co.ke/feeds/meta-sale-catalog.csv',
      saleTsv: 'https://prince-esquire.co.ke/feeds/meta-sale-catalog.tsv',
      saleDat: 'https://prince-esquire.co.ke/feeds/meta-sale-catalog.dat',
      fullCsv: 'https://prince-esquire.co.ke/feeds/meta-catalog.csv',
      fullTsv: 'https://prince-esquire.co.ke/feeds/meta-catalog.tsv',
      fullDat: 'https://prince-esquire.co.ke/feeds/meta-catalog.dat',
    },
    metaCommerceManager: {
      recommendedUrl: 'https://prince-esquire.co.ke/feeds/meta-catalog.csv',
      format: 'CSV',
      note: 'Use the FULL catalog feed so every live product stays in stock in Meta. Sale feed is optional.',
    },
    notes: [
      'In Meta Commerce Manager choose Scheduled feed → CSV.',
      'Full feed: every active product with availability=in stock and quantity_to_sell_on_facebook=999.',
      'Sale feed: only is_on_sale products (same availability/inventory rules).',
      'Required columns: id, title, description, availability, condition, price, link, image_link, brand.',
    ],
  });
};
