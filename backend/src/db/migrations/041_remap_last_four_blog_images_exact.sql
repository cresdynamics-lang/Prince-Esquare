-- Remap the last four blog posts to the exact category images requested.

UPDATE blog_posts
SET featured_image_url = '/WhatsApp Image 2026-05-12 at 8.07.17 PM.jpeg', updated_at = NOW()
WHERE slug = 'why-a-tailored-suit-still-matters-in-2026';

UPDATE blog_posts
SET featured_image_url = '/polo black.jpeg', updated_at = NOW()
WHERE slug = 'color-coordination-wardrobe';

UPDATE blog_posts
SET featured_image_url = '/WhatsApp Image 2026-05-12 at 8.07.41 PM.jpeg', updated_at = NOW()
WHERE slug = 'seasonal-trends-gentleman-wear';

UPDATE blog_posts
SET featured_image_url = '/WhatsApp Image 2026-05-12 at 8.07.17 PM (1).jpeg', updated_at = NOW()
WHERE slug = 'fit-matters-perfect-size';