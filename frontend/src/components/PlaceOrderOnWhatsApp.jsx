import WhatsAppIcon from './WhatsAppIcon';
import { useCartStore } from '../store/useCartStore';
import { launchWhatsAppCartOrder } from '../lib/whatsappOrder';

/** Sends the whole bag to WhatsApp, with a link to each exact product. No form to fill. */
export default function PlaceOrderOnWhatsApp({ className = '' }) {
  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);

  return (
    <button
      type="button"
      disabled={items.length === 0}
      onClick={() => launchWhatsAppCartOrder(items, getTotal())}
      className={`flex min-h-14 w-full touch-manipulation items-center justify-center gap-2.5 bg-[#25D366] px-5 py-4 font-sans text-xs font-bold uppercase tracking-[0.14em] text-white transition-[background-color,transform] duration-150 hover:bg-[#1ebe5d] active:scale-[0.98] disabled:opacity-50 ${className}`}
    >
      <WhatsAppIcon size={22} className="shrink-0" />
      Place Order on WhatsApp
    </button>
  );
}
