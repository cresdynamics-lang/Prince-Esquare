/**
 * Turns the built SPA index.html into a real document for one URL: unique title,
 * description, canonical, social tags, structured data and the page's content.
 *
 * The content lives inside #root, so React replaces it as soon as it mounts.
 * Everyone gets the same HTML (crawlers and shoppers), which keeps this clear of
 * cloaking. It is positioned off-screen until React takes over so shoppers do not
 * see an unstyled flash; browsers without JS get it in normal flow via <noscript>.
 */

const { SITE_URL, SITE_NAME, DEFAULT_IMAGE } = require('./siteSeo');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** JSON-LD must not be able to close its own <script> tag. */
function jsonLd(schema) {
  return JSON.stringify(schema).replace(/</g, '\\u003c');
}

const SSR_STYLE =
  '<style>html,body{background:#0a1128}.pe-ssr{position:absolute;left:-9999px;top:0;width:1000px}</style>' +
  '<noscript><style>.pe-ssr{position:static;width:auto;max-width:960px;margin:0 auto;padding:24px;color:#f9f1de;font-family:Georgia,serif}.pe-ssr a{color:#e5c58d}.pe-ssr img{max-width:240px;height:auto}</style></noscript>';

function renderHead(page) {
  const canonical = `${SITE_URL}${page.canonicalPath === '/' ? '/' : page.canonicalPath}`;
  const image = page.image || DEFAULT_IMAGE;
  const tags = [
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    `<meta name="robots" content="${page.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large'}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="en_KE" />`,
    `<meta property="og:type" content="${escapeHtml(page.ogType || 'website')}" />`,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ];
  if (page.price) {
    tags.push(
      `<meta property="product:price:amount" content="${escapeHtml(page.price)}" />`,
      `<meta property="product:price:currency" content="KES" />`
    );
  }
  if (page.preloadImage) {
    tags.push(`<link rel="preload" as="image" href="${escapeHtml(page.preloadImage)}" fetchpriority="high" />`);
  }
  (page.schemas || []).filter(Boolean).forEach((schema) => {
    // Marked as managed so the SEO component replaces these instead of duplicating them.
    tags.push(`<script type="application/ld+json" data-seo-schema="true">${jsonLd(schema)}</script>`);
  });
  tags.push(SSR_STYLE);
  return tags.join('\n    ');
}

/**
 * @param {string} template contents of frontend/dist/index.html
 * @param {object} page {title, description, canonicalPath, noindex, image, ogType, price, preloadImage, schemas, bodyHtml}
 */
function renderDocument(template, page) {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escapeHtml(page.title)}</title>`)
    .replace(/<meta\s+name="description"[^>]*>\s*/i, '');

  html = html.replace('</head>', () => `  ${renderHead(page)}\n  </head>`);
  html = html.replace(
    /<div id="root">\s*<\/div>/i,
    () => `<div id="root"><div class="pe-ssr">${page.bodyHtml || ''}</div></div>`
  );
  return html;
}

module.exports = { renderDocument, escapeHtml };
