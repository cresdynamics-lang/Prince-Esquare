import { useEffect } from 'react';
import { SITE_NAME, SITE_URL, DEFAULT_IMAGE } from '../seo/seoData';

const upsertMeta = (selector, attrs) => {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement('meta');
    document.head.appendChild(node);
  }
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
};

const upsertLink = (rel, href) => {
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', rel);
    document.head.appendChild(node);
  }
  node.setAttribute('href', href);
};

const removeManagedSchemas = () => {
  document.head.querySelectorAll('script[data-seo-schema="true"]').forEach((node) => node.remove());
};

const SEO = ({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  schema = [],
}) => {
  useEffect(() => {
    const canonical = `${SITE_URL}${path}`;
    const fullTitle = title?.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const flatDescription = String(description || '').replace(/\s+/g, ' ').trim();
    const trimmedDescription =
      flatDescription.length > 158
        ? `${flatDescription.slice(0, 157).replace(/\s+\S*$/, '')}…`
        : flatDescription;

    document.title = fullTitle;
    upsertMeta('meta[name="description"]', { name: 'description', content: trimmedDescription });
    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large',
    });
    upsertMeta('meta[name="author"]', { name: 'author', content: SITE_NAME });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: trimmedDescription });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: trimmedDescription });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });
    upsertLink('canonical', canonical);

    removeManagedSchemas();
    schema.filter(Boolean).forEach((item) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoSchema = 'true';
      script.textContent = JSON.stringify(item);
      document.head.appendChild(script);
    });
  }, [title, description, path, image, type, noindex, schema]);

  return null;
};

export default SEO;
