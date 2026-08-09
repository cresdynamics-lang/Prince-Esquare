/**
 * WhatsApp checkout utility
 * Generates order message and sends via WhatsApp
 */

export const WHATSAPP_BUSINESS_NUMBER = '254724494089'; // Prince Esquire business number

/**
 * Format order items for WhatsApp message
 * @param {Array} items - Cart items
 * @param {Object} totals - Order totals
 * @returns {string} Formatted message
 */
export const generateOrderMessage = (items, totals, customerName = '') => {
  const header = `*PRINCE ESQUIRE ORDER*\n${customerName ? `📦 Customer: ${customerName}\n` : ''}`;
  
  const itemsList = items
    .map((item) => {
      const itemTotal = item.price * item.quantity;
      return `• ${item.name}\n  Qty: ${item.quantity} × KSh ${item.price.toLocaleString()}\n  Subtotal: KSh ${itemTotal.toLocaleString()}`;
    })
    .join('\n\n');

  const summary = `
*ORDER SUMMARY*
━━━━━━━━━━━━━━━━━━━━━━
Subtotal: KSh ${totals.subtotal.toLocaleString()}
VAT (16%): KSh ${totals.tax.toLocaleString()}
Shipping: KSh ${totals.shipping.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━
*TOTAL: KSh ${totals.total.toLocaleString()}*

📍 Shop: prince-esquire.co.ke
💬 Reply to confirm order`;

  return `${header}\n\n${itemsList}\n${summary}`;
};

/**
 * Send order to WhatsApp
 * @param {string} message - Order message text
 * @param {string} phoneNumber - Customer phone (optional, for context)
 * @returns {void} Opens WhatsApp
 */
export const sendOrderToWhatsApp = (message, phoneNumber = '') => {
  const encodedMessage = encodeURIComponent(message);
  const waURL = `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodedMessage}`;
  window.open(waURL, '_blank', 'noopener,noreferrer');
};

/**
 * Build WhatsApp link for checkout
 * @param {Array} items - Cart items
 * @param {Object} totals - Order totals
 * @param {string} customerName - Customer name
 * @returns {string} WhatsApp link
 */
export const buildWhatsAppCheckoutLink = (items, totals, customerName = '') => {
  const message = generateOrderMessage(items, totals, customerName);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodedMessage}`;
};
