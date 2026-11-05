import { buildWhatsAppCartUrl, buildWhatsAppProductInquiryUrl } from './storeContact';
import { trackWhatsAppOrderClick } from '../components/VisitorTracker';
import { trackViewContent, trackAddToCart, trackInitiateCheckout, trackContact } from './metaPixel';

/**
 * One-tap WhatsApp order from any product card.
 * Reports interest to Meta (ViewContent, Contact, and AddToCart once per product per
 * session) plus internal analytics, then opens WhatsApp. Never a Purchase: a tap is
 * not a sale, and false purchases mislead ad reporting and optimisation.
 */
export function launchWhatsAppOrder(
  product,
  { sizeLabel = '', variantValue = '', quantity = 1 } = {}
) {
  const unitPrice = parseFloat(product.discount_price ?? product.price ?? 0);
  const qty = Math.max(1, Number(quantity) || 1);

  trackWhatsAppOrderClick(product, { sizeLabel });
  trackViewContent(product, unitPrice);
  trackContact();

  const evtKey = `pe_wa_${product.slug || product.id}`;
  if (typeof sessionStorage === 'undefined' || !sessionStorage.getItem(evtKey)) {
    try { sessionStorage.setItem(evtKey, '1'); } catch { /* ignore */ }
    trackAddToCart({
      slug: product.slug,
      id: product.id,
      name: product.name,
      price: unitPrice,
      quantity: qty,
    });
    trackInitiateCheckout(
      [{ slug: product.slug, quantity: qty, price: unitPrice }],
      unitPrice * qty
    );
  }

  const url = buildWhatsAppProductInquiryUrl({
    product: { ...product, price: unitPrice },
    sizeLabel,
    variantValue,
    quantity: qty,
  });
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** Sends the whole bag to WhatsApp. No purchase is reported, because none has happened yet. */
export function launchWhatsAppCartOrder(items, total) {
  if (!items?.length) return;
  items.forEach((item) => {
    trackWhatsAppOrderClick({ id: item.productId, slug: item.slug, name: item.name }, { sizeLabel: item.sizeLabel });
  });
  trackContact();
  trackInitiateCheckout(items, total);
  window.open(buildWhatsAppCartUrl(items, total), '_blank', 'noopener,noreferrer');
}
