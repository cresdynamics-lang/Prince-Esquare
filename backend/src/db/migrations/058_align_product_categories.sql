-- Align storefront / admin category tree (Prince Esquire)
-- Parents + subs match the catalogue list; adds Vests & Boxers; fixes Jackets parent.

-- Fix self-referencing parents
UPDATE categories SET parent_id = NULL WHERE id = parent_id;

-- Ensure new roots exist
INSERT INTO categories (name, slug, description, image, parent_id, is_featured)
SELECT 'Vests', 'vests', NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'vests');

INSERT INTO categories (name, slug, description, image, parent_id, is_featured)
SELECT 'Boxers', 'boxers', NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'boxers');

-- Jackets subtype under Jackets parent
INSERT INTO categories (name, slug, description, image, parent_id, is_featured)
SELECT 'Jackets', 'full-jackets', NULL, NULL, c.id, false
FROM categories c
WHERE c.slug = 'jackets' AND c.parent_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'full-jackets');
