/**
 * Export live inventory + website catalogue to Excel (real data, not templates).
 */
const db = require('../config/db');
const ExcelJS = require('exceljs');
const { parsePieceMeta } = require('./variantStockReport');

const parseJson = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const pieceLocation = (shopQty, storeQty, isWarehouse) => {
  if (isWarehouse) return storeQty > 0 ? 'Warehouse' : 'Out';
  if (shopQty > 0 && storeQty > 0) return 'Shop + Warehouse';
  if (shopQty > 0) return 'Shop floor';
  if (storeQty > 0) return 'Warehouse only';
  return 'Out';
};

const fetchInventoryPieces = async (category = '') => {
  const params = [];
  let where = `WHERE pp.sku LIKE 'PE-CAT-%'`;
  if (category) {
    params.push(category);
    where += ` AND pp.category = $${params.length}`;
  }

  const r = await db.query(
    `SELECT pp.id,
            pp.sku,
            pp.name,
            pp.category,
            pp.shop_price,
            pp.website_details,
            COALESCE(sl.current_qty, 0)::int AS shop_qty,
            COALESCE(st.current_qty, 0)::int AS store_qty,
            ec.sku AS website_sku,
            ec.id IS NOT NULL AND ec.is_active = true AS on_website,
            ec.name AS website_name
     FROM pos_products pp
     LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
     LEFT JOIN pos_store_stock_levels st ON st.product_id = pp.id
     LEFT JOIN products ec ON ec.id = pp.ecommerce_product_id
     ${where}
     ORDER BY pp.category ASC, pp.sku ASC`,
    params
  );

  return r.rows.map((row) => {
    const meta = parsePieceMeta(row);
    const draft = parseJson(row.website_details);
    const isWarehouse = meta.isWarehouse;
    const shopQty = isWarehouse ? 0 : row.shop_qty;
    const storeQty = isWarehouse ? row.store_qty : row.store_qty;
    return {
      sku: row.sku,
      name: row.name,
      category: row.category,
      color: meta.color,
      size: meta.size,
      shopPrice: parseFloat(row.shop_price) || 0,
      shopQty,
      storeQty: isWarehouse ? row.store_qty : row.store_qty,
      websiteSku: row.website_sku || '',
      onWebsite: row.on_website ? 'Yes' : 'No',
      location: pieceLocation(shopQty, storeQty, isWarehouse),
      description: draft.description || '',
      isWarehouse,
    };
  });
};

const fetchWebsiteCatalogRows = async (category = '') => {
  const params = [];
  let where = `WHERE p.is_active = true`;
  if (category) {
    params.push(category);
    where += ` AND (c.name = $${params.length} OR pp.category = $${params.length})`;
  }

  const r = await db.query(
    `SELECT p.id,
            p.name,
            p.sku AS website_sku,
            p.description,
            p.price,
            p.stock_quantity AS product_stock,
            c.name AS category_name,
            b.name AS brand_name,
            pp.sku AS pos_sku,
            pp.category AS stock_category,
            pp.shop_price,
            v.id AS variant_id,
            v.color,
            v.size,
            v.stock_quantity AS variant_stock
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     LEFT JOIN pos_products pp ON pp.id = p.pos_stock_product_id
     LEFT JOIN product_variants v ON v.product_id = p.id
     ${where}
     ORDER BY p.name ASC, v.color NULLS LAST, v.size NULLS LAST`,
    params
  );

  return r.rows.map((row) => ({
    productName: row.name,
    websiteSku: row.website_sku || '',
    category: row.category_name || row.stock_category || '',
    brand: row.brand_name || '',
    color: row.color || '',
    size: row.size || (row.variant_id ? '' : 'Standard'),
    webStock: row.variant_id != null ? (row.variant_stock ?? 0) : (row.product_stock ?? 0),
    listPrice: parseFloat(row.price) || 0,
    posSku: row.pos_sku || '',
    shopPrice: row.shop_price != null ? parseFloat(row.shop_price) : '',
    description: (row.description || '').slice(0, 500),
    variantId: row.variant_id || '',
  }));
};

const fetchCategorySummary = async () => {
  const r = await db.query(`
    SELECT p.category AS name,
           COUNT(*) FILTER (WHERE p.sku NOT LIKE '%-W-%')::int AS shop_pieces,
           COUNT(*) FILTER (WHERE p.sku LIKE '%-W-%')::int AS warehouse_pieces,
           COALESCE(SUM(CASE WHEN p.sku NOT LIKE '%-W-%' THEN COALESCE(s.current_qty, 0) ELSE 0 END), 0)::int AS shop_qty,
           COALESCE(SUM(CASE WHEN p.sku LIKE '%-W-%' THEN COALESCE(st.current_qty, 0) ELSE 0 END), 0)::int AS warehouse_qty,
           COUNT(*) FILTER (WHERE ec.id IS NOT NULL AND ec.is_active = true)::int AS published_pieces
    FROM pos_products p
    LEFT JOIN pos_stock_levels s ON s.product_id = p.id
    LEFT JOIN pos_store_stock_levels st ON st.product_id = p.id
    LEFT JOIN products ec ON ec.id = p.ecommerce_product_id
    WHERE p.sku LIKE 'PE-CAT-%'
    GROUP BY p.category
    ORDER BY p.category ASC
  `);
  return r.rows;
};

