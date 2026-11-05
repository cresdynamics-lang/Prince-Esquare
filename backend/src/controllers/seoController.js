const fs = require('fs');
const path = require('path');
const {
  SITE_URL,
  SITE_NAME,
  DEFAULT_IMAGE,
  routeSeo,
  organizationSchema,
  localBusinessSchema,
  websiteSchema,
  staticPaths,
  LEGACY_REDIRECTS,
  PRIVATE_ROUTES,
} = require('../seo/siteSeo');
const {
  TAXONOMY_TREE,
  LEGACY_SLUG_ALIASES,
  flattenTaxonomy,
  findTaxonBySlug,
  canonicalShopPath,
} = require('../data/taxonomy');
const { buildCategorySeo, clip, money } = require('../seo/categorySeo');
const { renderDocument, escapeHtml } = require('../seo/pageRenderer');
const data = require('../seo/pageData');
const { GUIDES } = require('../seo/categoryGuides');
const { MAP_URL } = require('../seo/siteSeo');
const { toMetaSquareImageUrl } = require('../utils/cloudinaryImage');

const DIST_INDEX = path.join(__dirname, '../../../frontend/dist/index.html');
const PAGE_CACHE_TTL_MS = 5 * 60 * 1000;
const PAGE_CACHE_MAX = 300;

/* ---------- template + page cache ---------- */

let templateCache = { mtimeMs: 0, html: '' };
const pageCache = new Map();

function loadTemplate() {
  const { mtimeMs } = fs.statSync(DIST_INDEX);
  if (mtimeMs !== templateCache.mtimeMs) {
    templateCache = { mtimeMs, html: fs.readFileSync(DIST_INDEX, 'utf8') };
    pageCache.clear(); // new deploy → new asset hashes
  }
  return templateCache.html;
}

/* ---------- small helpers ---------- */

const titleCase = (value) => {
  const text = String(value || '').trim();
  if (text !== text.toUpperCase()) return text;
  return text.toLowerCase().replace(/(^|[\s-])([a-z])/g, (m, sep, ch) => sep + ch.toUpperCase());
};

function absoluteUrl(url) {
  if (!url) return DEFAULT_IMAGE;
  const value = String(url).trim();
  if (!value) return DEFAULT_IMAGE;
  const abs = /^https?:\/\//i.test(value) ? value : `${SITE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
  return abs.replace(/^http:\/\//i, 'https://').replace(/ /g, '%20');
}

/** Sized CDN version for the lightweight HTML list. */
function cardImage(url) {
  const abs = absoluteUrl(url);
  return abs.includes('/upload/') ? abs.replace('/upload/', '/upload/f_auto,q_auto,w_480/') : abs;
}

function socialImage(url) {
  const abs = absoluteUrl(url);
  return toMetaSquareImageUrl(abs) || abs;
}

function parseImages(product) {
  let list = product.images;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      list = [];
    }
  }
  const urls = (Array.isArray(list) ? list : [])
    .map((item) => (typeof item === 'string' ? item : item?.url || item?.secure_url))
    .filter((u) => typeof u === 'string' && u.trim().length > 4)
    .map(absoluteUrl);
  const all = [absoluteUrl(product.thumbnail), ...urls];
  return [...new Set(all)].slice(0, 6);
}

const unitPrice = (product) => {
  const sale = Number(product.discount_price);
  return Number.isFinite(sale) && sale > 0 ? sale : Number(product.price) || 0;
};

function productSchema(product, images) {
  const description = product.description || product.focus_description;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: titleCase(product.name),
    image: images,
    description: description || `${titleCase(product.name)} from Prince Esquire, The Man's Shop in Nairobi, Kenya.`,
    sku: String(product.sku || product.slug),
    category: product.category_name || product.parent_category_name || undefined,
    brand: { '@type': 'Brand', name: product.brand_name || SITE_NAME },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: 'KES',
      price: String(unitPrice(product)),
      // Matches the storefront, which sells every listed product as available online.
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: SITE_NAME },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'KE',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 5,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/ReturnShippingFees',
      },
    },
  };
  if (Number(product.ratings_count) > 0 && Number(product.ratings_avg) > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: String(product.ratings_avg),
      reviewCount: Number(product.ratings_count),
    };
  }
  return schema;
}

function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

