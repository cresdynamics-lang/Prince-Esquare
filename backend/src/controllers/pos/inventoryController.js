// MODIFIED — POS inventory (raw SQL)
const Joi = require('joi');
const db = require('../../config/db');
const posDb = require('../../lib/posDb');
const { formatResponse } = require('../../utils/responseFormatter');
const {
  toDateStr,
  closeDayAndRollover,
} = require('../../services/dailyStockSnapshot');
const {
  transferStoreToShop,
  transferShopToStore,
  receiveAtStore,
  applyStockTake,
  applyStoreStockTake,
  STORE_TO_SHOP,
  SHOP_TO_STORE,
} = require('../../services/inventoryMovement');


const movementSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  variantId: Joi.string().uuid().optional(),
  qty: Joi.number().integer().min(1).required(),
  date: Joi.date().optional(),
  notes: Joi.string().allow('', null).optional(),
});

const parseMovementBody = (body = {}) => ({
  ...body,
  qty: parseInt(body.qty, 10),
});

exports.stockIn = async (req, res, next) => {
  try {
    const { error, value } = movementSchema.validate(parseMovementBody(req.body));
    if (error) return formatResponse(res, 400, false, error.message);

    const levels = await transferStoreToShop(value.productId, value.qty, {
      notes: value.notes || STORE_TO_SHOP,
      recordedBy: req.user?.id || null,
    });
    formatResponse(res, 201, true, 'Moved from store to shop', {
      productId: value.productId,
      shopQty: levels.shopQty,
      storeQty: levels.storeQty,
      qty: value.qty,
    });
  } catch (error) {
    if (error.statusCode) return formatResponse(res, error.statusCode, false, error.message);
    next(error);
  }
};

exports.stockOut = async (req, res, next) => {
  try {
    const { error, value } = movementSchema.validate(parseMovementBody(req.body));
    if (error) return formatResponse(res, 400, false, error.message);

    const levels = await transferShopToStore(value.productId, value.qty, {
      notes: value.notes || SHOP_TO_STORE,
      recordedBy: req.user?.id || null,
    });
    formatResponse(res, 201, true, 'Returned from shop to store', {
      productId: value.productId,
      shopQty: levels.shopQty,
      storeQty: levels.storeQty,
      qty: value.qty,
    });
  } catch (error) {
    if (error.statusCode) return formatResponse(res, error.statusCode, false, error.message);
    next(error);
  }
};

const bulkMovementSchema = Joi.object({
  productIds: Joi.array().items(Joi.string().uuid()).min(1).max(200).required(),
  qty: Joi.number().integer().min(1).default(1),
  notes: Joi.string().allow('', null).optional(),
});

exports.bulkStockIn = async (req, res, next) => {
  try {
    const { error, value } = bulkMovementSchema.validate(req.body);
    if (error) return formatResponse(res, 400, false, error.message);

    const moved = [];
    const failed = [];
    for (const productId of value.productIds) {
      try {
        const levels = await transferStoreToShop(productId, value.qty, {
          notes: value.notes || STORE_TO_SHOP,
          recordedBy: req.user?.id || null,
        });
        moved.push({ productId, shopQty: levels.shopQty, storeQty: levels.storeQty });
      } catch (e) {
        failed.push({ productId, reason: e.message || 'Transfer failed' });
      }
    }

    formatResponse(res, 200, true, `Moved ${moved.length} item(s) store → shop`, {
      moved,
      failed,
      qty: value.qty,
    });
  } catch (error) {
    if (error.statusCode) return formatResponse(res, error.statusCode, false, error.message);
    next(error);
  }
};

exports.bulkStockOut = async (req, res, next) => {
  try {
    const { error, value } = bulkMovementSchema.validate(req.body);
    if (error) return formatResponse(res, 400, false, error.message);

    const moved = [];
    const failed = [];
    for (const productId of value.productIds) {
      try {
        const levels = await transferShopToStore(productId, value.qty, {
          notes: value.notes || SHOP_TO_STORE,
          recordedBy: req.user?.id || null,
        });
        moved.push({ productId, shopQty: levels.shopQty, storeQty: levels.storeQty });
      } catch (e) {
        failed.push({ productId, reason: e.message || 'Return failed' });
      }
    }

    formatResponse(res, 200, true, `Returned ${moved.length} item(s) shop → store`, {
      moved,
      failed,
      qty: value.qty,
    });
  } catch (error) {
    if (error.statusCode) return formatResponse(res, error.statusCode, false, error.message);
    next(error);
  }
};

