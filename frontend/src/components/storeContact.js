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

function absoluteImageUrl(thumbnail) {
  if (!thumbnail) return `${SITE_URL}/LOGO.jpeg`;
  if (String(thumbnail).startsWith('http')) return String(thumbnail);
  return `${SITE_URL}${String(thumbnail).startsWith('/') ? '' : '/'}${thumbnail}`;
}

function resolveProductImage(product) {
  const candidates = [
    product?.thumbnail,
    product?.thumbnail_optimized,
    product?.image_url,
  ];
  const images = product?.images;
  if (Array.isArray(images) && images.length) {
    const first = images[0];
    candidates.push(typeof first === 'string' ? first : first?.url || first?.secure_url || first?.optimized);
  }
  const hit = candidates.find((c) => typeof c === 'string' && c.trim().length > 4);
  return absoluteImageUrl(hit);
}

/** One-tap WhatsApp inquiry from the Sale page — no checkout form. */
export function buildWhatsAppProductInquiryUrl({
  product,
  sizeLabel = '',
  variantValue = '',
  quantity = 1,
}) {
  const basePrice = parseFloat(product.price || 0);
  const modifier = parseFloat(product.variantPriceModifier || 0);
  const price = basePrice + modifier;
  const productUrl = `${SITE_URL}/product/${product.slug}`;
  const imageUrl = resolveProductImage(product);

  const lines = [
    "Hello Prince Esquire, I'm interested in this item from your Sale page:",
    '',
    `Product: ${product.name}`,
  ];

  if (product.brand_name) lines.push(`Brand: ${product.brand_name}`);
  lines.push(`Price: KSh ${Math.round(price).toLocaleString()}`);
  if (sizeLabel) lines.push(`Size: ${sizeLabel}`);
  if (variantValue) lines.push(`Color / variant: ${variantValue}`);
  if (quantity > 1) lines.push(`Quantity: ${quantity}`);
  lines.push(`Product link: ${productUrl}`);
  lines.push(`Product image: ${imageUrl}`);
  lines.push('');
  lines.push('Please confirm availability and delivery. Thank you!');

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

  const itemLines = items.length
    ? items.map((item) => {
        const qty = Number(item.quantity || 1);
        const lineTotal = Math.round(Number(item.price || 0) * qty);
        const size = item.size_label ? ` · ${item.size_label}` : '';
        const slug = item.slug || item.product_slug;
        const productUrl = slug ? `${SITE_URL}/product/${slug}` : null;
        const linkPart = productUrl ? `\n  ${productUrl}` : '';
        return `- ${item.name}${size} × ${qty} — KSh ${lineTotal.toLocaleString()}${linkPart}`;
      })
    : ['- (see order link)'];

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
