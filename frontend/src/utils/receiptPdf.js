// NEW — Shared receipt PDF generator
import { jsPDF } from 'jspdf';
import { formatKES } from '../lib/format';

export const downloadReceiptPdf = (sale, sellerName = 'Staff') => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Prince Esquire', 20, 20);
  doc.setFontSize(10);
  doc.text(`Receipt: ${sale.receipt_number}`, 20, 30);
  doc.text(`Date: ${new Date(sale.created_at).toLocaleString()}`, 20, 36);
  doc.text(`Seller: ${sale.seller?.full_name || sellerName}`, 20, 42);
  doc.text(`Channel: ${sale.channel}`, 20, 48);
  let y = 58;
  (sale.items || []).forEach((item) => {
    const label = `${item.product?.name || 'Item'} x${item.qty}`;
    doc.text(`${label} — ${formatKES(item.subtotal)}`, 20, y);
    y += 6;
  });
  y += 4;
  if (parseFloat(sale.discount_amount) > 0) {
    doc.text(`Discount: -${formatKES(sale.discount_amount)}`, 20, y);
    y += 6;
  }
  doc.setFontSize(12);
  doc.text(`Total: ${formatKES(sale.total_amount)}`, 20, y + 4);
  doc.text(`Payment: ${sale.payment_method}`, 20, y + 12);
  if (sale.mpesa_ref) doc.text(`M-Pesa Ref: ${sale.mpesa_ref}`, 20, y + 18);
  if (sale.is_voided) doc.text(`VOIDED: ${sale.void_reason || ''}`, 20, y + 26);
  doc.text('Thank you for shopping at Prince Esquire', 20, y + 36);
  doc.save(`${sale.receipt_number}.pdf`);
};
