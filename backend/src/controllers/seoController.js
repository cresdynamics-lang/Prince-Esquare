const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const {
  SITE_URL,
  SITE_NAME,
  DEFAULT_IMAGE,
  routeSeo,
  categoryFilters,
  organizationSchema,
  localBusinessSchema,
  websiteSchema,
  staticPaths,
} = require('../seo/siteSeo');

const DIST_INDEX = path.join(__dirname, '../../../frontend/dist/index.html');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizePath(rawPath) {
  const pathOnly = String(rawPath || '/').split('?')[0].split('#')[0] || '/';
  if (pathOnly !== '/' && pathOnly.endsWith('/')) return pathOnly.slice(0, -1);
  return pathOnly || '/';
}

function resolveRouteMeta(urlPath) {
  if (urlPath === '/') return routeSeo.home;
  const key = urlPath.slice(1);
  return routeSeo[key] || routeSeo.products;
}

async function fetchProductsForPath(urlPath, limit = 48) {
  const filter = categoryFilters[urlPath];
  let query = `
    SELECT p.name, p.slug, p.price, p.thumbnail, p.description, b.name AS brand_name,
           c.slug AS category_slug, p_cat.slug AS parent_category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN categories p_cat ON c.parent_id = p_cat.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE p.is_active = true   `;
  const params = [];

  if (filter?.parentSlug) {
    query += ` AND (c.slug = $1 OR p_cat.slug = $1 OR LOWER(c.name) = LOWER($2) OR LOWER(p_cat.name) = LOWER($2))`;
    params.push(filter.parentSlug, filter.parentSlug.replace(/-/g, ' '));
  }

  query += ` ORDER BY p.is_featured DESC, p.created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await db.query(query, params);
  return result.rows;
}

async function fetchProductBySlug(slug) {
  const result = await db.query(
    `SELECT p.*, b.name AS brand_name, c.name AS category_name
     FROM products p
     LEFT JOIN brands b ON p.brand_id = b.id
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.slug = $1 AND p.is_active = true
     LIMIT 1`,
    [slug]
  );
  return result.rows[0] || null;
}

async function fetchBlogBySlug(slug) {
  const result = await db.query(
    `SELECT title, slug, excerpt, content, featured_image_url, published_date, updated_at, meta_title, meta_description
     FROM blog_posts
     WHERE slug = $1 AND is_published = true
     LIMIT 1`,
    [slug]
  );
  return result.rows[0] || null;
}

async function fetchSaleSections() {
  const result = await db.query(
    `SELECT p.name, p.slug, p.price, p.thumbnail,
            c.name AS category_name, c.slug AS category_slug,
            p_cat.name AS parent_category_name, p_cat.slug AS parent_category_slug
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN categories p_cat ON c.parent_id = p_cat.id
     WHERE p.is_active = true  AND p.is_on_sale = true
     ORDER BY p.is_featured DESC, p.name ASC
     LIMIT 80`
  );

  const sectionMap = new Map();
  for (const product of result.rows) {
    const cat = product.category_slug || '';
    const parent = product.parent_category_slug || '';
    let title = product.category_name || product.parent_category_name || 'Sale Picks';
    let slug = cat || parent || 'sale';
    if (cat === 'track-suits') {
      title = 'Track Suits';
      slug = 'track-suits';
    } else if (cat === 'khaki') {
      title = 'Khaki Trousers';
      slug = 'khaki';
    } else if (cat === 'boots' || /boot/i.test(product.name || '')) {
      title = 'Official Boots';
      slug = 'boots';
    } else if (cat === 'formal-shoes') {
      title = 'Official Shoes';
      slug = 'formal-shoes';
    }
    if (!sectionMap.has(slug)) sectionMap.set(slug, { title, products: [] });
    sectionMap.get(slug).products.push(product);
  }
  return Array.from(sectionMap.values());
}

function productSchema(product) {
  const image = product.thumbnail?.startsWith('http')
    ? product.thumbnail
    : `${SITE_URL}${product.thumbnail || '/LOGO.jpeg'}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: [image],
    description: product.description || `${product.name} — luxury fashion at Prince Esquire Kenya.`,
    sku: String(product.slug || product.name),
    brand: { '@type': 'Brand', name: product.brand_name || SITE_NAME },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: 'KES',
      price: String(product.price || ''),
      availability: 'https://schema.org/InStock',
    },
  };
}

