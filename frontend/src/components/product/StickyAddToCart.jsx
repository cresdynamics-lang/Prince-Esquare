import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Plus, MessageCircle } from 'lucide-react';

const StickyAddToCart = ({
  visible,
  productName,
  variantSummary,
  displayPrice,
  compareAtPrice,
  image,
  addedToCart,
  disabled,
  onAddToCart,
  onBuyNow,
  onWhatsAppOrder,
  ctaLabel = 'Add to cart',
}) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className="fixed bottom-3 md:bottom-5 left-3 right-3 z-50 flex justify-center pointer-events-none"
        role="region"
        aria-label="Quick purchase options"
      >
        <div className="pointer-events-auto w-full max-w-3xl rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)] px-3 py-3 md:px-4 md:py-3.5">
          <div className="flex items-center gap-3 md:gap-4">
            {image && (
              <div className="shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
                <img src={image} alt="" className="w-full h-full object-cover object-top" />
              </div>
            )}

            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] md:text-sm font-semibold text-navy-950 truncate leading-tight">
                {productName}
              </p>
              {variantSummary && (
                <p className="text-[11px] md:text-xs text-slate-500 truncate mt-0.5">{variantSummary}</p>
              )}
              <p className="text-[12px] font-medium text-navy-950 mt-0.5">
                KSh {Number(displayPrice || 0).toLocaleString()}
                {compareAtPrice != null && compareAtPrice > displayPrice && (
                  <span className="ml-2 text-[11px] text-slate-400 line-through font-normal">
                    KSh {Number(compareAtPrice).toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onAddToCart}
              disabled={disabled}
              className={`flex items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.08em] transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                addedToCart
                  ? 'bg-green-600 text-white'
                  : 'bg-navy-950 text-white hover:bg-navy-900'
              }`}
            >
              <span className="relative shrink-0">
                <ShoppingBag size={14} strokeWidth={2} />
                {!addedToCart && (
                  <Plus size={8} strokeWidth={3} className="absolute -top-0.5 -right-1 bg-white text-navy-950 rounded-full" />
                )}
              </span>
              <span className="truncate">{addedToCart ? 'Added' : ctaLabel}</span>
            </button>

            <button
              type="button"
              onClick={onBuyNow}
              disabled={disabled}
              className="flex items-center justify-center rounded-full px-2 py-2.5 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.08em] bg-gold-600 text-navy-950 hover:bg-gold-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Buy Now
            </button>

            <button
              type="button"
              onClick={onWhatsAppOrder}
              disabled={disabled}
              className="flex items-center justify-center gap-1 rounded-full px-2 py-2.5 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.06em] bg-[#25D366] text-white hover:bg-[#1ebe57] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <MessageCircle size={14} className="shrink-0" />
              <span className="truncate">WhatsApp</span>
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default StickyAddToCart;
