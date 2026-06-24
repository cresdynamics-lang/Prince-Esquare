-- Give the remaining blog posts distinct featured images.

UPDATE blog_posts
SET featured_image_url = '/WhatsApp Image 2026-05-12 at 8.07.42 PM.jpeg', updated_at = NOW()
WHERE slug = 'suit-care-maintenance';

UPDATE blog_posts
SET featured_image_url = '/WhatsApp Image 2026-05-12 at 8.07.43 PM.jpeg', updated_at = NOW()
WHERE slug = 'color-coordination-wardrobe';

UPDATE blog_posts
SET featured_image_url = '/WhatsApp Image 2026-05-12 at 8.07.44 PM.jpeg', updated_at = NOW()
WHERE slug = 'seasonal-trends-gentleman-wear';

UPDATE blog_posts
SET featured_image_url = '/WhatsApp Image 2026-05-12 at 8.07.45 PM.jpeg', updated_at = NOW()
WHERE slug = 'fit-matters-perfect-size';