function itemListSchema(products, name) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 40).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/product/${product.slug}`,
      name: titleCase(product.name),
    })),
  };
}

function faqSchema(faqs) {
  if (!faqs?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

/* ---------- HTML fragments ---------- */

const productListHtml = (products) =>
  products.length
    ? `<ul>${products
        .map(
          (p) => `<li><a href="/product/${escapeHtml(p.slug)}"><img src="${escapeHtml(cardImage(p.thumbnail))}" alt="${escapeHtml(
            titleCase(p.name)
          )}" width="240" height="300" loading="lazy" /> ${escapeHtml(titleCase(p.name))}</a> — ${money(unitPrice(p))}</li>`
        )
        .join('')}</ul>`
    : '';

const breadcrumbHtml = (items) =>
  `<nav aria-label="Breadcrumb">${items
    .map((c, i) =>
      i === items.length - 1 ? escapeHtml(c.name) : `<a href="${escapeHtml(c.path)}">${escapeHtml(c.name)}</a> / `
    )
    .join('')}</nav>`;

const guideHtml = (sections) =>
  sections?.length
    ? `<section><h2>Buying guide</h2>${sections
        .map((s) => `<h3>${escapeHtml(s.heading)}</h3><p>${escapeHtml(s.body)}</p>`)
        .join('')}</section>`
    : '';

const relatedHtml = (posts) =>
  posts?.length
    ? `<section><h2>From the Style Journal</h2><ul>${posts
        .map((p) => `<li><a href="/blog/${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a></li>`)
        .join('')}</ul></section>`
    : '';

const faqHtml = (faqs) =>
  faqs?.length
    ? `<section><h2>Frequently asked questions</h2>${faqs
        .map((f) => `<h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p>`)
        .join('')}</section>`
    : '';

async function siteNavHtml() {
  const stats = await data.loadCategoryStats().catch(() => null);
  const primaries = TAXONOMY_TREE.map((node) => {
    const count = stats ? data.statsForSlug(stats, node.slug).count : 1;
    return count > 0 ? `<li><a href="/shop/${node.slug}">${escapeHtml(node.name)}</a></li>` : '';
  }).join('');
  return `<header><p><a href="/">${SITE_NAME}</a> — The Man's Shop, Yala Towers, Nairobi</p><nav aria-label="Primary"><ul><li><a href="/new-arrivals">New Arrivals</a></li>${primaries}<li><a href="/sale">Sale</a></li><li><a href="/blog">Style Journal</a></li><li><a href="/contact-us">Contact</a></li></ul></nav></header>`;
}

const FOOTER_HTML = `<footer><p>Prince Esquire, The Man's Shop. Yala Towers, Nairobi, Kenya. Phone and WhatsApp: <a href="tel:+254724494089">+254 724 494089</a>. Delivery across Kenya.</p><p><a href="/contact-us">Contact</a> · <a href="/shipping-returns">Shipping &amp; Returns</a> · <a href="/size-guide">Size Guide</a> · <a href="/bespoke-services">Bespoke Services</a> · <a href="/privacy-policy">Privacy Policy</a></p></footer>`;

/* ---------- page builders ---------- */

async function productPage(slug) {
  const product = await data.fetchProduct(slug);
  if (!product) return null;

  const name = titleCase(product.name);
  const price = unitPrice(product);
  const images = parseImages(product);
  const summary = product.focus_description || product.description || '';
  const crumbs = [{ name: 'Home', path: '/' }];
  if (product.parent_category_slug) {
    crumbs.push({ name: product.parent_category_name, path: canonicalShopPath(product.parent_category_slug) });
  }
  if (product.category_slug) {
    crumbs.push({ name: product.category_name, path: canonicalShopPath(product.category_slug) });
  }
  crumbs.push({ name, path: `/product/${product.slug}` });

  const sizes = [...new Set((product.variants || []).map((v) => v.size).filter((s) => s && s !== 'Standard'))];
  const colors = [...new Set((product.variants || []).map((v) => v.color).filter(Boolean))];

  return {
    title:
      [`${name} in Kenya | ${SITE_NAME}`, `${name} | ${SITE_NAME}`].find((t) => t.length <= 70) ||
      `${clip(name, 52)} | ${SITE_NAME}`,
    description: clip(`${name}, ${money(price)}. ${summary || "Shop at Prince Esquire, Yala Towers, Nairobi."} Delivery across Kenya.`, 158),
    canonicalPath: `/product/${product.slug}`,
    image: socialImage(product.thumbnail),
    preloadImage: cardImage(product.thumbnail).replace('w_480', 'w_900'),
    ogType: 'product',
    price: String(price),
    schemas: [productSchema(product, images), breadcrumbSchema(crumbs), organizationSchema],
    bodyHtml: `${breadcrumbHtml(crumbs)}<main><article><h1>${escapeHtml(name)}</h1>
      <img src="${escapeHtml(cardImage(product.thumbnail))}" alt="${escapeHtml(name)}" width="480" height="600" />
      <p>${money(price)}${product.brand_name ? ` · ${escapeHtml(product.brand_name)}` : ''}</p>
      ${sizes.length ? `<p>Sizes: ${escapeHtml(sizes.join(', '))}</p>` : ''}
      ${colors.length ? `<p>Colours: ${escapeHtml(colors.join(', '))}</p>` : ''}
      <p>${escapeHtml(product.description || summary)}</p></article></main>`,
  };
}

