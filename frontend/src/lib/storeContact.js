import { CONTACT_PHONE, SITE_URL } from '../seo/seoData';

/** E.164 without + — Prince Esquire WhatsApp Business */
export const WHATSAPP_NUMBER = (
  import.meta.env.VITE_WHATSAPP_NUMBER || CONTACT_PHONE.replace(/\D/g, '')
).replace(/\D/g, '');

export const MPESA_PAYBILL = (import.meta.env.VITE_MPESA_PAYBILL || '303030').trim();
export const MPESA_ACCOUNT = (import.meta.env.VITE_MPESA_ACCOUNT || 'PSXQ#').trim();
export const MPESA_TILL = (import.meta.env.VITE_MPESA_TILL || '').trim();

export const getMpesaPaymentType = () => {
  if (MPESA_PAYBILL) return 'paybill';
  if (MPESA_TILL) return 'till';
  return 'none';
};

/** A link to the exact product. Encoded, so WhatsApp keeps the whole address clickable. */
function productLink(slug) {
  if (!slug) return null;
  return `${SITE_URL}/product/${encodeURIComponent(slug).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16)}`)}`;
}

/** One-tap WhatsApp order from any product card — no checkout form. */
export function buildWhatsAppProductInquiryUrl({
  product,
  sizeLabel = '',
  variantValue = '',
  quantity = 1,
}) {
  const basePrice = parseFloat(product.price || 0);
  const discount = product.discount_price != null ? parseFloat(product.discount_price) : null;
  const modifier = parseFloat(product.variantPriceModifier || 0);
  const price = (discount ?? basePrice) + modifier;
  const productUrl = productLink(product.slug);

  const lines = [
    'Hello Prince Esquire, I would like to order this item:',
    '',
    'View this exact product:',
    productUrl,
    '',
    `Product: ${product.name}`,
  ];

  if (product.brand_name) lines.push(`Brand: ${product.brand_name}`);
  lines.push(`Price: KSh ${Math.round(price).toLocaleString()}`);
  if (sizeLabel) lines.push(`Size: ${sizeLabel}`);
  if (variantValue) lines.push(`Color / variant: ${variantValue}`);
  if (quantity > 1) lines.push(`Quantity: ${quantity}`);
  lines.push('');
  lines.push('Please confirm availability and delivery.');
  lines.push('Kindly share your M-Pesa payment details (Pay Bill / Till and account number) so I can complete payment.');
  lines.push('');
  lines.push('Thank you!');

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}

/** The whole bag as one WhatsApp order, starting with a link to the first product. */
export function buildWhatsAppCartUrl(items = [], total = 0) {
  const lines = ['Hello Prince Esquire, I would like to place this order:', ''];

  items.forEach((item, index) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const lineTotal = Math.round(Number(item.price || 0) * qty);
    const link = productLink(item.slug || item.product_slug);
    lines.push(`${index + 1}. ${item.name}`);
    if (link) lines.push(link);
    if (item.sizeLabel) lines.push(`Size: ${item.sizeLabel}`);
    const colour = String(item.variantValue || '')
      .replace(` / ${item.sizeLabel}`, '')
      .trim();
    if (colour && colour !== item.sizeLabel) lines.push(`Colour: ${colour}`);
    lines.push(`Qty: ${qty} — KSh ${lineTotal.toLocaleString()}`);
    lines.push('');
  });

  lines.push(`Total: KSh ${Math.round(Number(total) || 0).toLocaleString()}`);
  lines.push('');
  lines.push('Please confirm availability and delivery, and share your M-Pesa payment details. Thank you!');

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export const buildOrderTrackUrl = (orderId, email = '') => {
  const url = new URL(`${SITE_URL}/payment/${orderId}`);
  if (email) url.searchParams.set('email', email.trim().toLowerCase());
  return url.toString();
};

export const buildWhatsAppOrderUrl = ({ order, items = [], trackUrl }) => {
  const addr = typeof order.shipping_address === 'string'
    ? (() => { try { return JSON.parse(order.shipping_address); } catch { return {}; } })()
    : (order.shipping_address || {});

  const name = [addr.first_name, addr.last_name].filter(Boolean).join(' ').trim() || 'Customer';
  const shortId = String(order.id || '').slice(0, 8).toUpperCase();
  const total = Math.round(Number(order.total_amount || 0));

  const itemLines = [];
  if (items.length) {
    for (const item of items) {
      const qty = Number(item.quantity || 1);
      const lineTotal = Math.round(Number(item.price || 0) * qty);
      const size = item.size_label || item.sizeLabel;
      const sizePart = size ? ` · ${size}` : '';
      const slug = item.slug || item.product_slug;
      const productUrl = productLink(slug);

      itemLines.push(`- ${item.name}${sizePart} × ${qty} — KSh ${lineTotal.toLocaleString()}`);
      if (productUrl) itemLines.push(`  View product: ${productUrl}`);
    }
  } else {
    itemLines.push('- (see order link)');
  }

  const lines = [
    'Hello Prince Esquire, I would like to confirm my order:',
    '',
    `Order #${shortId}`,
    `Total: KSh ${total.toLocaleString()}`,
    '',
    `Name: ${name}`,
    `Phone: ${addr.phone || '—'}`,
    `Delivery: ${[addr.line1, addr.city].filter(Boolean).join(', ') || '—'}`,
    '',
    'Items:',
    ...itemLines,
    '',
    `View order: ${trackUrl}`,
  ];

  if (addr.mpesa_code) {
    lines.push('', `M-Pesa confirmation code: ${addr.mpesa_code}`);
  } else if (MPESA_PAYBILL) {
    lines.push('', `I will pay via M-Pesa Pay Bill ${MPESA_PAYBILL}, account ${MPESA_ACCOUNT}.`);
  } else if (MPESA_TILL) {
    lines.push('', `I will pay via M-Pesa to Till ${MPESA_TILL}.`);
  }

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
};
