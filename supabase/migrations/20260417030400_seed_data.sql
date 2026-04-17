-- Seed data for categories
INSERT INTO public.categories (slug, name, description, image_url, display_order) VALUES
('suits', 'Suits', 'Tailored suits for the modern gentleman', '/src/assets/cat-suits.jpg', 1),
('shirts', 'Shirts', 'Premium dress shirts in various styles', '/src/assets/cat-shirts.jpg', 2),
('trousers', 'Trousers', 'Formal and casual trousers', '/src/assets/cat-trousers.jpg', 3),
('shoes', 'Shoes', 'Leather dress shoes and casual footwear', '/src/assets/cat-shoes.jpg', 4),
('socks', 'Socks', 'Quality socks for every occasion', '/src/assets/cat-socks.jpg', 5),
('belts', 'Belts', 'Leather belts to complete your look', '/src/assets/cat-belts.jpg', 6),
('casual', 'Casual', 'Smart casual wear for everyday', '/src/assets/cat-casual.jpg', 7),
('formal', 'Formal', 'Formal attire for special occasions', '/src/assets/cat-formal.jpg', 8),
('sportswear', 'Sportswear', 'Athletic wear for the active man', '/src/assets/cat-sportswear.jpg', 9);

-- Seed data for products (with images and featured flags)
INSERT INTO public.products (slug, title, description, category_id, price, sale_price, is_published, is_featured, meta_title, meta_description) VALUES
('navy-three-piece-suit', 'Navy Three-Piece Suit', 'A classic navy three-piece suit crafted from premium wool blend fabric. Perfect for weddings, business meetings, and formal events.', (SELECT id FROM public.categories WHERE slug = 'suits'), 45000, 38000, true, true, 'Navy Three-Piece Suit | Prince Esquare', 'Elegant navy three-piece suit with matching vest. Expertly tailored for the modern gentleman.'),
('charcoal-slim-fit-suit', 'Charcoal Slim Fit Suit', 'Contemporary charcoal slim fit suit with modern silhouette. Made from high-quality fabric with excellent drape and comfort.', (SELECT id FROM public.categories WHERE slug = 'suits'), 42000, NULL, true, true, 'Charcoal Slim Fit Suit | Prince Esquare', 'Modern charcoal slim fit suit. Perfect for the contemporary professional.'),
('white-dress-shirt', 'White Dress Shirt', 'Classic white dress shirt made from Egyptian cotton. Features a spread collar and French cuffs for cufflinks.', (SELECT id FROM public.categories WHERE slug = 'shirts'), 4500, 3800, true, true, 'White Dress Shirt | Prince Esquare', 'Premium white dress shirt in Egyptian cotton. Timeless elegance for any formal occasion.'),
('blue-oxford-shirt', 'Blue Oxford Shirt', 'Versatile blue Oxford shirt with button-down collar. Perfect for both casual and formal settings.', (SELECT id FROM public.categories WHERE slug = 'shirts'), 3800, NULL, true, true, 'Blue Oxford Shirt | Prince Esquare', 'Classic blue Oxford shirt with button-down collar. A wardrobe essential.'),
('black-oxford-shoes', 'Black Oxford Shoes', 'Handcrafted black Oxford shoes with Goodyear welt construction. Premium leather sole for durability and comfort.', (SELECT id FROM public.categories WHERE slug = 'shoes'), 15000, 12000, true, true, 'Black Oxford Shoes | Prince Esquare', 'Luxurious black Oxford shoes with Goodyear welt. Handcrafted from premium leather.'),
('brown-loafers', 'Brown Loafers', 'Classic brown loafers crafted from supple leather. Perfect for smart casual and formal occasions.', (SELECT id FROM public.categories WHERE slug = 'shoes'), 12000, NULL, true, true, 'Brown Loafers | Prince Esquare', 'Elegant brown loafers in premium leather. Versatile style for any occasion.'),
('black-leather-belt', 'Black Leather Belt', 'Premium black leather belt with brushed silver buckle. 1.5 inches wide for a classic look.', (SELECT id FROM public.categories WHERE slug = 'belts'), 2500, NULL, true, true, 'Black Leather Belt | Prince Esquare', 'Quality black leather belt with silver buckle. The perfect accessory for any outfit.'),
('brown-leather-belt', 'Brown Leather Belt', 'Rich brown leather belt with antique brass buckle. Handcrafted from full-grain leather.', (SELECT id FROM public.categories WHERE slug = 'belts'), 2500, NULL, true, true, 'Brown Leather Belt | Prince Esquare', 'Handcrafted brown leather belt with brass buckle. Premium full-grain leather.'),
('grey-trousers', 'Grey Trousers', 'Classic grey trousers in a modern fit. Made from wrinkle-resistant fabric for all-day comfort.', (SELECT id FROM public.categories WHERE slug = 'trousers'), 6500, 5500, true, true, 'Grey Trousers | Prince Esquare', 'Modern grey trousers with wrinkle-resistant fabric. Perfect for business and formal wear.'),
('chino-trousers', 'Chino Trousers', 'Versatile chino trousers in a slim fit. Available in classic colors for any wardrobe.', (SELECT id FROM public.categories WHERE slug = 'trousers'), 5500, NULL, true, true, 'Chino Trousers | Prince Esquare', 'Slim fit chino trousers in premium cotton. Versatile style for any occasion.'),
('premium-socks-set', 'Premium Socks Set', 'Set of 3 premium cotton blend socks in classic colors. Reinforced heel and toe for durability.', (SELECT id FROM public.categories WHERE slug = 'socks'), 1200, NULL, true, true, 'Premium Socks Set | Prince Esquare', 'Set of 3 premium socks in classic colors. Reinforced for durability and comfort.'),
('dress-socks', 'Dress Socks', 'Fine merino wool dress socks in elegant patterns. Moisture-wicking for all-day comfort.', (SELECT id FROM public.categories WHERE slug = 'socks'), 800, NULL, true, true, 'Dress Socks | Prince Esquare', 'Luxurious merino wool dress socks. Moisture-wicking comfort for the modern gentleman.');

