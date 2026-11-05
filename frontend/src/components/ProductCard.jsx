import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import WhatsAppIcon from './WhatsAppIcon';
import { trackProductClick } from './VisitorTracker';
import { launchWhatsAppOrder } from '../lib/whatsappOrder';
import { productCardSrcSet, hasProductImage, parseProductImages } from '../utils/cloudinary';
import { productImageObjectClass } from '../utils/productImages';
import { getProductMerchBadges, bespokeLeadCopy } from '../utils/merchTags';
import { formatSetContentsLine } from '../lib/setComponents';
import { displayProductName } from '../seo/seoData';

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean).map((v) => String(v).trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, undefined, { numeric: true })
  );
}

function availableSizesAndColors(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const sizes = uniqueSorted(
    variants
      .map((v) => v.size)
      .filter((s) => s && String(s).toLowerCase() !== 'standard')
  );
  const colors = uniqueSorted(variants.map((v) => v.color));
  return { sizes, colors };
}

/** Second gallery photo, shown on hover so shoppers can see another angle without clicking. */
function alternateImageSrc(product, primaryRaw) {
  const gallery = parseProductImages(product?.images);
  const other = gallery
    .map((item) => (typeof item === 'string' ? item : item?.url || item?.optimized || item?.secure_url))
    .find((url) => url && url !== primaryRaw && url !== product?.thumbnail);
  return other ? productCardSrcSet(other).src : null;
}

/** Badge when a product has more colours or gallery angles to choose from. */
function multiOptionLabel(product, colors) {
  if (colors.length > 1) return `${colors.length}+ colours`;
  const gallery = parseProductImages(product?.images);
  const extra = Math.max(0, gallery.length - 1);
  if (extra === 1) return '1 more';
  if (extra > 1) return `${extra} more`;
  return null;
}

/**
 * Catalog product card — optimized CDN images, skip empty photos.
 * Merch badges: New (auto) / Limited / editorial / Bestseller / Bespoke.
 * badgeMode="sale-rail": Bestseller OR Sale (never both) — homepage Sale section only.
 */
