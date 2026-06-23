const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'prince_esquare',
});

// Public endpoints

exports.getPublishedBlogPosts = async (req, res) => {
  try {
    const { page = 1, limit = 9, category, search } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM blog_posts WHERE is_published = true';
    let countQuery = 'SELECT COUNT(*) FROM blog_posts WHERE is_published = true';
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
      countQuery += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $${params.length} OR excerpt ILIKE $${params.length})`;
      countQuery += ` AND (title ILIKE $${params.length} OR excerpt ILIKE $${params.length})`;
    }

    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    query += ' ORDER BY published_date DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({
      posts: result.rows,
      pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total },
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
};

exports.getBlogPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query('SELECT * FROM blog_posts WHERE slug = $1', [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
};

exports.getBlogPostsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 9 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT * FROM blog_posts WHERE category = $1 AND is_published = true ORDER BY published_date DESC LIMIT $2 OFFSET $3',
      [category, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM blog_posts WHERE category = $1 AND is_published = true',
      [category]
    );

    res.json({
      posts: result.rows,
      pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total: parseInt(countResult.rows[0].count, 10) },
    });
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

exports.updateBlogPostViews = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE blog_posts SET views = views + 1 WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating views:', error);
    res.status(500).json({ error: 'Failed to update views' });
  }
};

// Admin endpoints

exports.getAllBlogPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, status } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM blog_posts';
    let countQuery = 'SELECT COUNT(*) FROM blog_posts';
    const params = [];
    const whereConditions = [];

    if (category) {
      params.push(category);
      whereConditions.push(`category = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      whereConditions.push(`(title ILIKE $${params.length} OR excerpt ILIKE $${params.length})`);
    }

    if (status === 'published') {
      whereConditions.push('is_published = true');
    } else if (status === 'draft') {
      whereConditions.push('is_published = false');
    }

    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({
      posts: result.rows,
      pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total },
    });
  } catch (error) {
    console.error('Error fetching all blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
};

exports.createBlogPost = async (req, res) => {
  try {
    const { title, slug, excerpt, content, category, author_name, featured_image_url, is_published } = req.body;

    if (!title || !slug || !excerpt || !content || !category || !author_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check slug uniqueness
    const slugCheck = await pool.query('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
    if (slugCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    const result = await pool.query(
      `INSERT INTO blog_posts (title, slug, excerpt, content, category, author_name, featured_image_url, is_published, published_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, slug, excerpt, content, category, author_name, featured_image_url || null, is_published || false, is_published ? new Date() : null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
};

exports.updateBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, excerpt, content, category, author_name, featured_image_url, is_published } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (title !== undefined) {
      params.push(title);
      updates.push(`title = $${paramIndex++}`);
    }
    if (slug !== undefined) {
      params.push(slug);
      updates.push(`slug = $${paramIndex++}`);
    }
    if (excerpt !== undefined) {
      params.push(excerpt);
      updates.push(`excerpt = $${paramIndex++}`);
    }
    if (content !== undefined) {
      params.push(content);
      updates.push(`content = $${paramIndex++}`);
    }
    if (category !== undefined) {
      params.push(category);
      updates.push(`category = $${paramIndex++}`);
    }
    if (author_name !== undefined) {
      params.push(author_name);
      updates.push(`author_name = $${paramIndex++}`);
    }
    if (featured_image_url !== undefined) {
      params.push(featured_image_url);
      updates.push(`featured_image_url = $${paramIndex++}`);
    }
    if (is_published !== undefined) {
      params.push(is_published);
      updates.push(`is_published = $${paramIndex++}`);
      if (is_published) {
        params.push(new Date());
        updates.push(`published_date = $${paramIndex++}`);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const query = `UPDATE blog_posts SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
};

exports.deleteBlogPost = async (req, res) => {
  try {
    const { id } = req.params;

    const checkResult = await pool.query('SELECT id FROM blog_posts WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    await pool.query('DELETE FROM blog_posts WHERE id = $1', [id]);
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
};

exports.uploadBlogImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const cloudinary = require('cloudinary').v2;
    const { Readable } = require('stream');

    const stream = cloudinary.uploader.upload_stream(
      { folder: 'prince-esquare/blog', resource_type: 'auto' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ error: 'Failed to upload image' });
        }
        res.json({ url: result.secure_url, publicId: result.public_id });
      }
    );

    const bufferStream = Readable.from([req.file.buffer]);
    bufferStream.pipe(stream);
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};
