import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShoppingBag, Plus, Minus, ChevronLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import ProductDescription from '../components/product/ProductDescription';
import StickyAddToCart from '../components/product/StickyAddToCart';
import { useCartStore } from '../store/useCartStore';
import { productAPI } from '../services/api';
import { getPremiumImage } from '../utils/productImages';
import { getImageSrc, parseProductImages } from '../utils/cloudinary';
import { parseAngleImages, getDefaultAngleImage } from '../utils/angleImages';
import { buildVariantMeta, buildRichDescription, sortSizes } from '../utils/productDescription';
import { buildBreadcrumbSchema, buildProductSchema } from '../seo/seoData';
import { toCartVariantId } from '../utils/ids';

const variantStockQty = (variant) => {
  if (!variant) return null;
  const stock = variant.stock_quantity ?? variant.stock;
  return stock == null ? null : Number(stock);
};

const isVariantAvailable = (variant) => {
  const stock = variantStockQty(variant);
  return stock == null || stock > 0;
};

function sizesForCategoryName(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('shoe')) return ['38', '39', '40', '41', '42', '43', '44', '45'];
  if (n.includes('trouser') || n.includes('pant')) return ['30', '32', '34', '36', '38'];
  if (n.includes('shirt')) return ['M', 'L', 'XL', 'XXL', '3XL'];
  if (n.includes('track')) return ['M', 'L', 'XL', 'XXL'];
  if (n.includes('outer')) return ['M', 'L', 'XL', 'XXL'];
  return ['M', 'L', 'XL', 'XXL'];
}

const getVariantImage = (variant) => (
  variant?.image_url_optimized ||
  getImageSrc(variant?.image_url) ||
  variant?.image_url ||
  getImageSrc(variant?.image)
);

const getProductBaseImage = (product) => (
  product?.thumbnail_optimized ||
  getImageSrc(product?.thumbnail) ||
  getImageSrc(product?.image_url) ||
  product?.thumbnail ||
  product?.image_url
);

const enrichShoeVariants = (variants, categoryName) => {
  const isShoe = (categoryName || '').toLowerCase().includes('shoe');
  const hasOnlyGenericSizes = variants.length > 0 && variants.every((v) => !v.size || v.size === 'Standard');
  if (!isShoe || !hasOnlyGenericSizes) return variants;

  const categorySizes = sizesForCategoryName(categoryName);
  const enriched = [];
  variants.forEach((v) => {
    categorySizes.forEach((size) => {
      enriched.push({ ...v, size });
    });
  });
  return enriched;
};

