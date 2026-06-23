BEGIN;

DELETE FROM products
WHERE slug IN (
  'dark-brown-pebbled-leather-dress-belt',
  'black-smooth-leather-dress-belt'
);

COMMIT;