const styleHeaderRow = (row) => {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
};

const exportInventoryCatalogWorkbook = async ({ category = '' } = {}) => {
  const [pieces, websiteRows, categories] = await Promise.all([
    fetchInventoryPieces(category),
    fetchWebsiteCatalogRows(category),
    category ? Promise.resolve([]) : fetchCategorySummary(),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Prince Esquare';
  wb.created = new Date();

  const wsInv = wb.addWorksheet('Inventory Catalog');
  const invHeaders = [
    'SKU',
    'Product Name',
    'Category',
    'Shop Price',
    'Opening Qty',
    'Store Qty',
    'Website SKU',
    'Color',
    'Size',
    'Location',
    'On Website',
    'Description',
  ];
  wsInv.addRow(invHeaders);
  styleHeaderRow(wsInv.getRow(1));

  for (const p of pieces) {
    wsInv.addRow([
      p.sku,
      p.name,
      p.category,
      p.shopPrice,
      p.shopQty,
      p.storeQty,
      p.websiteSku,
      p.color,
      p.size,
      p.location,
      p.onWebsite,
      p.description,
    ]);
  }
  wsInv.columns = [
    { width: 22 }, { width: 36 }, { width: 16 }, { width: 10 }, { width: 12 },
    { width: 10 }, { width: 28 }, { width: 14 }, { width: 8 }, { width: 14 },
    { width: 12 }, { width: 40 },
  ];
  wsInv.views = [{ state: 'frozen', ySplit: 1 }];

  const wsWeb = wb.addWorksheet('Website Catalogue');
  const webHeaders = [
    'Variant ID',
    'Product Name',
    'Website SKU',
    'Category',
    'Brand',
    'Color',
    'Size',
    'Web Stock',
    'List Price (KES)',
    'POS SKU',
    'Shop Price (KES)',
    'Description',
  ];
  wsWeb.addRow(webHeaders);
  styleHeaderRow(wsWeb.getRow(1));
  for (const w of websiteRows) {
    wsWeb.addRow([
      w.variantId,
      w.productName,
      w.websiteSku,
      w.category,
      w.brand,
      w.color,
      w.size,
      w.webStock,
      w.listPrice,
      w.posSku,
      w.shopPrice,
      w.description,
    ]);
  }
  wsWeb.columns = [
    { width: 38 }, { width: 34 }, { width: 24 }, { width: 16 }, { width: 14 },
    { width: 14 }, { width: 10 }, { width: 10 }, { width: 14 }, { width: 18 },
    { width: 14 }, { width: 36 },
  ];
  wsWeb.views = [{ state: 'frozen', ySplit: 1 }];

  if (categories.length) {
    const wsCat = wb.addWorksheet('Category Summary');
    wsCat.addRow(['Category', 'Shop Pieces', 'Warehouse Pieces', 'Shop Qty', 'Warehouse Qty', 'Published to Web']);
    styleHeaderRow(wsCat.getRow(1));
    for (const c of categories) {
      wsCat.addRow([
        c.name,
        c.shop_pieces,
        c.warehouse_pieces,
        c.shop_qty,
        c.warehouse_qty,
        c.published_pieces,
      ]);
    }
    wsCat.columns = [{ width: 18 }, { width: 14 }, { width: 18 }, { width: 10 }, { width: 14 }, { width: 16 }];
  }

  const wsInfo = wb.addWorksheet('Read Me');
  wsInfo.addRow(['Prince Esquare — Live Catalogue Export', new Date().toISOString().slice(0, 16)]);
  wsInfo.addRow(['Category filter', category || 'All categories']);
  wsInfo.addRow(['Inventory rows', pieces.length]);
  wsInfo.addRow(['Website rows', websiteRows.length]);
  wsInfo.addRow([]);
  wsInfo.addRow(['Inventory Catalog', 'Every physical PE-CAT piece. Edit Opening Qty / Store Qty and re-upload via Product Catalog import.']);
  wsInfo.addRow(['Website Catalogue', 'Live shop listings with size/color stock. Edit Web Stock and use Variant Stock import.']);
  wsInfo.columns = [{ width: 28 }, { width: 70 }];

  return {
    wb,
    stats: {
      inventoryRows: pieces.length,
      websiteRows: websiteRows.length,
      categories: categories.length,
    },
  };
};

module.exports = {
  exportInventoryCatalogWorkbook,
  fetchInventoryPieces,
  fetchWebsiteCatalogRows,
};
