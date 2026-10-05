import { buildWhatsAppProductInquiryUrl } from './storeContact';
import { trackWhatsAppOrderClick } from '../components/VisitorTracker';
import { trackViewContent, trackAddToCart, trackInitiateCheckout, trackContact, trackPurchase } from './metaPixel';

/**
 * One-tap WhatsApp order from any product card.
 * Fires the full Meta funnel (ViewContent -> AddToCart -> Purchase, deduped
 * per product per session) plus internal analytics, then opens WhatsApp.
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
    trackPurchase(
      {
        id: evtKey,
        total_amount: unitPrice * qty,
        items: [{ product_slug: product.slug, quantity: qty, price: unitPrice, name: product.name }],
      },
      { eventId: evtKey }
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
