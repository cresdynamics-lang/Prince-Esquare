/** Shared helpers for admin order display (payment labels, addresses). */

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

export function formatPaymentLabel(method) {
  if (!method) return 'Unknown';
  const labels = {
    whatsapp_mpesa: 'M-Pesa (WhatsApp)',
    mpesa: 'M-Pesa',
    stk: 'M-Pesa STK',
    card: 'Card',
    cash: 'Cash',
    pos: 'POS',
    paybill: 'Paybill',
  };
  return labels[method] || String(method).replace(/_/g, ' ');
}

export function parseOrderAddress(address) {
  if (!address) return null;
  if (typeof address === 'string') {
    try {
      return JSON.parse(address);
    } catch {
      return { line1: address };
    }
  }
  return address;
}

/** Real customer phone from list/detail API or shipping JSON. */
export function orderCustomerPhone(order) {
  if (!order) return '';
  const addr = parseOrderAddress(order.shipping_address);
  return String(
    order.customer_phone || addr?.phone || order.user_phone || ''
  ).trim();
}

/** Prefer registered email; hide generated guest placeholders when phone exists. */
export function orderCustomerEmail(order) {
  if (!order) return '';
  const addr = parseOrderAddress(order.shipping_address);
  const email = String(
    order.customer_email || addr?.email || ''
  ).trim();
  if (!email) return '';
  if (/@guest\.prince-esquire/i.test(email)) return '';
  return email;
}

/** Phone, email, or both for admin tables and modals. */
export function formatOrderContact(order) {
  const phone = orderCustomerPhone(order);
  const email = orderCustomerEmail(order);
  if (phone && email) return `${phone} · ${email}`;
  return phone || email || '';
}