async function categoryPage(urlPath, segments) {
  const leaf = segments[segments.length - 1];
  const stats = await data.loadCategoryStats();
  const alias = LEGACY_SLUG_ALIASES[leaf];
  if (alias) return { redirect: canonicalShopPath(alias) };

  const node = findTaxonBySlug(leaf);
  const dbCategory = stats.categories.find((c) => c.slug === leaf);
  if (!node && !dbCategory) return null;

  const canonicalPath = node ? canonicalShopPath(leaf) : `/shop/${leaf}`;
  if (canonicalPath !== urlPath) return { redirect: canonicalPath };

  const name = node?.name || dbCategory.name;
  const leafStats = data.statsForSlug(stats, leaf);
  const seo = buildCategorySeo({ slug: leaf, name }, leafStats);
  const products = await data.fetchProductsForCategory(leaf);

  const chain = canonicalPath.split('/').slice(2);
  const flat = flattenTaxonomy(TAXONOMY_TREE);
  const crumbs = [{ name: 'Home', path: '/' }];
  chain.forEach((slug, index) => {
    crumbs.push({
      name: flat.find((row) => row.slug === slug)?.name || slug,
      path: `/shop/${chain.slice(0, index + 1).join('/')}`,
    });
  });

  const children = (node?.children || [])
    .map((child) => ({ ...child, count: data.statsForSlug(stats, child.slug).count }))
    .filter((child) => child.count > 0);

  const related = await data.relatedPosts(leaf, GUIDES[leaf]?.keywords).catch(() => []);

  return {
    title: seo.title,
    description: seo.description,
    canonicalPath,
    // An empty category has nothing to rank with until stock arrives.
    noindex: leafStats.count === 0,
    image: socialImage(products[0]?.thumbnail || node?.tileImage),
    schemas: [
      breadcrumbSchema(crumbs),
      organizationSchema,
      products.length ? itemListSchema(products, seo.h1) : null,
      leafStats.count > 0 ? faqSchema(seo.faqs) : null,
    ],
    bodyHtml: `${breadcrumbHtml(crumbs)}<main><h1>${escapeHtml(seo.h1)}</h1><p>${escapeHtml(seo.intro)}</p>
      ${
        children.length
          ? `<nav aria-label="Shop by style"><ul>${children
              .map((c) => `<li><a href="${canonicalShopPath(c.slug)}">${escapeHtml(c.name)}</a> (${c.count})</li>`)
              .join('')}</ul></nav>`
          : ''
      }
      <section><h2>Shop ${escapeHtml(name)}</h2>${productListHtml(products)}</section>
      ${guideHtml(seo.guide)}
      <section><h2>Delivery and visiting us</h2><p>Same-day delivery within Nairobi, in just 1-2 hours, and 1-2 days countrywide. Returns within 5 days. Visit us at <a href="${MAP_URL.replace(/&/g, '&amp;')}">Yala Towers, Nairobi</a>.</p></section>
      ${relatedHtml(related)}
      ${leafStats.count > 0 ? faqHtml(seo.faqs) : ''}</main>`,
  };
}

async function blogPostPage(slug) {
  const post = await data.fetchBlogPost(slug);
  if (!post) return null;
  const description = clip(post.meta_description || post.excerpt || post.title, 158);
  const canonicalPath = `/blog/${post.slug}`;
  const text = String(post.content || '')
    .replace(/<\/(p|h[1-6]|li|div)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  const paragraphs = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Style Journal', path: '/blog' },
    { name: post.title, path: canonicalPath },
  ];
  return {
    title: clip(post.meta_title || `${post.title} | ${SITE_NAME}`, 70),
    description,
    canonicalPath,
    ogType: 'article',
    image: socialImage(post.featured_image_url),
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description,
        image: [absoluteUrl(post.featured_image_url)],
        datePublished: post.published_date,
        dateModified: post.updated_at || post.published_date,
        mainEntityOfPage: `${SITE_URL}${canonicalPath}`,
        author: { '@type': 'Organization', name: SITE_NAME },
        publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: DEFAULT_IMAGE } },
      },
      breadcrumbSchema(crumbs),
    ],
    bodyHtml: `${breadcrumbHtml(crumbs)}<main><article><h1>${escapeHtml(post.title)}</h1>${paragraphs
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join('')}</article></main>`,
  };
}