exports.receiveAtStore = async (req, res, next) => {
  try {
    const { error, value } = movementSchema.validate(parseMovementBody(req.body));
    if (error) return formatResponse(res, 400, false, error.message);

    const result = await receiveAtStore(value.productId, value.qty, {
      notes: value.notes || 'Received at store',
      recordedBy: req.user?.id || null,
    });
    formatResponse(res, 201, true, 'Store stock received', result);
  } catch (error) {
    if (error.statusCode) return formatResponse(res, error.statusCode, false, error.message);
    next(error);
  }
};

exports.closeDay = async (req, res, next) => {
  try {
    const date = req.body?.date ? new Date(req.body.date) : new Date();
    const result = await closeDayAndRollover(date, req.user?.id || null);
    formatResponse(res, 200, true, 'Day closed — tomorrow opening stock set from today closing', result);
  } catch (error) {
    next(error);
  }
};

exports.dailySheet = async (req, res, next) => {
  try {
    const { ensureDayRollover } = require('../../services/stockDayScheduler');
    try {
      await ensureDayRollover();
    } catch (rolloverErr) {
      console.error('Daily sheet rollover warning:', rolloverErr.message);
    }

    const date = req.query.date ? new Date(`${req.query.date}T12:00:00`) : new Date();
    const dateStr = toDateStr(date);
    const snapshots = await posDb.getDailySheet(dateStr);

    // Targets follow live inventory — always in sync with actual shop/store counts
    const data = snapshots.map((row) => ({
      ...row,
      target_qty: row.closing_qty,
      target_store_qty: row.store_qty ?? 0,
      shop_tally_match: true,
      store_tally_match: true,
      tally_match: true,
    }));

    formatResponse(res, 200, true, 'Daily sheet fetched', data);
  } catch (error) {
    next(error);
  }
};

exports.movements = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 30);
    const skip = (page - 1) * limit;
    let to = req.query.to ? new Date(req.query.to) : null;
    if (to) { to.setHours(23, 59, 59, 999); }

    const movements = await posDb.getMovements({
      productId: req.query.productId,
      type: req.query.type,
      from: req.query.from,
      to: to?.toISOString(),
      limit,
      skip,
    });

    formatResponse(res, 200, true, 'Movements fetched', {
      movements,
      pagination: { page, limit },
    });
  } catch (error) {
    next(error);
  }
};

exports.stockLevels = async (req, res, next) => {
  try {
    const category = req.query.category || null;
    const data = await posDb.getStockLevels({ category });
    formatResponse(res, 200, true, 'Stock levels fetched', data);
  } catch (error) {
    next(error);
  }
};

exports.categoryPieces = async (req, res, next) => {
  try {
    const category = req.query.category;
    if (!category) {
      return formatResponse(res, 400, false, 'category is required');
    }
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    const availableOnly = req.query.availableOnly === '1' || req.query.availableOnly === 'true';
    const location = req.query.location || 'all';
    const data = await posDb.getCategoryPieces({ category, limit, offset, availableOnly, location });
    formatResponse(res, 200, true, 'Category pieces fetched', data);
  } catch (error) {
    next(error);
  }
};

exports.categorySummary = async (req, res, next) => {
  try {
    const rows = await posDb.getCategorySummary();
    const data = rows.map((row) => ({
      ...row,
      target_qty: row.shop_qty,
      target_store_qty: row.store_qty,
      shop_tally_match: true,
      store_tally_match: true,
      tally_match: true,
    }));
    formatResponse(res, 200, true, 'Category summary fetched', data);
  } catch (error) {
    next(error);
  }
};

exports.syncAlignment = async (req, res, next) => {
  try {
    const { syncInventoryAlignment } = require('../../services/inventoryWarehouseSync');
    const result = await syncInventoryAlignment();
    formatResponse(res, 200, true, 'Inventory aligned — website products linked and stock synced', result);
  } catch (error) {
    next(error);
  }
};

exports.ensureWebsiteLinks = async (req, res, next) => {
  try {
    const { ensureAllEcommerceProductsInPos } = require('../../services/inventoryChannel');
    const result = await ensureAllEcommerceProductsInPos();
    formatResponse(res, 200, true, 'Website products linked to inventory', result);
  } catch (error) {
    next(error);
  }
};