-- Insert product images
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order) VALUES
-- Navy Three-Piece Suit
((SELECT id FROM public.products WHERE slug = 'navy-three-piece-suit'), '/src/assets/cat-suits.jpg', 'Navy Three-Piece Suit front view', 0),
-- Charcoal Slim Fit Suit
((SELECT id FROM public.products WHERE slug = 'charcoal-slim-fit-suit'), '/src/assets/cat-suits.jpg', 'Charcoal Slim Fit Suit front view', 0),
-- White Dress Shirt
((SELECT id FROM public.products WHERE slug = 'white-dress-shirt'), '/src/assets/cat-shirts.jpg', 'White Dress Shirt front view', 0),
-- Blue Oxford Shirt
((SELECT id FROM public.products WHERE slug = 'blue-oxford-shirt'), '/src/assets/cat-shirts.jpg', 'Blue Oxford Shirt front view', 0),
-- Black Oxford Shoes
((SELECT id FROM public.products WHERE slug = 'black-oxford-shoes'), '/src/assets/cat-shoes.jpg', 'Black Oxford Shoes side view', 0),
-- Brown Loafers
((SELECT id FROM public.products WHERE slug = 'brown-loafers'), '/src/assets/cat-shoes.jpg', 'Brown Loafers side view', 0),
-- Black Leather Belt
((SELECT id FROM public.products WHERE slug = 'black-leather-belt'), '/src/assets/cat-belts.jpg', 'Black Leather Belt', 0),
-- Brown Leather Belt
((SELECT id FROM public.products WHERE slug = 'brown-leather-belt'), '/src/assets/cat-belts.jpg', 'Brown Leather Belt', 0),
-- Grey Trousers
((SELECT id FROM public.products WHERE slug = 'grey-trousers'), '/src/assets/cat-trousers.jpg', 'Grey Trousers front view', 0),
-- Chino Trousers
((SELECT id FROM public.products WHERE slug = 'chino-trousers'), '/src/assets/cat-trousers.jpg', 'Chino Trousers front view', 0),
-- Premium Socks Set
((SELECT id FROM public.products WHERE slug = 'premium-socks-set'), '/src/assets/cat-socks.jpg', 'Premium Socks Set', 0),
-- Dress Socks
((SELECT id FROM public.products WHERE slug = 'dress-socks'), '/src/assets/cat-socks.jpg', 'Dress Socks', 0);