async function listingPage(key, products, extraSchemas = []) {
  const meta = routeSeo[key];
  return {
    title: meta.title,
    description: meta.description,
    canonicalPath: meta.path,
    image: products[0] ? socialImage(products[0].thumbnail) : undefined,
    schemas: [organizationSchema, products.length ? itemListSchema(products, meta.h1) : null, ...extraSchemas],
    bodyHtml: `<main><h1>${escapeHtml(meta.h1)}</h1>${meta.intro ? `<p>${escapeHtml(meta.intro)}</p>` : ''}${productListHtml(products)}</main>`,
  };
}

async function homePage() {
  const meta = routeSeo.home;
  const [products, stats] = await Promise.all([data.fetchFeaturedProducts(24), data.loadCategoryStats()]);
  const categories = TAXONOMY_TREE.filter((node) => data.statsForSlug(stats, node.slug).count > 0);
  return {
    title: meta.title,
    description: meta.description,
    canonicalPath: '/',
    image: `${SITE_URL}/hero/entrance-1600.jpg`,
    preloadImage: '/hero/entrance-1600.jpg',
    schemas: [organizationSchema, localBusinessSchema, websiteSchema, itemListSchema(products, 'Featured menswear')],
    bodyHtml: `<main><h1>${escapeHtml(meta.h1)}</h1><p>${escapeHtml(meta.intro)}</p>
      <section><h2>Shop by category</h2><ul>${categories
        .map((n) => `<li><a href="/shop/${n.slug}">${escapeHtml(n.name)}</a></li>`)
        .join('')}</ul></section>
      <section><h2>Featured pieces</h2>${productListHtml(products)}</section></main>`,
  };
}

function infoPage(key) {
  const meta = routeSeo[key];
  return {
    title: meta.title,
    description: meta.description,
    canonicalPath: meta.path,
    schemas: [organizationSchema, key === 'contact-us' ? localBusinessSchema : null],
    bodyHtml: `<main><h1>${escapeHtml(meta.h1)}</h1><p>${escapeHtml(meta.intro || meta.description)}</p></main>`,
  };
}

async function buildPage(urlPath, search) {
  if (urlPath === '/') return homePage();

  const [, first, ...rest] = urlPath.split('/');

  if (first === 'product' && rest.length === 1) return productPage(decodeURIComponent(rest[0]));
  if (first === 'blog' && rest.length === 1) return blogPostPage(decodeURIComponent(rest[0]));
  if (first === 'shop' && rest.length >= 1 && rest.length <= 3) {
    return categoryPage(urlPath, rest.map(decodeURIComponent));
  }

  if (urlPath === '/blog') {
    const posts = await data.fetchBlogList();
    const meta = routeSeo.blog;
    return {
      title: meta.title,
      description: meta.description,
      canonicalPath: '/blog',
      schemas: [organizationSchema],
      bodyHtml: `<main><h1>${escapeHtml(meta.h1)}</h1><p>${escapeHtml(meta.intro)}</p><ul>${posts
        .map(
          (p) =>
            `<li><a href="/blog/${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a>${p.excerpt ? ` — ${escapeHtml(p.excerpt)}` : ''}</li>`
        )
        .join('')}</ul></main>`,
    };
  }

  if (urlPath === '/products') {
    const params = new URLSearchParams(search);
    const page = await listingPage('products', await data.fetchAllProducts());
    // Search results and filtered views must not compete with the real collection pages.
    if (params.get('search') || params.get('q') || params.get('category') || params.get('sub')) {
      return { ...page, noindex: true };
    }
    return page;
  }
  if (urlPath === '/sale') return listingPage('sale', await data.fetchSaleProducts());
  if (urlPath === '/new-arrivals') return listingPage('new-arrivals', await data.fetchRecentProducts());

  const key = urlPath.slice(1);
  if (routeSeo[key]?.path === urlPath) return infoPage(key);

  return null;
}

function privatePage(urlPath) {
  const match = PRIVATE_ROUTES.find((route) => route.test.test(urlPath));
  if (!match) return null;
  return {
    title: `${match.title} | ${SITE_NAME}`,
    description: `${match.title} at Prince Esquire, The Man's Shop in Nairobi.`,
    canonicalPath: urlPath,
    noindex: true,
    bodyHtml: '',
  };
}

function notFoundPage(navHtml) {
  return {
    title: `Page not found | ${SITE_NAME}`,
    description: 'The page you requested could not be found at Prince Esquire.',
    canonicalPath: '/',
    noindex: true,
    bodyHtml: `${navHtml}<main><h1>Page not found</h1><p><a href="/products">Browse the collection</a></p></main>`,
  };
}