exports.stockTake = async (req, res, next) => {
  try {
    const schema = Joi.array().items(
      Joi.object({
        productId: Joi.string().uuid().required(),
        physicalQty: Joi.number().integer().min(0).required(),
      })
    );
    const { error, value } = schema.validate(req.body);
    if (error) return formatResponse(res, 400, false, error.message);

    const adjustments = [];

    for (const row of value) {
      const result = await applyStockTake(row.productId, row.physicalQty, {
        recordedBy: req.user?.id || null,
      });
      if (result.variance !== 0) {
        adjustments.push({ productId: row.productId, variance: result.variance });
      }
    }

    formatResponse(res, 200, true, 'Stock take saved', { adjustments });
  } catch (error) {
    next(error);
  }
};

exports.storeStockTake = async (req, res, next) => {
  try {
    const schema = Joi.array().items(
      Joi.object({
        productId: Joi.string().uuid().required(),
        physicalQty: Joi.number().integer().min(0).required(),
      })
    );
    const { error, value } = schema.validate(req.body);
    if (error) return formatResponse(res, 400, false, error.message);

    const adjustments = [];
    for (const row of value) {
      const result = await applyStoreStockTake(row.productId, row.physicalQty, {
        recordedBy: req.user?.id || null,
      });
      if (result.variance !== 0) {
        adjustments.push({ productId: row.productId, variance: result.variance });
      }
    }

    formatResponse(res, 200, true, 'Store stock take saved', { adjustments });
  } catch (error) {
    next(error);
  }
};

exports.exportStockTake = async (req, res, next) => {
  try {
    const { exportStockTakeBuffer } = require('../../services/stockTakeExcel');
    const locParam = req.query.location;
    const location =
      locParam === 'store' ? 'store' : locParam === 'shop' ? 'shop' : 'both';
    const category = req.query.category || null;
    const buffer = await exportStockTakeBuffer({ category, location });
    const label = location === 'both' ? 'all' : location === 'store' ? 'warehouse' : 'shop';
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Stock-${label}-${new Date().toISOString().slice(0, 10)}.xlsx"`
    );
    res.send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
};

exports.importStockTake = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      return formatResponse(res, 400, false, 'No Excel file uploaded');
    }
    const {
      parseStockTakeBuffer,
      importStockTakeRows,
      importCombinedStockTakeRows,
    } = require('../../services/stockTakeExcel');
    const parsed = await parseStockTakeBuffer(req.file.buffer);
    const forceLocation = req.body.location;
    const useCombined =
      parsed.combined ||
      forceLocation === 'both' ||
      (!forceLocation && parsed.rows[0]?.combined);
    const result = useCombined
      ? await importCombinedStockTakeRows(parsed.rows, {
          recordedBy: req.user?.id || null,
        })
      : await importStockTakeRows(parsed.rows, {
          location: forceLocation === 'store' ? 'store' : 'shop',
          recordedBy: req.user?.id || null,
        });
    const label = useCombined ? 'Shop & warehouse' : forceLocation === 'store' ? 'Warehouse' : 'Shop';
    formatResponse(
      res,
      200,
      true,
      `${label} stock updated — ${result.adjusted} adjusted, ${result.skipped.length} skipped`,
      result
    );
  } catch (error) {
    formatResponse(res, 400, false, error.message || 'Stock take import failed');
  }
};

exports.exportMasterStock = async (req, res, next) => {
  try {
    const { exportMasterStockBuffer } = require('../../services/masterStockExcel');
    const category = req.query.category || null;
    const date = req.query.date ? new Date(`${req.query.date}T12:00:00`) : new Date();
    const buffer = await exportMasterStockBuffer({ category, date });
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Stock-${new Date().toISOString().slice(0, 10)}.xlsx"`
    );
    res.send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
};

exports.importMasterStock = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      return formatResponse(res, 400, false, 'No Excel file uploaded');
    }
    const { parseMasterStockBuffer, importMasterStockRows } = require('../../services/masterStockExcel');
    const rows = await parseMasterStockBuffer(req.file.buffer);
    const date = req.body.date ? new Date(`${req.body.date}T12:00:00`) : new Date();
    const result = await importMasterStockRows(rows, {
      date,
      recordedBy: req.user?.id || null,
    });
    formatResponse(
      res,
      200,
      true,
      `Stock sheet applied — ${result.adjusted} adjusted, ${result.skipped.length} skipped`,
      result
    );
  } catch (error) {
    formatResponse(res, 400, false, error.message || 'Stock sheet import failed');
  }
};

