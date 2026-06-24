-- Make the restored belt products visible on the homepage again.

UPDATE products
SET stock_quantity = 1,
    is_active = true,
    updated_at = NOW()
WHERE slug IN (
  'stefano-ricci-leather-belt',
  'black-pebbled-leather-dress-belt'
);