function itemListSchema(products, listName) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    itemListElement: products.slice(0, 20).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/product/${product.slug}`,
      name: product.name,
    })),
  };
}

function buildProductListHtml(products) {
  if (!products.length) return '<p>Browse our luxury fashion collection at Prince Esquire Kenya.</p>';
  return `<ul>${products
    .map(
      (p) =>
        `<li><a href="/product/${escapeHtml(p.slug)}">${escapeHtml(p.name)}</a> — KSh ${escapeHtml(
          Number(p.price || 0).toLocaleString()
        )}${p.brand_name ? ` (${escapeHtml(p.brand_name)})` : ''}</li>`
    )
    .join('')}</ul>`;
}

function buildNavHtml() {
  const links = [
    ['Home', '/'],
    ['Collections', '/products'],
    ['Sale', '/sale'],
    ['Shoes', '/shoes'],
    ['Shirts', '/shirts'],
    ['Suits', '/suits'],
    ['Track Suits', '/products?category=track-suits'],
    ['Blog', '/blog'],
    ['Contact', '/contact-us'],
  ];
  return `<nav aria-label="Site"><ul>${links
    .map(([label, href]) => `<li><a href="${href}">${label}</a></li>`)
    .join('')}</ul></nav>`;
}

function absoluteImage(url) {
  if (!url) return DEFAULT_IMAGE;
  const value = String(url).trim();
  if (!value) return DEFAULT_IMAGE;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${SITE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
}

function renderDocument({ title, description, canonicalPath, bodyHtml, schemas = [], image } = {}) {
  const canonical = `${SITE_URL}${canonicalPath}`;
  const ogImage = absoluteImage(image || DEFAULT_IMAGE);
  const schemaScripts = schemas
    .filter(Boolean)
    .map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
    .join('\n    ');

  let spaAssets = '';
  try {
    if (fs.existsSync(DIST_INDEX)) {
      const dist = fs.readFileSync(DIST_INDEX, 'utf8');
      const scriptMatch = dist.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
      const cssMatch = dist.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/);
      if (scriptMatch) spaAssets += `<script type="module" crossorigin src="${scriptMatch[1]}"></script>\n    `;
      if (cssMatch) spaAssets += `<link rel="stylesheet" crossorigin href="${cssMatch[1]}">`;
    }
  } catch {
    /* optional SPA assets */
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    ${schemaScripts}
    ${spaAssets}
  </head>
  <body>
    <header>
      <p><a href="/">${SITE_NAME}</a> — Luxury Fashion Kenya</p>
      ${buildNavHtml()}
    </header>
    <main>${bodyHtml}</main>
    <footer>
      <p>Prince Esquire — Nairobi, Kenya. Delivery across Kenya.</p>
      <p><a href="/contact-us">Contact</a> · <a href="/shipping-returns">Shipping</a> · <a href="/privacy-policy">Privacy</a></p>
    </footer>
    <div id="root"></div>
  </body>
</html>`;
}

