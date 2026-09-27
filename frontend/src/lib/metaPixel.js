/**
 * Meta Pixel standard events.
 * Base code (official stub + init + PageView) lives in index.html.
 * Catalog `content_ids` use product slug — same id as metaCatalogFeed.js.
 *
 * @see https://www.facebook.com/business/help/402791146561655
 */

const CURRENCY = 'KES';

function fbTrack(event, params = {}, options) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  try {
    if (options) window.fbq('track', event, params, options);
    else window.fbq('track', event, params);
  } catch (err) {
    console.debug('meta pixel skipped', event, err?.message);
  }
}

const idOf = (obj, ...keys) => {
  for (const k of keys) {
    if (obj?.[k]) return String(obj[k]);
  }
  return undefined;
};

function contentsFromItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((it) => ({
      id: idOf(it, 'slug', 'product_slug', 'productId', 'product_id', 'id'),
      quantity: Number(it.quantity || 1),
      item_price: Number(it.price || it.item_price || 0),
    }))
    .filter((c) => c.id);
}

export function trackViewContent(product, value) {
  if (!product) return;
  const id = idOf(product, 'slug', 'sku', 'id');
  if (!id) return;
  fbTrack('ViewContent', {
    content_ids: [id],
    content_type: 'product',
    content_name: product.name,
    content_category: product.category_name || product.parent_category_name || undefined,
    value: Number(value ?? product.discount_price ?? product.price ?? 0),
    currency: CURRENCY,
  });
}

export function trackAddToCart(item) {
  if (!item) return;
  const id = idOf(item, 'slug', 'productId', 'product_id', 'id');
  if (!id) return;
  const qty = Number(item.quantity || 1);
  const price = Number(item.price || 0);
  fbTrack('AddToCart', {
    content_ids: [id],
    content_type: 'product',
    content_name: item.name,
    value: price * qty,
    currency: CURRENCY,
    contents: [{ id, quantity: qty, item_price: price }],
  });
}

export function trackInitiateCheckout(items, value) {
  const contents = contentsFromItems(items);
  const numItems = contents.reduce((n, c) => n + c.quantity, 0);
  fbTrack('InitiateCheckout', {
    content_ids: contents.map((c) => c.id),
    content_type: 'product',
    contents,
    num_items: numItems || 1,
    value: Number(value ?? contents.reduce((s, c) => s + c.item_price * c.quantity, 0)),
    currency: CURRENCY,
  });
}

export function trackAddPaymentInfo(items, value) {
  const contents = contentsFromItems(items);
  fbTrack('AddPaymentInfo', {
    content_ids: contents.map((c) => c.id),
    content_type: 'product',
    contents,
    value: Number(value ?? contents.reduce((s, c) => s + c.item_price * c.quantity, 0)),
    currency: CURRENCY,
  });
}

export function trackPurchase(order, { eventId } = {}) {
  if (!order) return;
  const items = Array.isArray(order.items) ? order.items : [];
  const contents = contentsFromItems(items);
  fbTrack(
    'Purchase',
    {
      content_ids: contents.map((c) => c.id),
      content_type: 'product',
      contents,
      num_items: contents.reduce((n, c) => n + c.quantity, 0) || 1,
      value: Number(order.total_amount || 0),
      currency: CURRENCY,
    },
    eventId ? { eventID: eventId } : undefined
  );
}

export function trackSearch(searchString, products = []) {
  const q = String(searchString || '').trim();
  if (!q) return;
  const ids = (Array.isArray(products) ? products : [])
    .map((p) => idOf(p, 'slug', 'id'))
    .filter(Boolean)
    .slice(0, 20);
  fbTrack('Search', {
    search_string: q,
    content_ids: ids.length ? ids : undefined,
    content_type: 'product',
  });
}

export function trackCompleteRegistration(method = 'email') {
  fbTrack('CompleteRegistration', { status: true, content_name: method });
}

export function trackContact() {
  fbTrack('Contact');
}

export function trackLead(contentName) {
  fbTrack('Lead', contentName ? { content_name: contentName } : {});
}

export function trackCustomizeProduct(product, { color, size } = {}) {
  if (!product) return;
  const id = idOf(product, 'slug', 'id');
  if (!id) return;
  fbTrack('CustomizeProduct', {
    content_ids: [id],
    content_type: 'product',
    content_name: product.name,
    content_category: [color, size].filter(Boolean).join(' / ') || undefined,
  });
}

export function trackFindLocation() {
  fbTrack('FindLocation');
}

/** Category / collection view — feeds Meta product-group retargeting audiences */
export function trackViewCategory({ name, slug } = {}) {
  if (!name && !slug) return;
  fbTrack('ViewContent', {
    content_type: 'product_group',
    content_name: name || slug,
    content_category: name || slug,
    content_ids: slug ? [String(slug)] : undefined,
    currency: CURRENCY,
  });
}

