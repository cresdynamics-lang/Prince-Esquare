// MODIFIED — POS receipt modal with PDF
import { formatKES } from '../../lib/format';
import { downloadReceiptPdf } from '../../utils/receiptPdf';

const PosReceiptModal = ({ sale, sellerName, onClose }) => {
  const downloadPdf = () => downloadReceiptPdf(sale, sellerName);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full text-[#0a0f1e]">
        <h2 className="text-xl font-bold">Sale complete</h2>
        <p className="text-sm text-gray-500 mt-1">{sale.receipt_number}</p>
        <ul className="mt-4 space-y-2 text-sm max-h-48 overflow-y-auto">
          {sale.items?.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>{item.product?.name} × {item.qty}</span>
              <span>{formatKES(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <p className="font-bold text-lg mt-4">{formatKES(sale.total_amount)}</p>
        <div className="flex gap-3 mt-6">
          <button onClick={() => window.print()} className="flex-1 border rounded-lg py-2">Print</button>
          <button onClick={downloadPdf} className="flex-1 bg-[#b8922a] rounded-lg py-2 font-medium">Download PDF</button>
          <button onClick={onClose} className="flex-1 bg-gray-100 rounded-lg py-2">Close</button>
        </div>
      </div>
    </div>
  );
};

export default PosReceiptModal;