async function buildPageHtml(urlPath) {
  const productMatch = urlPath.match(/^\/product\/([^/]+)$/);
  const blogMatch = urlPath.match(/^\/blog\/([^/]+)$/);

  if (productMatch) {
    const product = await fetchProductBySlug(decodeURIComponent(productMatch[1]));
    if (!product) return null;
    const title = `${product.name} | ${SITE_NAME}`;
    const description =
      (product.description || '').slice(0, 160) ||
      `Shop ${product.name} at Prince Esquire — luxury fashion in Kenya.`;
    const productImage = absoluteImage(product.thumbnail);
    const bodyHtml = `
      <article>
        <h1>${escapeHtml(product.name)}</h1>
        <p><img src="${escapeHtml(productImage)}" alt="${escapeHtml(product.name)}" width="600" height="600" /></p>
        <p>${escapeHtml(product.brand_name || 'Prince Esquire')} · KSh ${escapeHtml(Number(product.price || 0).toLocaleString())}</p>
        <p>${escapeHtml((product.description || description).slice(0, 500))}</p>
        <p><a href="/products">Back to collections</a></p>
      </article>`;
    return renderDocument({
      title,
      description,
      canonicalPath: urlPath,
      bodyHtml,
      image: productImage,
      schemas: [productSchema(product), organizationSchema],
    });
  }

  if (blogMatch) {
    const post = await fetchBlogBySlug(decodeURIComponent(blogMatch[1]));
    if (!post) return null;
    const title = post.meta_title || `${post.title} | ${SITE_NAME}`;
    const description = post.meta_description || post.excerpt || post.title;
    const bodyHtml = `
      <article>
        <h1>${escapeHtml(post.title)}</h1>
        <p>${escapeHtml(post.excerpt || '')}</p>
        <div>${escapeHtml(String(post.content || '').replace(/<[^>]+>/g, ' ').slice(0, 1200))}</div>
      </article>`;
    const blogSchema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description,
      datePublished: post.published_date,
      dateModified: post.updated_at || post.published_date,
      mainEntityOfPage: `${SITE_URL}${urlPath}`,
      publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: DEFAULT_IMAGE } },
    };
    return renderDocument({
      title,
      description,
      canonicalPath: urlPath,
      bodyHtml,
      image: absoluteImage(post.featured_image_url),
      schemas: [blogSchema, organizationSchema],
    });
  }

  if (urlPath === '/sale') {
    const sections = await fetchSaleSections();
    const allProducts = sections.flatMap((s) => s.products);
    const meta = routeSeo.sale;
    const bodyHtml = `
      <h1>${escapeHtml(meta.h1)}</h1>
      <p>${escapeHtml(meta.intro)}</p>
      ${sections
        .map(
          (section) => `
        <section>
          <h2>${escapeHtml(section.title)}</h2>
          ${buildProductListHtml(section.products)}
        </section>`
        )
        .join('')}`;
    return renderDocument({
      title: meta.title,
      description: meta.description,
      canonicalPath: '/sale',
      bodyHtml,
      schemas: [organizationSchema, itemListSchema(allProducts, 'Sale best sellers')],
    });
  }

  const meta = resolveRouteMeta(urlPath);
  const products = await fetchProductsForPath(urlPath);
  const bodyHtml = `
    <h1>${escapeHtml(meta.h1 || meta.title)}</h1>
    <p>${escapeHtml(meta.intro || meta.description)}</p>
    <h2>Featured products</h2>
    ${buildProductListHtml(products)}`;

  const schemas = [organizationSchema, localBusinessSchema, websiteSchema];
  if (urlPath === '/') schemas.push(itemListSchema(products, 'Featured luxury fashion'));
  else if (products.length) schemas.push(itemListSchema(products, meta.h1 || meta.title));

  return renderDocument({
    title: meta.title,
    description: meta.description,
    canonicalPath: meta.path || urlPath,
    bodyHtml,
    schemas,
  });
}

exports.renderForCrawler = async (req, res, next) => {
  try {
    const urlPath = normalizePath(req.query.path || '/');
    if (urlPath.startsWith('/api') || urlPath.startsWith('/assets') || urlPath.startsWith('/admin')) {
      return res.status(404).send('Not found');
    }

    const html = await buildPageHtml(urlPath);
    if (!html) {
      return res.status(404).type('html').send(
        renderDocument({
          title: `Page not found | ${SITE_NAME}`,
          description: 'The page you requested could not be found at Prince Esquire.',
          canonicalPath: urlPath,
          bodyHtml: '<h1>Page not found</h1><p><a href="/">Return home</a></p>',
          schemas: [organizationSchema],
        })
      );
    }

    res.set('Cache-Control', 'public, max-age=3600');
    res.type('html').send(html);
  } catch (error) {
    next(error);
  }
};

exports.getSitemap = async (_req, res, next) => {
  try {
    const [productsResult, blogsResult] = await Promise.all([
      db.query(`SELECT slug, updated_at FROM products WHERE is_active = true ORDER BY updated_at DESC`),
      db.query(
        `SELECT slug, updated_at FROM blog_posts WHERE is_published = true ORDER BY COALESCE(updated_at, published_date) DESC`
      ).catch(() => ({ rows: [] })),
    ]);

    const urls = [
      ...staticPaths.map((p) => ({ loc: `${SITE_URL}${p === '/' ? '' : p}`, priority: p === '/' ? '1.0' : '0.8' })),
      ...productsResult.rows.map((row) => ({
        loc: `${SITE_URL}/product/${row.slug}`,
        lastmod: row.updated_at,
        priority: '0.7',
      })),
      ...blogsResult.rows.map((row) => ({
        loc: `${SITE_URL}/blog/${row.slug}`,
        lastmod: row.updated_at,
        priority: '0.6',
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((entry) => {
    const lastmod = entry.lastmod
      ? `<lastmod>${new Date(entry.lastmod).toISOString().slice(0, 10)}</lastmod>`
      : '';
    return `  <url>
    <loc>${entry.loc}</loc>
    ${lastmod}
    <changefreq>weekly</changefreq>
    <priority>${entry.priority || '0.5'}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

    res.set('Cache-Control', 'public, max-age=3600');
    res.type('application/xml').send(xml);
  } catch (error) {
    next(error);
  }
};
