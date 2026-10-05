-- Apply modeled showroom photos to matching products + category tiles.
-- Paths are served from frontend/public/models via nginx root.

-- ========== BLAZERS (replace flat shots with modeled) ==========
UPDATE products SET thumbnail = '/models/blazers/grey-windowpane.jpg',
  images = '["/models/blazers/grey-windowpane.jpg"]'::jsonb
WHERE id = '6a6b8bda-c51e-4e12-8cd3-2c5ae27be6c9'; -- Grey Windowpane

UPDATE products SET thumbnail = '/models/blazers/navy-windowpane.jpg',
  images = '["/models/blazers/navy-windowpane.jpg"]'::jsonb
WHERE id = '67f2c840-7a34-443d-93ec-9fbe10fffb88'; -- Navy Windowpane

UPDATE products SET thumbnail = '/models/blazers/burgundy-check.jpg',
  images = '["/models/blazers/burgundy-check.jpg","/models/blazers/burgundy-lifestyle.jpg"]'::jsonb
WHERE id = '5e8bd368-ee21-4347-a992-b75ecf00bbde'; -- Burgundy Checked

UPDATE products SET thumbnail = '/models/blazers/tan-check.jpg',
  images = '["/models/blazers/tan-check.jpg","/models/blazers/tan-lifestyle.jpg"]'::jsonb
WHERE id = '3c8d93c7-f0bf-4bcd-92d6-d5c77b875189'; -- Tan Checked

UPDATE products SET thumbnail = '/models/blazers/burgundy-solid.jpg',
  images = '["/models/blazers/burgundy-solid.jpg","/models/blazers/burgundy-lifestyle.jpg"]'::jsonb
WHERE id = 'e7d873bc-4b44-4fcf-9cb2-ca014897be2c'; -- Burgundy Wool

UPDATE products SET thumbnail = '/models/blazers/light-blue.jpg',
  images = '["/models/blazers/light-blue.jpg"]'::jsonb
WHERE id = 'a2256d03-bd01-4c1c-b15c-214a396283ea'; -- Light Blue Textured

UPDATE products SET thumbnail = '/models/blazers/royal-blue.jpg',
  images = '["/models/blazers/royal-blue.jpg"]'::jsonb
WHERE id = '5f86ce7f-f27e-47a4-ae93-8afac504b80a'; -- Melano Blue Textured

UPDATE products SET thumbnail = '/models/blazers/navy-solid.jpg',
  images = '["/models/blazers/navy-solid.jpg"]'::jsonb
WHERE id = '0ca40011-3eab-4972-85d8-838bae95bf78'; -- Navy Blue with Lapel Chain

UPDATE products SET thumbnail = '/models/blazers/grey-textured.jpg',
  images = '["/models/blazers/grey-textured.jpg"]'::jsonb
WHERE id = '4ac965f9-0fb9-4163-9a45-ee08ad7082c5'; -- Grey Textured

-- Grey Windowpane was left at KSh 0 after taxonomy merge — align with other blazers
UPDATE products SET price = 7000
WHERE id = '6a6b8bda-c51e-4e12-8cd3-2c5ae27be6c9'
  AND (price IS NULL OR price = 0);

-- ========== FORMAL SHIRTS ==========
UPDATE products SET thumbnail = '/models/shirts/navy-gold-paisley.jpg',
  images = '["/models/shirts/navy-gold-paisley.jpg"]'::jsonb
WHERE id IN (
  '06cbed69-d598-405c-b170-634e91d82ea2', -- Navy and Gold Paisley
  '390a5f93-6769-4c8c-bb12-5c8c803a499f', -- Presidential Navy & Gold Paisley
  '71cd1bc6-9e72-4f79-850b-fade2d268ebf'  -- PRESIDENTIAL BLUE PAISLEY
);

UPDATE products SET thumbnail = '/models/shirts/navy-blue-paisley.jpg',
  images = '["/models/shirts/navy-blue-paisley.jpg"]'::jsonb
WHERE id = '71cd1bc6-9e72-4f79-850b-fade2d268ebf';

UPDATE products SET thumbnail = '/models/shirts/burgundy-check.jpg',
  images = '["/models/shirts/burgundy-check.jpg"]'::jsonb
WHERE id IN (
  '2220487f-1885-4214-bd7e-33d03a31d29b', -- Presidential Burgundy Checked
  '2fb48cb1-319f-4db1-a3d0-5c9591371048'  -- MULTI-CHECK
);

UPDATE products SET thumbnail = '/models/shirts/light-blue-gingham.jpg',
  images = '["/models/shirts/light-blue-gingham.jpg"]'::jsonb
WHERE id IN (
  '9d6c99c1-05a1-49b7-badf-7d68b42aff0b', -- Light Blue Gingham
  '4231b914-4b42-4f7c-9ab2-3e1b40b5335b'  -- Blue Gingham
);

UPDATE products SET thumbnail = '/models/shirts/mauve-contrast.jpg',
  images = '["/models/shirts/mauve-contrast.jpg"]'::jsonb
