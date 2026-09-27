import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { trackProductClick } from './VisitorTracker';
import { launchWhatsAppOrder } from '../lib/whatsappOrder';
import { productCardSrcSet, hasProductImage } from '../utils/cloudinary';

/**
 * Catalog product card — optimized CDN images, skip empty photos.
 */
export default function ProductCard({
  product,
  showSaleTag = false,
  motionProps,
  className = '',
  priority = false,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
}) {
  if (!hasProductImage(product)) return null;

  const Wrapper = motionProps ? motion.div : 'div';
  const wrapProps = motionProps || {};

  const listPrice = parseFloat(product.price ?? 0);
  const salePrice = product.discount_price != null && product.discount_price !== ''
    ? parseFloat(product.discount_price)
    : null;
  const hasSale = salePrice != null && !Number.isNaN(salePrice) && salePrice > 0 && salePrice < listPrice;
  const unitPrice = hasSale ? salePrice : parseFloat(product.discount_price ?? product.price ?? 0);

  const raw = product.thumbnail_optimized || product.thumbnail || product.image_url || '';
  const { src, srcSet } = productCardSrcSet(raw);

  if (!src) return null;

  const handleWhatsAppOrder = (e) => {
    e.preventDefault();
    e.stopPropagation();
    launchWhatsAppOrder(product);
  };

  return (
    <Wrapper
      {...wrapProps}
      className={`group flex flex-col h-full ${motionProps?.className || ''} ${className}`.trim()}
    >
      <Link
        to={`/product/${product.slug}`}
        onClick={() => trackProductClick(product)}
        className="block relative overflow-hidden bg-navy-900/80 aspect-[4/5]"
      >
        <img
          src={src}
          srcSet={srcSet || undefined}
          sizes={sizes}
          alt={product.name || 'Product'}
          width={480}
          height={600}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          className="absolute inset-0 h-full w-full object-cover bg-navy-900 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />

        {(showSaleTag || hasSale || product.is_on_sale) && (
          <span className="absolute top-3 left-3 z-10 bg-white text-navy-950 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em]">
            Sale
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col pt-3.5 pb-1">
        {product.brand_name && (
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-gold-500/45">
            {product.brand_name}
          </p>
        )}

        <Link
          to={`/product/${product.slug}`}
          onClick={() => trackProductClick(product)}
          className="block"
        >
          <h3 className="font-serif text-[14px] sm:text-base text-white leading-snug line-clamp-2 min-h-[2.4rem] group-hover:text-gold-400 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <div className="min-w-0 flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
            <span className="text-sm font-medium tracking-wide text-gold-400 whitespace-nowrap">
              KSh {Number(unitPrice || 0).toLocaleString()}
            </span>
            {hasSale && (
              <span className="text-[10px] sm:text-xs text-navy-300/60 line-through whitespace-nowrap">
                KSh {listPrice.toLocaleString()}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleWhatsAppOrder}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 shrink-0 border border-green-500/70 bg-green-600/95 px-2.5 sm:px-3 py-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.12em] sm:tracking-[0.16em] text-white transition-all hover:bg-green-500 hover:border-green-400 rounded-full"
            aria-label={`Order ${product.name} via WhatsApp`}
          >
            <MessageCircle size={13} strokeWidth={2} className="shrink-0" />
            <span className="hidden xs:inline sm:inline">WhatsApp</span>
            <span className="sm:hidden">Order</span>
          </button>
        </div>
      </div>
    </Wrapper>
  );
}