exports.importExcel = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      return formatResponse(res, 400, false, 'No Excel file uploaded');
    }
    const { parseExcelBuffer } = require('../../utils/stockExcelParser');
    const { format: detectedFormat, rows } = await parseExcelBuffer(req.file.buffer);
    const date = req.body.date ? new Date(`${req.body.date}T12:00:00`) : new Date();

    if (detectedFormat === 'catalog' || req.body.mode === 'catalog') {
      const { importCatalogRows } = require('../../services/productCatalogImport');
      const result = await importCatalogRows(rows, {
        date,
        performedBy: req.user?.id || null,
      });
      return formatResponse(
        res,
        200,
        true,
        `Product catalog imported — ${result.created} new, ${result.updated} updated`,
        result
      );
    }

    const { importStockRows } = require('../../services/stockExcelImport');
    const mode = ['full', 'opening', 'opening_reset'].includes(req.body.mode)
      ? req.body.mode
      : 'full';
    const result = await importStockRows(rows, {
      date,
      mode,
      performedBy: req.user?.id || null,
      recordMovements: req.body.recordMovements === 'true',
    });
    const msg =
      mode === 'opening'
        ? 'Opening stock updated from Excel'
        : mode === 'opening_reset'
          ? 'Opening stock set — today sales/in/out reset'
          : 'Stock Excel imported';
    formatResponse(res, 200, true, msg, result);
  } catch (error) {
    formatResponse(res, 400, false, error.message || 'Import failed');
  }
};

const variantSchema = Joi.object({
  id: Joi.string().uuid().optional().allow(null),
  color: Joi.string().allow('', null).optional(),
  size: Joi.string().required(),
  stock: Joi.number().integer().min(0).default(0),
  price_override: Joi.number().min(0).optional(),
  image_url: Joi.string().allow('', null).optional(),
  sku: Joi.string().allow('', null).optional(),
});

const colorGroupSchema = Joi.object({
  color: Joi.string().allow('', null).optional(),
  image_url: Joi.string().allow('', null).optional(),
  sizes: Joi.array().items(Joi.object({
    id: Joi.string().uuid().optional().allow(null),
    size: Joi.string().required(),
    stock: Joi.number().integer().min(0).default(0),
    price_override: Joi.number().min(0).optional(),
    sku: Joi.string().allow('', null).optional(),
  })).default([]),
});

const productDetailsSchema = Joi.object({
  name: Joi.string().min(2).max(500).optional(),
  sku: Joi.string().min(2).max(120).optional(),
  category: Joi.string().max(120).optional(),
  shop_price: Joi.number().min(0).optional(),
  category_id: Joi.string().uuid().optional().allow(null),
  brand_id: Joi.string().uuid().optional().allow(null),
  description: Joi.string().allow('', null).optional(),
  price: Joi.number().min(0).optional(),
  discount_price: Joi.number().min(0).optional().allow(null),
  thumbnail: Joi.string().allow('', null).optional(),
  images: Joi.array().items(Joi.alternatives().try(Joi.string(), Joi.object())).optional(),
  variants: Joi.array().items(variantSchema).optional(),
  color_groups: Joi.array().items(colorGroupSchema).optional(),
});