WHERE id IN (
  '95563252-0181-42c3-8e53-873f8bafea54', -- Lavender Contrast
  '2c73210e-c17a-4c71-9c0e-f1ea3f0fb300'  -- Lavender Stripe Contrast
);

UPDATE products SET thumbnail = '/models/shirts/rose-contrast.jpg',
  images = '["/models/shirts/rose-contrast.jpg"]'::jsonb
WHERE id = 'd7d47440-f34e-4944-bcc3-4e746769dfb4'; -- Rose Pink Contrast

UPDATE products SET thumbnail = '/models/shirts/lilac-contrast.jpg',
  images = '["/models/shirts/lilac-contrast.jpg"]'::jsonb
WHERE id = '415a1187-56f0-45bb-92d6-9407f2f50a21'; -- Steel Blue Contrast (closest lifestyle)

UPDATE products SET thumbnail = '/models/shirts/green-paisley.jpg',
  images = '["/models/shirts/green-paisley.jpg"]'::jsonb
WHERE id IN (
  'f03d1a1e-1f7a-4ada-91b8-a9835b370013', -- GREEN GOLD PAISLEY
  '590c4980-27eb-48d6-bfd6-a70f6dbd24f2', -- Green Paisley
  'b6c17435-be96-48a2-841f-40310b34c119'  -- Dark Green Floral
);

UPDATE products SET thumbnail = '/models/shirts/white-paisley.jpg',
  images = '["/models/shirts/white-paisley.jpg"]'::jsonb
WHERE id = '2ac060b6-1f9d-4a24-affb-94bdbab9152f'; -- CHAMPAGNE PAISLEY

UPDATE products SET thumbnail = '/models/shirts/grey-microcheck.jpg',
  images = '["/models/shirts/grey-microcheck.jpg"]'::jsonb
WHERE id = '299a8090-c918-47c9-b10e-ea6e2ba39c94'; -- GREY PAISLEY (closest patterned formal)

-- ========== T-SHIRTS ==========
UPDATE products SET thumbnail = '/models/tshirts/black-script.jpg',
  images = '["/models/tshirts/black-script.jpg","/models/tshirts/black-jeans-look.jpg"]'::jsonb
WHERE id = 'da1e0c29-c46e-4948-b8fa-fdd7c3ee770e'; -- Black Minimalist

UPDATE products SET thumbnail = '/models/tshirts/burgundy-script.jpg',
  images = '["/models/tshirts/burgundy-script.jpg","/models/tshirts/burgundy-jeans-look.jpg"]'::jsonb
WHERE id = '8033e87c-9713-4942-b8b5-0180c6edf0cb'; -- Burgundy Crew

UPDATE products SET thumbnail = '/models/tshirts/navy-script.jpg',
  images = '["/models/tshirts/navy-script.jpg","/models/tshirts/navy-jeans-look.jpg"]'::jsonb
WHERE id = '5805efed-7527-49f9-9c7a-a3aae29f42af'; -- Navy Boss

UPDATE products SET thumbnail = '/models/tshirts/white-embossed.jpg',
  images = '["/models/tshirts/white-embossed.jpg"]'::jsonb
WHERE id = 'fdc79d32-2a58-4ec8-9ecc-9486e61e6d6e'; -- White Boss Logo

UPDATE products SET thumbnail = '/models/tshirts/white-trim.jpg',
  images = '["/models/tshirts/white-trim.jpg"]'::jsonb
WHERE id = '3bb94173-1a76-432d-ad32-3665eb0b602e'; -- White Contrast Trim

-- ========== JEANS ==========
UPDATE products SET thumbnail = '/models/jeans/light-wash-modeled.jpg',
  images = '["/models/jeans/light-wash-modeled.jpg"]'::jsonb
WHERE id = '933f3b18-d2d0-4023-87ea-d34b4e30578f'; -- Light Blue Jeans

UPDATE products SET thumbnail = '/models/tshirts/black-jeans-look.jpg',
  images = '["/models/tshirts/black-jeans-look.jpg"]'::jsonb
WHERE id = '7bbad705-b2d4-4272-99ab-674d9aa3d566'; -- Dark Blue Denim (charcoal look)

UPDATE products SET thumbnail = '/models/jeans/olive-folded.jpg',
  images = '["/models/jeans/olive-folded.jpg"]'::jsonb
WHERE id = 'f2a4c0dd-2390-4706-a6f4-f9a677550d3e'; -- Blue Denim (best available detail shot)

-- ========== FORMAL SHOES / LOAFERS ==========
UPDATE products SET thumbnail = '/models/shoes/black-patent-lifestyle.jpg',
  images = '["/models/shoes/black-patent-lifestyle.jpg","/models/shoes/black-patent-closeup.jpg"]'::jsonb
WHERE id IN (
  '3f81ec86-23a9-4a68-a321-ed047a709875', -- Clarks Black Patent Cap Toe
  '0d7ebf85-e3ad-4442-929f-43b9f3f89d51', -- Clarks Black Patent Formal
  '853f842a-5c97-4d16-a8d4-cbd518177494'  -- Clarks Black Patent Oxford
);

