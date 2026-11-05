const { formatResponse } = require('../utils/responseFormatter');
const { analyzeProductImage, FRIENDLY_RETRY } = require('../services/groqProductVision');
const db = require('../config/db');
const { polishProductName, distinctProductName } = require('../utils/productNaming');

/**
 * POST /api/admin/products/ai-describe
 * multipart field: image (required)
 * optional body: category_name, brand_name
 */
exports.describeFromImage = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      return formatResponse(res, 400, false, 'Please choose a product photo first, then try again.');
    }

    const result = await analyzeProductImage({
      mimeType: req.file.mimetype,
      buffer: req.file.buffer,
      hints: {
        categoryName: req.body?.category_name || req.body?.categoryName || '',
        brandName: req.body?.brand_name || req.body?.brandName || '',
      },
    });

    if (result?.name) {
      const existing = await db
        .query('SELECT name FROM products WHERE is_active = true')
        .then((r) => r.rows.map((row) => row.name))
        .catch(() => []);
      result.name = distinctProductName(polishProductName(result.name), existing);
    }

    return formatResponse(res, 200, true, 'AI product copy generated', result);
  } catch (error) {
    // Always soft failure so admin UI never shows raw gateway/API noise
    const message = FRIENDLY_RETRY;
    console.warn('[ai-describe]', error.message || error);
    return formatResponse(res, 503, false, message);
  }
};
