-- Product & variant SKUs for inventory, POS linking, and admin search
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS sku VARCHAR(100);

ALTER TABLE product_variants
    ADD COLUMN IF NOT EXISTS sku VARCHAR(100);

-- Backfill product SKUs from slug
UPDATE products
SET sku = UPPER(REGEXP_REPLACE(slug, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE sku IS NULL OR TRIM(sku) = '';

-- Backfill variant SKUs from stock_id or product slug + size
UPDATE product_variants pv
SET sku = COALESCE(
    NULLIF(TRIM(pv.stock_id), ''),
    UPPER(REGEXP_REPLACE(p.slug, '[^a-zA-Z0-9]+', '-', 'g')) ||
    CASE
        WHEN pv.size IS NOT NULL AND TRIM(pv.size) <> '' THEN '-' || UPPER(REGEXP_REPLACE(pv.size, '[^a-zA-Z0-9]+', '-', 'g'))
        ELSE ''
    END
)
FROM products p
WHERE p.id = pv.product_id
  AND (pv.sku IS NULL OR TRIM(pv.sku) = '');

-- Resolve duplicate variant SKUs before unique index
WITH ranked AS (
    SELECT
        id,
        sku,
        ROW_NUMBER() OVER (PARTITION BY sku ORDER BY created_at NULLS LAST, id) AS rn
    FROM product_variants
    WHERE sku IS NOT NULL AND TRIM(sku) <> ''
)
UPDATE product_variants pv
SET
    sku = pv.sku || '-' || UPPER(SUBSTRING(REPLACE(pv.id::text, '-', '') FROM 1 FOR 6)),
    stock_id = pv.sku || '-' || UPPER(SUBSTRING(REPLACE(pv.id::text, '-', '') FROM 1 FOR 6))
FROM ranked r
WHERE pv.id = r.id
  AND r.rn > 1;

-- Keep legacy stock_id aligned with sku
UPDATE product_variants
SET stock_id = sku
WHERE (stock_id IS NULL OR TRIM(stock_id) = '')
  AND sku IS NOT NULL
  AND TRIM(sku) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique
    ON products (sku)
    WHERE sku IS NOT NULL AND TRIM(sku) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_sku_unique
    ON product_variants (sku)
    WHERE sku IS NOT NULL AND TRIM(sku) <> '';

CREATE INDEX IF NOT EXISTS idx_products_sku_trgm
    ON products USING gin (sku gin_trgm_ops);