UPDATE products SET thumbnail = '/models/shoes/tan-brogue-lifestyle.jpg',
  images = '["/models/shoes/tan-brogue-lifestyle.jpg"]'::jsonb
WHERE id IN (
  'd88c5760-c1eb-4e8e-89e1-b6d6836492a7', -- CLARKS TAN WINGTIP
  '3460272f-c201-430d-9d7e-49ccd4ef4fac'  -- BROWN BURNISHED WINGTIP
);

UPDATE products SET thumbnail = '/models/shoes/brown-oxford-lifestyle.jpg',
  images = '["/models/shoes/brown-oxford-lifestyle.jpg"]'::jsonb
WHERE id IN (
  'c1f0b98b-b52a-4d69-8f29-5b142cd0e309', -- CLARKS DARK BROWN CAP-TOE
  '1bc9a275-7c51-49f6-9b03-a1330305e967', -- Clarks Dark Brown Cap Toe
  '73e226c7-a0a7-4530-89df-ccce215403d9'  -- CLARKS DARK BROWN WINGTIP
);

UPDATE products SET thumbnail = '/models/shoes/black-loafer-lifestyle.jpg',
  images = '["/models/shoes/black-loafer-lifestyle.jpg"]'::jsonb
WHERE id IN (
  '7e3d25ef-974c-41f7-87e2-d1dea0eaad75', -- Clarks Black Penny Loafers
  '7c8ced1e-c7fd-477b-aec1-c3d34a1412d4'  -- Clarks Black Patent Penny Loafers
);

UPDATE products SET thumbnail = '/models/shoes/brown-oxford-lifestyle.jpg',
  images = '["/models/shoes/brown-oxford-lifestyle.jpg"]'::jsonb
WHERE id = '127433a9-8730-41c7-9e30-bce107bc0d5d'; -- Dark Brown Pebbled Penny Loafers

-- ========== CATEGORY TILES / HEROES ==========
UPDATE categories SET
  tile_image = '/models/categories/blazers.jpg',
  hero_image = '/models/categories/blazers.jpg',
  image = LEFT('/models/categories/blazers.jpg', 255)
WHERE slug = 'blazers';

UPDATE categories SET
  tile_image = '/models/categories/formal-shirts.jpg',
  hero_image = '/models/categories/formal-shirts.jpg',
  image = LEFT('/models/categories/formal-shirts.jpg', 255)
WHERE slug = 'formal-shirts';

UPDATE categories SET
  tile_image = '/models/categories/shirts.jpg',
  hero_image = '/models/categories/shirts.jpg',
  image = LEFT('/models/categories/shirts.jpg', 255)
WHERE slug = 'shirts';

UPDATE categories SET
  tile_image = '/models/categories/t-shirts.jpg',
  hero_image = '/models/categories/t-shirts.jpg',
  image = LEFT('/models/categories/t-shirts.jpg', 255)
WHERE slug = 't-shirts';

UPDATE categories SET
  tile_image = '/models/categories/jeans.jpg',
  hero_image = '/models/categories/jeans.jpg',
  image = LEFT('/models/categories/jeans.jpg', 255)
WHERE slug = 'jeans';

UPDATE categories SET
  tile_image = '/models/categories/formal-shoes.jpg',
  hero_image = '/models/categories/formal-shoes.jpg',
  image = LEFT('/models/categories/formal-shoes.jpg', 255)
WHERE slug = 'formal-shoes';

UPDATE categories SET
  tile_image = '/models/categories/bespoke-formal.jpg',
  hero_image = '/models/categories/bespoke-formal.jpg',
  image = LEFT('/models/categories/bespoke-formal.jpg', 255)
WHERE slug = 'bespoke-formal';

UPDATE categories SET
  tile_image = '/models/categories/loafers.jpg',
  hero_image = '/models/categories/loafers.jpg',
  image = LEFT('/models/categories/loafers.jpg', 255)
WHERE slug = 'loafers';

UPDATE categories SET
  tile_image = '/models/categories/shoes.jpg',
  hero_image = '/models/categories/shoes.jpg',
  image = LEFT('/models/categories/shoes.jpg', 255)
WHERE slug = 'shoes';

UPDATE categories SET
  tile_image = '/models/categories/suits.jpg',
  hero_image = '/models/categories/suits.jpg',
  image = LEFT('/models/categories/suits.jpg', 255)
WHERE slug = 'suits';

UPDATE categories SET
  tile_image = '/models/categories/jackets.jpg',
  hero_image = '/models/categories/jackets.jpg',
  image = LEFT('/models/categories/jackets.jpg', 255)
WHERE slug = 'jackets';

UPDATE categories SET
  tile_image = '/models/categories/jeans.jpg',
  hero_image = '/models/categories/jeans.jpg',
  image = LEFT('/models/categories/jeans.jpg', 255)
WHERE slug = 'trousers';
