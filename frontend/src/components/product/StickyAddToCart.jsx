import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Plus } from 'lucide-react';

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
}) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className="fixed bottom-4 md:bottom-6 left-4 right-4 z-50 flex justify-center pointer-events-none"
        role="region"
        aria-label="Quick add to cart"
      >
        <div className="pointer-events-auto w-full max-w-3xl flex items-center gap-3 md:gap-4 bg-white rounded-full border border-slate-200/80 shadow-[0_8px_40px_rgba(0,0,0,0.18)] px-3 py-2.5 md:px-4 md:py-3">
          {image && (
            <div className="shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
              <img src={image} alt="" className="w-full h-full object-contain p-0.5" />
            </div>
          )}

          <div className="flex-1 min-w-0 text-left">
            <p className="text-[13px] md:text-sm font-semibold text-navy-950 truncate leading-tight">
              {productName}
            </p>
            {variantSummary && (
              <p className="text-[11px] md:text-xs text-slate-500 truncate mt-0.5">{variantSummary}</p>
            )}
            <p className="sm:hidden text-[12px] font-medium text-navy-950 mt-0.5">
              KSh{displayPrice.toLocaleString()}
            </p>
          </div>

          <div className="hidden sm:block shrink-0 text-right">
            <p className="text-sm font-medium text-navy-950 whitespace-nowrap">
              KSh{displayPrice.toLocaleString()}
            </p>
            {compareAtPrice != null && compareAtPrice > displayPrice && (
              <p className="text-[11px] text-slate-400 line-through whitespace-nowrap">
                KSh{compareAtPrice.toLocaleString()}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onAddToCart}
            disabled={disabled}
            className={`shrink-0 flex items-center justify-center gap-2 rounded-full px-4 md:px-5 py-2.5 md:py-3 text-[12px] md:text-[13px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              addedToCart
                ? 'bg-green-600 text-white'
                : 'bg-navy-950 text-white hover:bg-navy-900'
            }`}
          >
            <span className="relative">
              <ShoppingBag size={16} strokeWidth={2} />
              {!addedToCart && (
                <Plus size={9} strokeWidth={3} className="absolute -top-0.5 -right-1.5 bg-white text-navy-950 rounded-full" />
              )}
            </span>
            <span className="whitespace-nowrap">{addedToCart ? 'Added' : 'Add to cart'}</span>
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default StickyAddToCart;