exports.createInventoryItem = async (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().min(2).max(500).required(),
      sku: Joi.string().min(2).max(120).required(),
      category: Joi.string().max(120).default('General'),
      shop_price: Joi.number().min(0).required(),
      opening_qty: Joi.number().integer().min(0).default(0),
      store_qty: Joi.number().integer().min(0).default(0),
      website_sku: Joi.string().optional().allow(null, ''),
      category_id: Joi.string().uuid().optional().allow(null),
      brand_id: Joi.string().uuid().optional().allow(null),
      description: Joi.string().allow('', null).optional(),
      price: Joi.number().min(0).optional(),
      discount_price: Joi.number().min(0).optional().allow(null),
      thumbnail: Joi.string().allow('', null).optional(),
      images: Joi.array().items(Joi.alternatives().try(Joi.string(), Joi.object())).optional(),
      variants: Joi.array().items(variantSchema).optional(),
      color_groups: Joi.array().items(colorGroupSchema).optional(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) return formatResponse(res, 400, false, error.message);

    const { importCatalogRows } = require('../../services/productCatalogImport');
    const result = await importCatalogRows(
      [
        {
          name: value.name,
          sku: value.sku.trim().toUpperCase(),
          category: value.category,
          shopPrice: value.shop_price,
          openingQty: value.opening_qty,
          storeQty: value.store_qty,
          websiteSku: value.website_sku || '',
        },
      ],
      { performedBy: req.user?.id || null }
    );

    const row = result.products[0];
    if (row?.productId) {
      const { saveInventoryProductDetail } = require('../../services/inventoryProductDetail');
      await saveInventoryProductDetail(row.productId, {
        name: value.name,
        sku: value.sku,
        category: value.category,
        shop_price: value.shop_price,
        category_id: value.category_id,
        brand_id: value.brand_id,
        description: value.description,
        price: value.price ?? value.shop_price,
        discount_price: value.discount_price,
        thumbnail: value.thumbnail,
        images: value.images,
        variants: value.variants,
        color_groups: value.color_groups,
      });
    }

    formatResponse(res, 201, true, row?.created ? 'Inventory item created' : 'Inventory item updated', {
      ...result,
      productId: row?.productId,
    });
  } catch (error) {
    if (error.code === '23505') {
      return formatResponse(res, 409, false, 'SKU already exists in inventory');
    }
    next(error);
  }
};

exports.getProductDetail = async (req, res, next) => {
  try {
    const { getInventoryProductDetail } = require('../../services/inventoryProductDetail');
    const detail = await getInventoryProductDetail(req.params.id);
    formatResponse(res, 200, true, 'Product detail fetched', detail);
  } catch (error) {
    if (error.statusCode) return formatResponse(res, error.statusCode, false, error.message);
    next(error);
  }
};

exports.saveProductDetail = async (req, res, next) => {
  try {
    const { error, value } = productDetailsSchema.validate(req.body);
    if (error) return formatResponse(res, 400, false, error.message);
    const { saveInventoryProductDetail } = require('../../services/inventoryProductDetail');
    const detail = await saveInventoryProductDetail(req.params.id, value);
    formatResponse(res, 200, true, 'Product details saved', detail);
  } catch (error) {
    if (error.statusCode) return formatResponse(res, error.statusCode, false, error.message);
    next(error);
  }
};

exports.syncFromWebsite = async (req, res, next) => {
  try {
    const { syncFromLiveWebsite } = require('../../services/inventoryProductDetail');
    const detail = await syncFromLiveWebsite(req.params.id);
    formatResponse(res, 200, true, 'Synced from live website listing', detail);
  } catch (error) {
    if (error.statusCode) return formatResponse(res, error.statusCode, false, error.message);
    next(error);
  }
};

