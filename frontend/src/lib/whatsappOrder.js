import { buildWhatsAppProductInquiryUrl } from './storeContact';
import { trackWhatsAppOrderClick } from '../components/VisitorTracker';
import { trackViewContent, trackAddToCart, trackPurchase } from './metaPixel';

/**
 * One-tap WhatsApp order from any product card.
 * Fires the full Meta funnel (ViewContent -> AddToCart -> Purchase, deduped
 * per product per session) plus internal analytics, then opens WhatsApp.
 */
export function launchWhatsAppOrder(product) {
  const unitPrice = parseFloat(product.discount_price ?? product.price ?? 0);

  trackWhatsAppOrderClick(product, {});
  trackViewContent(product, unitPrice);

  const evtKey = `pe_wa_${product.slug || product.id}`;
  if (typeof sessionStorage === 'undefined' || !sessionStorage.getItem(evtKey)) {
    try { sessionStorage.setItem(evtKey, '1'); } catch { /* ignore */ }
    trackAddToCart({
      slug: product.slug,
      id: product.id,
      name: product.name,
      price: unitPrice,
      quantity: 1,
    });
    trackPurchase(
      {
        id: evtKey,
        total_amount: unitPrice,
        items: [{ product_slug: product.slug, quantity: 1, price: unitPrice, name: product.name }],
      },
      { eventId: evtKey }
    );
  }

  const url = buildWhatsAppProductInquiryUrl({
    product: { ...product, price: unitPrice },
  });
  window.open(url, '_blank', 'noopener,noreferrer');
}
