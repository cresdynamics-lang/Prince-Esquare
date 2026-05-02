-- Persist subcategory label per product (e.g. "Formal shoes" under Shoes) for filtering and display.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory TEXT;

COMMENT ON COLUMN public.products.subcategory IS
  'Taxonomy subcategory label within the parent category (mirrors shop inference when backfilled).';

CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products (subcategory)
  WHERE subcategory IS NOT NULL;
