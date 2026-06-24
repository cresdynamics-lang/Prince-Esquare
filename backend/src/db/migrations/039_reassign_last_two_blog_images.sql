-- Reassign the last two blog posts to category-matching images.

UPDATE blog_posts
SET featured_image_url = '/WhatsApp Image 2026-05-12 at 8.07.17 PM.jpeg', updated_at = NOW()
WHERE slug = 'suit-care-maintenance';

UPDATE blog_posts
SET featured_image_url = '/WhatsApp Image 2026-05-12 at 8.07.15 PM.jpeg', updated_at = NOW()
WHERE slug = 'color-coordination-wardrobe';