export default function ProductCard({
  product,
  motionProps,
  className = '',
  priority = false,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  badgeMode = 'default',
  showVariantMeta = true,
}) {
  if (!hasProductImage(product)) return null;

  const Wrapper = motionProps ? motion.div : 'div';
  const wrapProps = motionProps || {};

  const listPrice = parseFloat(product.price ?? 0);
  const salePrice = product.discount_price != null && product.discount_price !== ''
    ? parseFloat(product.discount_price)
    : null;
  const hasMarkdown = salePrice != null && !Number.isNaN(salePrice) && salePrice > 0 && salePrice < listPrice;
  const unitPrice = hasMarkdown ? salePrice : parseFloat(product.discount_price ?? product.price ?? 0);

  const raw = product.thumbnail_optimized || product.thumbnail || product.image_url || '';
  const { src, srcSet } = productCardSrcSet(raw);
  const hoverSrc = alternateImageSrc(product, raw);
  const objectPos = productImageObjectClass(src || raw);

  if (!src) return null;

  const { primary, secondary } = getProductMerchBadges(product);
  const bespokeLead = bespokeLeadCopy(product);
  const { sizes: availSizes, colors: availColors } = availableSizesAndColors(product);
  const multiLabel = multiOptionLabel(product, availColors);
  const setContentsLine = formatSetContentsLine(product.set_components);
  const isBestseller =
    primary?.id === 'bestseller' ||
    (Array.isArray(product.merch_tags) && product.merch_tags.includes('bestseller'));

  let showPrimary = primary;
  let showSecondary = secondary;
  let saleRailBadge = null;

  if (badgeMode === 'sale-rail') {
    showSecondary = null;
    if (isBestseller) {
      showPrimary = {
        id: 'bestseller',
        label: 'Bestseller',
        href: '/sale#bestsellers',
      };
    } else {
      showPrimary = null;
      saleRailBadge = { id: 'sale', label: 'Sale' };
    }
  }

  const handleWhatsAppOrder = (e) => {
    e.preventDefault();
    e.stopPropagation();
    launchWhatsAppOrder(product);
  };

  const handleMultiOptionOrder = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Open WhatsApp so the customer can ask for the other colour / angle
    launchWhatsAppOrder({
      ...product,
      name: availColors.length > 1
        ? `${product.name} (${availColors.length} colours available)`
        : product.name,
    });
  };

  return (
    <Wrapper
      {...wrapProps}
      className={`group flex h-full flex-col ${motionProps?.className || ''} ${className}`.trim()}
    >
      <div className="relative">
        <Link
          to={`/product/${product.slug}`}
          onClick={() => trackProductClick(product)}
          className="relative block aspect-[3/4] overflow-hidden bg-navy-900/80"
        >
          <img
            src={src}
            srcSet={srcSet || undefined}
            sizes={sizes}
            alt={displayProductName(product.name) || 'Product'}
            width={480}
            height={600}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            className={`absolute inset-0 h-full w-full bg-navy-900 object-cover ${objectPos} transition-transform duration-700 ease-out group-hover:scale-[1.03]`}
          />
          {hoverSrc ? (
            <img
              src={hoverSrc}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className={`absolute inset-0 hidden h-full w-full bg-navy-900 object-cover ${objectPos} opacity-0 transition-opacity duration-500 group-hover:opacity-100 lg:block`}
            />
          ) : null}
        </Link>

        {(showPrimary || showSecondary || saleRailBadge || multiLabel) ? (
          <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex items-start justify-between gap-2">
            <div className="flex max-w-[70%] flex-col items-start gap-1.5">
              {saleRailBadge ? (
                <span className="bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-950">
                  {saleRailBadge.label}
                </span>
              ) : null}
              {showPrimary ? (
                showPrimary.href ? (
                  <Link
                    to={showPrimary.href}
                    className="pointer-events-auto bg-navy-950/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-300 ring-1 ring-gold-500/40 backdrop-blur-sm transition-colors hover:bg-gold-500 hover:text-navy-950"
                  >
                    {showPrimary.label}
                  </Link>
                ) : (
                  <span className="bg-navy-950/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-300 ring-1 ring-gold-500/40 backdrop-blur-sm">
                    {showPrimary.label}
                  </span>
                )
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {showSecondary ? (
                <span className="bg-gold-500/15 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-gold-200 ring-1 ring-gold-500/25">
                  {showSecondary.label}
                </span>
              ) : null}
              {multiLabel ? (
                <button
                  type="button"
                  onClick={handleMultiOptionOrder}
                  className="pointer-events-auto bg-navy-950/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-gold-500 hover:text-navy-950 hover:ring-gold-400"
                  aria-label={`${multiLabel} — order via WhatsApp`}
                >
                  {multiLabel}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col pb-1 pt-3.5">
        {product.brand_name && (
          <p className="mb-1 truncate text-[11px] font-medium uppercase tracking-[0.16em] text-gold-300/90">
            {product.brand_name}
          </p>
        )}

        <Link
          to={`/product/${product.slug}`}
          onClick={() => trackProductClick(product)}
          className="block"
        >
          <h3 className="min-h-[2.4rem] font-serif text-[15px] font-medium leading-snug text-white line-clamp-2 transition-colors group-hover:text-gold-300 sm:text-[17px]">
            {displayProductName(product.name)}
          </h3>
        </Link>

        {setContentsLine ? (
          <p className="mt-1.5 font-sans text-xs leading-snug text-navy-200 line-clamp-2">
            {setContentsLine}
          </p>
        ) : null}

        {showVariantMeta && (availSizes.length > 0 || availColors.length > 0) ? (
          <p className="mt-1.5 truncate font-sans text-xs text-navy-200">
            {availSizes.length > 0 ? `Sizes ${availSizes.join(', ')}` : null}
            {availSizes.length > 0 && availColors.length > 1 ? ' · ' : null}
            {availColors.length > 1 ? `${availColors.length} colours` : null}
          </p>
        ) : null}

        <div className="mt-auto flex flex-col gap-1.5 pt-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <span className="whitespace-nowrap text-[15px] font-semibold tracking-wide text-gold-300">
                KSh {Number(unitPrice || 0).toLocaleString()}
              </span>
              {hasMarkdown && (
                <span className="whitespace-nowrap text-xs text-navy-200 line-through">
                  KSh {listPrice.toLocaleString()}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleWhatsAppOrder}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-[#1ebe5d] active:scale-90"
              aria-label={`Order ${product.name} via WhatsApp`}
            >
              <WhatsAppIcon size={22} className="shrink-0" />
            </button>
          </div>
          {bespokeLead ? (
            <p className="font-sans text-xs text-gold-300/80">
              {bespokeLead}
            </p>
          ) : null}
        </div>
      </div>
    </Wrapper>
  );
}
