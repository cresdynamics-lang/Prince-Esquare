/**
 * Meta (Facebook) Pixel standard-event helpers.
 * The base pixel (init + PageView) lives in index.html. These helpers fire the
 * commerce events Meta expects: ViewContent, AddToCart and Purchase.
 *
 * content_ids use the product slug because the Meta catalogue feed
 * (metaCatalogFeed.js) exposes each item with `id: product.slug`.
 */

const CURRENCY = 'KES';

function fbTrack(event, params = {}, options) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  try {
    if (options) window.fbq('track', event, params, options);
    else window.fbq('track', event, params);
  } catch (err) {
    // Never let analytics break the storefront.
    console.debug('meta pixel skipped', event, err?.message);
  }
}

const idOf = (obj, ...keys) => {
  for (const k of keys) {
    if (obj?.[k]) return String(obj[k]);
  }
  return undefined;
};

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

export function trackPurchase(order, { eventId } = {}) {
  if (!order) return;
  const items = Array.isArray(order.items) ? order.items : [];
  const contents = items.map((it) => ({
    id: idOf(it, 'product_slug', 'slug', 'product_id', 'id') || 'unknown',
    quantity: Number(it.quantity || 1),
    item_price: Number(it.price || 0),
  }));
  fbTrack(
    'Purchase',
    {
      content_ids: contents.map((c) => c.id),
      content_type: 'product',
      contents,
      num_items: items.reduce((n, it) => n + Number(it.quantity || 1), 0) || 1,
      value: Number(order.total_amount || 0),
      currency: CURRENCY,
    },
    eventId ? { eventID: eventId } : undefined
  );
}