const buildThumbnailStrip = (product, currentVariant) => {
  if (!product) return [];

  const seen = new Set();
  const add = (items, item) => {
    const src = item.src || '';
    if (!src || seen.has(src)) return items;
    seen.add(src);
    return [...items, item];
  };

  let strip = [];

  const angles = parseAngleImages(currentVariant, product);
  angles.forEach((angle) => {
    strip = add(strip, {
      id: `angle-${angle.angle}`,
      src: angle.url,
      thumb: angle.thumb || angle.url,
      label: angle.label,
      type: 'angle',
    });
  });

  const base = getDefaultAngleImage(currentVariant, product) || getVariantImage(currentVariant) || getProductBaseImage(product);
  if (base) {
    strip = add(strip, {
      id: 'hero',
      src: base,
      thumb: getImageSrc(currentVariant?.image_url, 'thumbnail') || base,
      label: product.name,
      type: 'main',
    });
  }

  parseProductImages(product.images).forEach((image, index) => {
    strip = add(strip, {
      id: `gallery-${index}`,
      src: getImageSrc(image),
      thumb: getImageSrc(image, 'thumbnail'),
      label: `${product.name} view ${index + 1}`,
      type: 'gallery',
    });
  });

  const colorSeen = new Set();
  (product.variants || []).forEach((variant) => {
    const color = variant.color || 'Original';
    if (colorSeen.has(color)) return;
    const src = getVariantImage(variant);
    if (!src) return;
    colorSeen.add(color);
    strip = add(strip, {
      id: `color-${color}`,
      src,
      thumb: getImageSrc(variant.image_url, 'thumbnail') || src,
      label: color,
      type: 'color',
      color,
    });
  });

  return strip;
};

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const addToCart = useCartStore((state) => state.addToCart);
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loadError, setLoadError] = useState('');

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImage, setSelectedImage] = useState('');

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showStickyCart, setShowStickyCart] = useState(false);

  const relatedSectionRef = useRef(null);

  const variantMeta = useMemo(() => {
    if (!product) return { colors: [], variants: [], isShoe: false };
    return buildVariantMeta(product.variants, product.category_name);
  }, [product]);

  const sizesForColor = useCallback((color) => {
    const sizes = variantMeta.variants
      .filter((v) => v.color === color)
      .map((v) => v.size);
    return sortSizes(sizes, variantMeta.isShoe);
  }, [variantMeta]);

  const findVariant = useCallback((color, size) => (
    variantMeta.variants.find((v) => v.color === color && v.size === size)
  ), [variantMeta]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoadError('');
      setProduct(null);
      setSelectedColor('');
      setSelectedSize('');
      setSelectedImage('');

      let found = null;
      try {
        const res = await productAPI.getBySlug(slug);
        if (res.data?.success && res.data.data) {
          found = res.data.data;
        }
      } catch (error) {
        console.error('Product fetch failed:', error);
      }

      if (!found) {
        setLoadError('Product not found.');
        return;
      }

      const enrichedVariants = enrichShoeVariants(found.variants || [], found.category_name);
      const metaForDesc = buildVariantMeta(enrichedVariants, found.category_name);
      const richDescription = buildRichDescription(
        { ...found, variants: enrichedVariants },
        metaForDesc
      );
      const p = {
        ...found,
        thumbnail: found.thumbnail || found.image_url,
        description: richDescription,
        variants: enrichedVariants,
      };

      let rel = [];
      try {
        const relRes = await productAPI.related(found.id);
        rel = relRes.data.data || [];
      } catch {
        console.error('Could not fetch related products');
      }

      const meta = buildVariantMeta(p.variants, p.category_name);
      const urlVariantId = searchParams.get('variant');
      const urlVariant = urlVariantId
        ? meta.variants.find((v) => String(v.id) === urlVariantId)
        : null;

      const firstColor = urlVariant?.color || meta.colors[0]?.color || '';
      const sizes = sortSizes(
        meta.variants.filter((v) => v.color === firstColor).map((v) => v.size),
        meta.isShoe
      );
      const firstSize = urlVariant?.size || sizes[0] || '';
      const initialVariant = meta.variants.find((v) => v.color === firstColor && v.size === firstSize) || meta.variants[0];

      if (initialVariant) {
        setSelectedColor(initialVariant.color);
        setSelectedSize(initialVariant.size);
        setSelectedImage(
          getDefaultAngleImage(initialVariant, p) ||
          getVariantImage(initialVariant) ||
          getProductBaseImage(p) ||
          getPremiumImage(p)
        );
        if (initialVariant.id) {
          setSearchParams({ variant: String(initialVariant.id) }, { replace: true });
        }
      }

      setProduct(p);
      setRelated(rel);
    };

    fetchProduct();
  }, [slug]);

  useEffect(() => {
    const relatedEl = relatedSectionRef.current;
    if (!relatedEl || related.length === 0) {
      setShowStickyCart(false);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCart(entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px 0px 0px' }
    );

    observer.observe(relatedEl);
    return () => observer.disconnect();
  }, [product, related.length]);

  const currentVariant = findVariant(selectedColor, selectedSize) || variantMeta.variants[0];

  const thumbnailStrip = useMemo(
    () => buildThumbnailStrip(product, currentVariant),
    [product, currentVariant]
  );

  const currentDisplayImage = selectedImage ||
    thumbnailStrip[0]?.src ||
    getProductBaseImage(product) ||
    getPremiumImage(product);

  const basePrice = product ? parseFloat(product.price) : 0;
  const saleBase = product?.discount_price ? parseFloat(product.discount_price) : null;
  const modifier = parseFloat(currentVariant?.price_modifier || 0);
  const displayPrice = (saleBase ?? basePrice) + modifier;
  const compareAtPrice = saleBase != null ? basePrice + modifier : null;

  const variantSummary = [selectedColor, selectedSize].filter(Boolean).join(' / ');

  const parsedColorList = variantMeta.colors.map((c) => c.color);
  const allSizes = sortSizes(
    variantMeta.variants.map((v) => v.size),
    variantMeta.isShoe
  );
  const sizeLine = variantMeta.isShoe
    ? `EU ${allSizes[0]} – ${allSizes[allSizes.length - 1]}`
    : allSizes.join(' · ');

  const buildPayload = () => ({
    productId: product?.id,
    variantId: toCartVariantId(currentVariant?.id),
    quantity,
    sizeLabel: selectedSize,
    colorLabel: selectedColor,
    name: product?.name,
    price: displayPrice,
    image: currentDisplayImage,
    slug: product?.slug,
    brandName: product?.brand_name,
    variantValue: variantSummary,
  });

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    const sizes = sizesForColor(color);
    const inStockSizes = sizes.filter((s) => isVariantAvailable(findVariant(color, s)));
    const keepSize = inStockSizes.includes(selectedSize) ? selectedSize : null;
    const nextSize = keepSize || inStockSizes[0] || sizes[0] || '';
    setSelectedSize(nextSize);
    const variant = findVariant(color, nextSize);
    if (variant) {
      setSelectedImage(
        getDefaultAngleImage(variant, product) ||
        getVariantImage(variant)
      );
      if (variant.id) {
        setSearchParams({ variant: String(variant.id) }, { replace: true });
      }
    }
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    const variant = findVariant(selectedColor, size);
    if (variant) {
      setSelectedImage(
        getDefaultAngleImage(variant, product) ||
        getVariantImage(variant)
      );
      if (variant.id) {
        setSearchParams({ variant: String(variant.id) }, { replace: true });
      }
    }
  };

  const availableSizes = sizesForColor(selectedColor);
  const hasVariants = variantMeta.variants.length > 0;
  const showColorPicker = variantMeta.colors.length > 1
    || (variantMeta.colors.length === 1 && variantMeta.colors[0]?.color
      && !['original', 'standard', 'default'].includes(variantMeta.colors[0].color.toLowerCase()));
  const hasMultipleColors = showColorPicker;
  const shopOutOfStock = product?.is_active === false || (
    hasVariants
      ? !currentVariant || !isVariantAvailable(currentVariant)
      : (product?.stock_quantity ?? 0) <= 0
  );

  const handleAddToCart = async () => {
    if (!product || shopOutOfStock) return;
    await addToCart(buildPayload());
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleBuyNow = async () => {
    if (!product || shopOutOfStock) return;
    await addToCart(buildPayload());
    navigate('/checkout');
  };

  if (loadError) {
    return (
      <div className="min-h-screen pt-32 text-center text-white bg-navy-950 font-serif">
        {loadError}
        <Link to="/products" className="block mt-4 text-gold-500 underline uppercase tracking-widest text-[10px]">
          Back to products
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-32 text-center text-gold-500 bg-navy-950 font-serif text-[10px] uppercase tracking-widest">
        Loading…
      </div>
    );
  }

  return (
    <div className="bg-navy-950 min-h-screen">
      <SEO
        title={`${product.name} Kenya`}
        description={`Shop ${product.name} at Prince Esquire Kenya. Discover premium styling, curated detail and Nairobi delivery for luxury wardrobes. Order today.`}
        path={`/product/${product.slug}`}
        type="product"
        image={currentDisplayImage}
        keywords={[product.name, product.brand_name, product.category_name, 'luxury fashion Kenya'].filter(Boolean)}
        schema={[
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: product.category_name || 'Products', path: '/products' },
            { name: product.name, path: `/product/${product.slug}` },
          ]),
          buildProductSchema(product, currentDisplayImage, displayPrice),
        ]}
      />
      <Navbar />

      <main className={`pt-24 pb-24 transition-[padding] ${showStickyCart ? 'pb-28 md:pb-32' : ''}`}>
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex items-center space-x-4 mb-8">
            <button type="button" onClick={() => navigate(-1)} className="text-gold-500 hover:text-gold-200 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <span className="text-[10px] uppercase tracking-widest text-gold-600/50">Back</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Gallery — pins on desktop until the full right column (incl. description) has scrolled */}
            <div className="space-y-4">
              <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="relative aspect-square bg-white overflow-hidden rounded-sm border border-gold-600/10">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentDisplayImage}
                    src={currentDisplayImage}
                    alt={product.name}
                    loading="eager"
                    decoding="async"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-contain p-6 md:p-10"
                  />
                </AnimatePresence>
              </div>

              {thumbnailStrip.length > 1 && (
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                  {thumbnailStrip.map((thumb) => {
                    const isSelected = currentDisplayImage === thumb.src;
                    return (
                      <button
                        key={thumb.id}
                        type="button"
                        onClick={() => {
                          setSelectedImage(thumb.src);
                          if (thumb.color) handleColorSelect(thumb.color);
                        }}
                        aria-label={`View ${thumb.label}`}
                        className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-sm overflow-hidden bg-white border-2 transition-all ${
                          isSelected
                            ? 'border-gold-500 shadow-md shadow-gold-500/20'
                            : 'border-gold-600/15 hover:border-gold-500/50'
                        }`}
                      >
                        <img
                          src={thumb.thumb || thumb.src}
                          alt={thumb.label}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <span className="absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold-600 text-navy-950">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              </div>
            </div>

            {/* Purchase + description — scrolls; image stays pinned until this column ends */}
            <div className="space-y-6 lg:pt-2 min-h-0">
              <div className="space-y-3">
                {product.brand_name && (
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-500">{product.brand_name}</p>
                )}
                <h1 className="text-3xl md:text-4xl font-serif text-white leading-tight">{product.name}</h1>

                <div className="flex items-baseline gap-3 flex-wrap">
                  <p className="text-2xl font-light text-gold-400">
                    KSh {displayPrice.toLocaleString()}
                  </p>
                  {compareAtPrice != null && compareAtPrice > displayPrice && (
                    <p className="text-lg text-slate-500 line-through font-light">
                      KSh {compareAtPrice.toLocaleString()}
                    </p>
                  )}
                </div>

                {variantSummary && (
                  <p className="text-sm text-slate-400 font-light tracking-wide">{variantSummary}</p>
                )}
              </div>

              {hasMultipleColors && (
                <div className="space-y-3">
                  <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-gold-500">
                    {variantMeta.isShoe ? 'Color' : 'Variant'}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {variantMeta.colors.map(({ color, variants: colorVariants }) => {
                      const rep = colorVariants[0];
                      const thumb = getImageSrc(rep?.image_url, 'thumbnail') || getVariantImage(rep);
                      const isSelected = selectedColor === color;
                      const colorAvailable = colorVariants.some(isVariantAvailable);

                      return (
                        <button
                          key={color}
                          type="button"
                          disabled={!colorAvailable}
                          onClick={() => handleColorSelect(color)}
                          className={`flex items-center gap-3 px-4 py-3 border text-left transition-all ${
                            !colorAvailable ? 'opacity-40 cursor-not-allowed border-gold-600/10' :
                            isSelected
                              ? 'border-gold-500 bg-gold-600/10 text-white'
                              : 'border-gold-600/20 text-slate-300 hover:border-gold-500/60'
                          }`}
                        >
                          {thumb && (
                            <span className="shrink-0 w-10 h-10 rounded-sm overflow-hidden bg-white border border-gold-600/10">
                              <img src={thumb} alt="" className="w-full h-full object-cover" />
                            </span>
                          )}
                          <span className="text-[11px] font-medium tracking-wide">{color}</span>
                          {isSelected && <Check size={14} className="ml-auto text-gold-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {availableSizes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-gold-500">
                      {variantMeta.isShoe ? 'Shoe Size' : 'Size'}
                    </h3>
                    <button
                      type="button"
                      className="text-[10px] uppercase tracking-widest text-gold-600/50 font-bold hover:text-gold-500 transition-colors"
                    >
                      Size Guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => {
                      const variantForSize = findVariant(selectedColor, size);
                      const stock = variantStockQty(variantForSize);
                      const isOutOfStock = stock != null && stock <= 0;

                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleSizeSelect(size)}
                          title={isOutOfStock ? 'Unavailable' : undefined}
                          className={`min-w-[3rem] h-11 px-3 flex items-center justify-center text-[11px] font-bold border transition-all ${
                            isOutOfStock
                              ? 'opacity-40 cursor-not-allowed line-through bg-navy-900 text-white/30 border-gold-600/10'
                              : selectedSize === size
                                ? 'bg-gold-600 text-navy-950 border-gold-600'
                                : 'bg-navy-900 text-white border-gold-600/20 hover:border-gold-600'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gold-600/20 px-3 py-2.5 bg-navy-950">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1 text-gold-600 hover:text-gold-500 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-5 text-[11px] font-bold text-white w-10 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-1 text-gold-600 hover:text-gold-500 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleAddToCart}
                    disabled={shopOutOfStock}
                    className={`flex-1 py-4 px-5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                      addedToCart
                        ? 'bg-green-600 text-white border border-green-600'
                        : 'bg-navy-950 border border-gold-600 text-gold-500 hover:bg-gold-600 hover:text-navy-950'
                    }`}
                  >
                    <ShoppingBag size={14} />
                    <span>{addedToCart ? 'Added to Bag' : 'Add to cart'}</span>
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={handleBuyNow}
                  disabled={shopOutOfStock}
                  className="w-full bg-gold-600 text-navy-950 py-4 px-6 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gold-500 transition-all shadow-xl shadow-gold-600/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Buy it now
                </motion.button>

                <AnimatePresence>
                  {addedToCart && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] text-green-500 font-bold uppercase tracking-widest text-center"
                    >
                      Excellent choice. Item added to your curation.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-8 border-t border-gold-600/10">
                <ProductDescription
                  productName={product.name}
                  brandName={product.brand_name}
                  description={product.description}
                  parsedColors={parsedColorList}
                  parsedSizes={[sizeLine]}
                  isShoe={variantMeta.isShoe}
                />
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <div ref={relatedSectionRef} className="mt-24 pt-16 border-t border-gold-600/10">
              <h2 className="text-2xl md:text-3xl font-serif text-white mb-10">You may also like</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {related.map((p) => (
                  <Link to={`/product/${p.slug}`} key={p.id} className="group block">
                    <div className="aspect-square bg-white overflow-hidden mb-4 border border-gold-600/10">
                      <img
                        src={getPremiumImage(p)}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[10px] font-bold text-white uppercase tracking-widest min-h-[28px] group-hover:text-gold-500 transition-colors line-clamp-2">
                        {p.name}
                      </h3>
                      <p className="text-xs font-light text-gold-500 italic">
                        KSh {parseFloat(p.discount_price || p.price).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <StickyAddToCart
        visible={showStickyCart}
        productName={product.name}
        variantSummary={variantSummary}
        displayPrice={displayPrice}
        compareAtPrice={compareAtPrice}
        image={currentDisplayImage}
        addedToCart={addedToCart}
        disabled={shopOutOfStock}
        onAddToCart={handleAddToCart}
      />

      <Footer />
    </div>
  );
};

export default ProductDetail;
