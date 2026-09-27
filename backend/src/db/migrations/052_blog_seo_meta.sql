-- Optional SEO overrides for blog posts (fallback: title + excerpt)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description TEXT;
