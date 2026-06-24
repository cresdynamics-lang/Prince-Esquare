-- Force the tailored suit blog post to the two-piece suit asset.

UPDATE blog_posts
SET featured_image_url = '/WhatsApp Image 2026-05-12 at 8.07.17 PM.jpeg', updated_at = NOW()
WHERE slug = 'why-a-tailored-suit-still-matters-in-2026';