/* ---------- request handlers ---------- */

function parseRequestUri(req) {
  const raw = String(req.headers['x-original-uri'] || req.query.path || '/').slice(0, 2048);
  const [pathname, ...queryParts] = raw.split('?');
  return { pathname: pathname.split('#')[0] || '/', search: queryParts.join('?') };
}

const sendPermanentRedirect = (res, target, search) => {
  res.set('Cache-Control', 'public, max-age=86400');
  res.redirect(301, `${SITE_URL}${target}${search ? `?${search}` : ''}`);
};

/** GET /ssr-html — the storefront document for any page URL (nginx proxies here). */
exports.renderPage = async (req, res, next) => {
  try {
    const { pathname, search } = parseRequestUri(req);

    if (pathname.includes('//') || pathname.includes('..')) {
      const template = loadTemplate();
      return res
        .status(404)
        .type('html')
        .send(renderDocument(template, notFoundPage('')));
    }

    if (pathname !== '/' && pathname.endsWith('/')) {
      return sendPermanentRedirect(res, pathname.replace(/\/+$/, ''), search);
    }
    if (LEGACY_REDIRECTS[pathname]) {
      return sendPermanentRedirect(res, LEGACY_REDIRECTS[pathname], search);
    }

    const template = loadTemplate();
    // Only /products varies by query; ?fbclid=… and similar must not multiply cache entries.
    const cacheKey = pathname === '/products' ? `${pathname}?${search}` : pathname;
    const cached = pageCache.get(cacheKey);
    if (cached && Date.now() - cached.at < PAGE_CACHE_TTL_MS) {
      res.set('Cache-Control', 'public, max-age=0, must-revalidate');
      return res.status(cached.status).type('html').send(cached.html);
    }

    let page = privatePage(pathname) || (await buildPage(pathname, search));
    if (page?.redirect) return sendPermanentRedirect(res, page.redirect, search);

    let status = 200;
    if (!page) {
      status = 404;
      page = notFoundPage(await siteNavHtml());
    } else if (!page.noindex || page.bodyHtml) {
      page = { ...page, bodyHtml: `${await siteNavHtml()}${page.bodyHtml}${FOOTER_HTML}` };
    }

    const html = renderDocument(template, page);
    // Bots probing random URLs must not grow the cache without limit.
    if (status === 200) {
      if (pageCache.size >= PAGE_CACHE_MAX) pageCache.clear();
      pageCache.set(cacheKey, { at: Date.now(), status, html });
    }
    res.set('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.status(status).type('html').send(html);
  } catch (error) {
    return next(error);
  }
};

/** GET /sitemap.xml — only live, indexable URLs, with product images. */
exports.getSitemap = async (_req, res, next) => {
  try {
    const [stats, products, posts] = await Promise.all([
      data.loadCategoryStats(),
      data.fetchAllProducts(),
      data.fetchBlogList(),
    ]);

    const shopPaths = [
      ...new Set(
        flattenTaxonomy(TAXONOMY_TREE)
          .filter((row) => data.statsForSlug(stats, row.slug).count > 0)
          .map((row) => canonicalShopPath(row.slug))
      ),
    ];

    const escapeXml = (value) =>
      String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const toEntry = (urlPath, { lastmod, images = [] } = {}) => {
      const parts = [`    <loc>${escapeXml(`${SITE_URL}${urlPath}`)}</loc>`];
      if (lastmod) parts.push(`    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>`);
      images.forEach((image) => {
        parts.push(`    <image:image><image:loc>${escapeXml(image)}</image:loc></image:image>`);
      });
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    };

    const seen = new Set();
    const entries = [
      ...staticPaths.map((p) => [p]),
      ...shopPaths.map((p) => [p]),
      ...products.map((p) => [
        `/product/${encodeURIComponent(p.slug)}`,
        { lastmod: p.updated_at, images: parseImages(p).slice(0, 5) },
      ]),
      ...posts.map((p) => [
        `/blog/${encodeURIComponent(p.slug)}`,
        { lastmod: p.updated_at, images: p.featured_image_url ? [absoluteUrl(p.featured_image_url)] : [] },
      ]),
    ]
      .filter(([urlPath]) => {
        if (seen.has(urlPath)) return false;
        seen.add(urlPath);
        return true;
      })
      .map(([urlPath, options]) => toEntry(urlPath, options));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>`;

    res.set('Cache-Control', 'public, max-age=1800');
    res.type('application/xml').send(xml);
  } catch (error) {
    next(error);
  }
};
