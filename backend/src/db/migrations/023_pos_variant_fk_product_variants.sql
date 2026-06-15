-- POS sales store ecommerce variant IDs (product_variants), not pos_product_variants.
-- Migration 011 pointed variant_id at pos_product_variants, which breaks website-line sales.

ALTER TABLE pos_sale_items
  DROP CONSTRAINT IF EXISTS pos_sale_items_variant_id_fkey;

ALTER TABLE pos_sale_items
  ADD CONSTRAINT pos_sale_items_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;

ALTER TABLE pos_stock_movements
  DROP CONSTRAINT IF EXISTS pos_stock_movements_variant_id_fkey;

ALTER TABLE pos_stock_movements
  ADD CONSTRAINT pos_stock_movements_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