-- Insert product variants (sizes and stock)
INSERT INTO public.product_variants (product_id, size, color, sku, stock_quantity) VALUES
-- Navy Three-Piece Suit
((SELECT id FROM public.products WHERE slug = 'navy-three-piece-suit'), '40R', 'Navy', 'PE-SUIT-NAV-40R', 2),
((SELECT id FROM public.products WHERE slug = 'navy-three-piece-suit'), '42R', 'Navy', 'PE-SUIT-NAV-42R', 3),
((SELECT id FROM public.products WHERE slug = 'navy-three-piece-suit'), '44R', 'Navy', 'PE-SUIT-NAV-44R', 2),
-- Charcoal Slim Fit Suit
((SELECT id FROM public.products WHERE slug = 'charcoal-slim-fit-suit'), '40R', 'Charcoal', 'PE-SUIT-CHR-40R', 3),
((SELECT id FROM public.products WHERE slug = 'charcoal-slim-fit-suit'), '42R', 'Charcoal', 'PE-SUIT-CHR-42R', 2),
((SELECT id FROM public.products WHERE slug = 'charcoal-slim-fit-suit'), '44R', 'Charcoal', 'PE-SUIT-CHR-44R', 2),
-- White Dress Shirt
((SELECT id FROM public.products WHERE slug = 'white-dress-shirt'), '15', 'White', 'PE-SHIRT-WHT-15', 5),
((SELECT id FROM public.products WHERE slug = 'white-dress-shirt'), '16', 'White', 'PE-SHIRT-WHT-16', 5),
((SELECT id FROM public.products WHERE slug = 'white-dress-shirt'), '17', 'White', 'PE-SHIRT-WHT-17', 5),
-- Blue Oxford Shirt
((SELECT id FROM public.products WHERE slug = 'blue-oxford-shirt'), '15', 'Blue', 'PE-SHIRT-BLU-15', 4),
((SELECT id FROM public.products WHERE slug = 'blue-oxford-shirt'), '16', 'Blue', 'PE-SHIRT-BLU-16', 4),
((SELECT id FROM public.products WHERE slug = 'blue-oxford-shirt'), '17', 'Blue', 'PE-SHIRT-BLU-17', 4),
-- Black Oxford Shoes
((SELECT id FROM public.products WHERE slug = 'black-oxford-shoes'), '41', 'Black', 'PE-SHOE-BLK-41', 3),
((SELECT id FROM public.products WHERE slug = 'black-oxford-shoes'), '42', 'Black', 'PE-SHOE-BLK-42', 3),
((SELECT id FROM public.products WHERE slug = 'black-oxford-shoes'), '43', 'Black', 'PE-SHOE-BLK-43', 3),
-- Brown Loafers
((SELECT id FROM public.products WHERE slug = 'brown-loafers'), '41', 'Brown', 'PE-SHOE-BRN-41', 2),
((SELECT id FROM public.products WHERE slug = 'brown-loafers'), '42', 'Brown', 'PE-SHOE-BRN-42', 2),
((SELECT id FROM public.products WHERE slug = 'brown-loafers'), '43', 'Brown', 'PE-SHOE-BRN-43', 2),
-- Black Leather Belt
((SELECT id FROM public.products WHERE slug = 'black-leather-belt'), 'One Size', 'Black', 'PE-BELT-BLK-OS', 10),
-- Brown Leather Belt
((SELECT id FROM public.products WHERE slug = 'brown-leather-belt'), 'One Size', 'Brown', 'PE-BELT-BRN-OS', 10),
-- Grey Trousers
((SELECT id FROM public.products WHERE slug = 'grey-trousers'), '32', 'Grey', 'PE-TRS-GRY-32', 4),
((SELECT id FROM public.products WHERE slug = 'grey-trousers'), '34', 'Grey', 'PE-TRS-GRY-34', 4),
((SELECT id FROM public.products WHERE slug = 'grey-trousers'), '36', 'Grey', 'PE-TRS-GRY-36', 4),
-- Chino Trousers
((SELECT id FROM public.products WHERE slug = 'chino-trousers'), '32', 'Beige', 'PE-TRS-CHN-32', 3),
((SELECT id FROM public.products WHERE slug = 'chino-trousers'), '34', 'Beige', 'PE-TRS-CHN-34', 3),
((SELECT id FROM public.products WHERE slug = 'chino-trousers'), '36', 'Beige', 'PE-TRS-CHN-36', 3),
-- Premium Socks Set
((SELECT id FROM public.products WHERE slug = 'premium-socks-set'), 'One Size', 'Assorted', 'PE-SOCK-PRM-OS', 15),
-- Dress Socks
((SELECT id FROM public.products WHERE slug = 'dress-socks'), 'One Size', 'Assorted', 'PE-SOCK-DRS-OS', 15);
