import { CONTACT_PHONE, SITE_URL } from '../seo/seoData';

/** E.164 without + — default Prince Esquire WhatsApp */
export const WHATSAPP_NUMBER = (
  import.meta.env.VITE_WHATSAPP_NUMBER || CONTACT_PHONE.replace(/\D/g, '')
).replace(/\D/g, '');

/** Lipa na M-Pesa till — set VITE_MPESA_TILL in .env */
export const MPESA_TILL = (import.meta.env.VITE_MPESA_TILL || '').trim();

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
        return `- ${item.name}${size} × ${qty} — KSh ${lineTotal.toLocaleString()}`;
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
  } else if (MPESA_TILL) {
    lines.push('', `I will pay via M-Pesa to Till ${MPESA_TILL}.`);
  }

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
};