exports.exportStockSheet = async (req, res, next) => {
  try {
    const ExcelJS = require('exceljs');
    const date = req.query.date ? new Date(`${req.query.date}T12:00:00`) : new Date();
    const dateStr = toDateStr(date);

    let rows = await posDb.getDailySheet(dateStr);
    if (!rows.length) {
      const products = await posDb.getStockLevels();
      rows = products.map((p) => ({
        product: { name: p.name },
        opening_qty: p.currentQty,
        sales_qty: 0,
        stock_out_qty: 0,
        stock_in_qty: 0,
        closing_qty: p.currentQty,
      }));
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    ws.addRow(['Item', 'Opening Stock', 'sales', 'Stock Out', 'Stock In', 'Closing Stock']);
    for (const r of rows) {
      ws.addRow([
        r.product.name,
        r.opening_qty,
        r.sales_qty,
        r.stock_out_qty || null,
        r.stock_in_qty || null,
        r.closing_qty,
      ]);
    }
    ws.columns.forEach((col) => {
      col.width = 16;
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="Stock.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

exports.downloadTemplate = async (req, res, next) => {
  try {
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');

    if (req.query.type === 'master') {
      const { MASTER_HEADERS } = require('../../services/masterStockExcel');
      ws.name = 'Stock';
      ws.addRow(MASTER_HEADERS);
      ws.addRow([
        '(auto)',
        'SKU-EXAMPLE',
        'Example Product',
        'Shirts',
        'Yes',
        2500,
        4500,
        5,
        1,
        0,
        2,
        6,
        10,
      ]);
      ws.getCell('L2').value = { formula: 'H2+K2-J2-I2' };
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename="Stock-Template.xlsx"');
      ws.columns.forEach((col) => { col.width = 16; });
      await wb.xlsx.write(res);
      return res.end();
    }

    if (req.query.type === 'stock-take') {
      const isSingle = req.query.location === 'shop' || req.query.location === 'store';
      if (!isSingle) {
        ws.addRow([
          'Inventory ID',
          'SKU',
          'Product Name',
          'Category',
          'On Website',
          'Cost Price',
          'Retail Price',
          'Shop System Qty',
          'Shop Physical Count',
          'Shop Variance',
          'Store System Qty',
          'Store Physical Count',
          'Store Variance',
        ]);
        ws.addRow([
          '(auto)',
          'SKU-EXAMPLE',
          'Example Product',
          'Shirts',
          'Yes',
          2500,
          4500,
          5,
          5,
          0,
          12,
          12,
          0,
        ]);
        ws.getCell('J2').value = { formula: 'I2-H2' };
        ws.getCell('M2').value = { formula: 'L2-K2' };
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="Stock-Template.xlsx"'
        );
      } else {
        const location = req.query.location === 'store' ? 'Warehouse' : 'Shop';
        ws.addRow([
          'Inventory ID',
          'SKU',
          'Product Name',
          'Category',
          'On Website',
          'Cost Price',
          'Retail Price',
          'System Qty',
          'Physical Count',
          'Variance',
          'Cost Value',
          'Retail Value',
          'Profit',
        ]);
        ws.addRow([
          '(auto)',
          'SKU-EXAMPLE',
          'Example Product',
          'Shirts',
          'Yes',
          2500,
          4500,
          10,
          10,
          0,
          25000,
          45000,
          20000,
        ]);
        ws.getCell('J2').value = { formula: 'I2-H2' };
        ws.getCell('K2').value = { formula: 'F2*I2' };
        ws.getCell('L2').value = { formula: 'G2*I2' };
        res.getCell('M2').value = { formula: 'L2-K2' };
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="Stock-Take-${location}-Template.xlsx"`
        );
      }
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      ws.columns.forEach((col) => { col.width = 16; });
      await wb.xlsx.write(res);
      return res.end();
    }

    if (req.query.type === 'catalog') {
      ws.addRow(['SKU', 'Product Name', 'Category', 'Shop Price', 'Opening Qty', 'Store Qty', 'Website SKU']);
      ws.addRow(['CLARKS-OXFORD-41', 'Clarks Black Oxford Size 41', 'Formal shoes', 12500, 6, 24, 'CLARKS-BLACK-CAP-TOE-OXFORD']);
      ws.addRow(['POLO-NAVY-M', 'Navy Polo Shirt Medium', 'Polos', 4500, 12, '']);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename="Product-Catalog-Template.xlsx"');
      ws.columns.forEach((col) => { col.width = 18; });
      await wb.xlsx.write(res);
      return res.end();
    }

    if (req.query.type === 'variants') {
      ws.addRow([
        'Variant ID',
        'Product Name',
        'Website SKU',
        'Category',
        'Stock Category',
        'Color',
        'Size',
        'Shop Qty (physical)',
        'Warehouse Qty',
        'Web Stock',
        'Status',
        'Suggested Action',
      ]);
      ws.addRow([
        '',
        'Clarks Black Leather Cap-Toe Oxford Shoes',
        'CLARKS-BLACK-CAP-TOE-OXFORD',
        'Office Shoes',
        'Office Shoes',
        'Black',
        '40',
        7,
        2,
        7,
        'In stock',
        'OK',
      ]);
      ws.addRow([
        '',
        'Clarks Black Leather Cap-Toe Oxford Shoes',
        'CLARKS-BLACK-CAP-TOE-OXFORD',
        'Office Shoes',
        'Office Shoes',
        'Black',
        '41',
        16,
        3,
        16,
        'In stock',
        'OK',
      ]);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename="Variant-Stock-Template.xlsx"');
      ws.columns.forEach((col) => { col.width = 18; });
      await wb.xlsx.write(res);
      return res.end();
    }

    ws.addRow(['Item', 'Opening Stock', 'sales', 'Stock Out', 'Stock In', 'Closing Stock']);
    ws.addRow(['Shirts', 600, 0, null, null, 600]);
    ws.addRow(['Khakis', 540, 0, null, null, 540]);
    ws.addRow(['Polos', 45, 0, null, null, 45]);
    ws.columns.forEach((col) => {
      col.width = 16;
    });
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="Stock-Template.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

exports.updateThreshold = async (req, res, next) => {
  try {
    const { threshold } = req.body;
    const r = await db.query(
      `UPDATE pos_products SET low_stock_threshold = $1 WHERE id = $2 RETURNING *`,
      [parseInt(threshold, 10), req.params.id]
    );
    if (!r.rows.length) return formatResponse(res, 404, false, 'Product not found');
    formatResponse(res, 200, true, 'Threshold updated', r.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.publishToWebsite = async (req, res, next) => {
  try {
    const schema = productDetailsSchema.keys({
      price: Joi.number().positive().optional(),
      stock_quantity: Joi.number().integer().min(0).optional(),
      is_active: Joi.boolean().optional(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) return formatResponse(res, 400, false, error.message);

    const { publishInventoryProduct } = require('../../services/inventoryProductDetail');
    const result = await publishInventoryProduct(req.params.id, value);
    formatResponse(
      res,
      200,
      true,
      result.created ? 'Product published to website' : 'Website listing updated',
      result
    );
  } catch (error) {
    if (error.statusCode) return formatResponse(res, error.statusCode, false, error.message);
    next(error);
  }
};

exports.seedDemo = async (req, res, next) => {
  try {
    const { runSeedCatalog } = require('../../services/inventoryCatalogSeed');
    const { syncInventoryAlignment } = require('../../services/inventoryWarehouseSync');
    const result = await runSeedCatalog();
    const alignment = await syncInventoryAlignment();
    formatResponse(res, 200, true, 'Inventory catalog built from stock sheet (shop + warehouse, not published to website)', {
      ...result,
      alignment,
    });
  } catch (error) {
    next(error);
  }
};

exports.unpublishFromWebsite = async (req, res, next) => {
  try {
    const { unpublishFromWebsite } = require('../../services/inventoryChannel');
    const result = await unpublishFromWebsite(req.params.id);
    if (!result.unpublished) {
      return formatResponse(res, 400, false, 'Item is not linked to the website');
    }
    formatResponse(res, 200, true, 'Product removed from website (inventory unchanged)', result);
  } catch (error) {
    next(error);
  }
};

exports.exportVariantStock = async (req, res, next) => {
  try {
    const { exportVariantStockWorkbook } = require('../../services/variantStockReport');
    const category = (req.query.category || '').trim();
    const { wb } = await exportVariantStockWorkbook({ category });
    const suffix = category ? `-${category.replace(/\s+/g, '-')}` : '';
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Variant-Stock${suffix}.xlsx"`
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

exports.importVariantStock = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      return formatResponse(res, 400, false, 'No Excel file uploaded');
    }
    const { parseVariantImportBuffer, importVariantStockRows } = require('../../services/variantStockReport');
    const rows = await parseVariantImportBuffer(req.file.buffer);
    const result = await importVariantStockRows(rows, { performedBy: req.user?.id || null });
    const msg = `Variant stock updated — ${result.updated} variant(s) on ${result.productsUpdated} product(s)`;
    formatResponse(res, 200, true, msg, result);
  } catch (error) {
    formatResponse(res, 400, false, error.message || 'Variant import failed');
  }
};

exports.exportProductCatalog = async (req, res, next) => {
  try {
    const { exportInventoryCatalogWorkbook } = require('../../services/inventoryCatalogExport');
    const category = (req.query.category || '').trim();
    const { wb, stats } = await exportInventoryCatalogWorkbook({ category });
    const suffix = category ? `-${category.replace(/\s+/g, '-')}` : '';
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Product-Catalog${suffix}.xlsx"`
    );
    res.setHeader('X-Catalog-Rows', String(stats.inventoryRows));
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

exports.variantStockSummary = async (req, res, next) => {
  try {
    const { buildReport } = require('../../services/variantStockReport');
    const category = (req.query.category || '').trim();
    const report = await buildReport({ category });
    formatResponse(res, 200, true, 'Variant stock summary', report);
  } catch (error) {
    next(error);
  }
};
