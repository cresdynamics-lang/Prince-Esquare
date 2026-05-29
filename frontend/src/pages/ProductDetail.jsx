import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Plus, Minus } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCartStore } from '../store/useCartStore';
import { productAPI } from '../services/api';
import { getPremiumImage } from '../utils/productImages';
import { getImageSrc } from '../utils/cloudinary';
import { DUMMY_PRODUCTS } from '../utils/dummyData';

function sizesForCategoryName(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('shoe')) return ['39', '40', '41', '42', '43', '44', '45', '46'];
  if (n.includes('trouser') || n.includes('pant')) return ['30', '32', '34', '36', '38'];
  if (n.includes('shirt')) return ['M', 'L', 'XL', 'XXL', '3XL'];
  if (n.includes('track')) return ['M', 'L', 'XL', 'XXL'];
  if (n.includes('outer')) return ['M', 'L', 'XL', 'XXL'];
  return ['M', 'L', 'XL', 'XXL'];
}

function sortSizes(sizes) {
  const unique = [...new Set(sizes.filter(Boolean))];
  const allNumeric = unique.every((s) => /^\d+$/.test(String(s).trim()));
  if (allNumeric) {
    return unique.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }
  const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL'];
  return unique.sort((a, b) => {
    const ai = order.indexOf(String(a).toUpperCase());
    const bi = order.indexOf(String(b).toUpperCase());
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return String(a).localeCompare(String(b));
  });
}

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loadError, setLoadError] = useState('');
  
  const [selectedSize, setSelectedSize] = useState('');

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoadError('');
      setProduct(null);

      let found = null;
      let isDummy = false;

      // Try backend first
      try {
        const res = await productAPI.getBySlug(slug);
        if (res.data?.success && res.data.data) {
          found = res.data.data;
        }
      } catch (error) {
        console.warn('Backend product fetch failed, checking dummy data...');
      }

      // Fallback to dummy
      if (!found) {
        found = DUMMY_PRODUCTS.find(p => p.slug === slug);
        if (found) isDummy = true;
      }

      if (!found) {
        setLoadError('Product not found.');
        return;
      }

      if (found) {
        let p, rawVariants = [], rel = [];

        if (isDummy) {
          p = {
            ...found,
            thumbnail: found.thumbnail,
            description: found.description || `Exquisite ${found.name} from our latest collection. Crafted with precision and the finest materials.`,
            variants: []
          };

          rel = DUMMY_PRODUCTS.filter(item =>
            item.category_name === p.category_name &&
            item.slug !== p.slug
          ).slice(0, 4).map(item => ({ ...item, thumbnail: item.thumbnail }));
        } else {
          // Backend specific logic
          p = {
            ...found,
            thumbnail: found.thumbnail || found.image_url,
            description: found.description || `Exquisite ${found.name} from our latest collection.`,
            variants: found.variants || []
          };
          
          try {
            const relRes = await productAPI.related(found.id);
            rel = relRes.data.data || [];
          } catch (e) {
            console.error("Could not fetch related products");
          }
        }

        // Parse Variants for unified color/size handling
        const parsedVariants = (p.variants || []).map(v => {
          let c = v.color;
          let s = v.size;
          
          // Fallback parsing for old DB structure or dummy data
          if (!c && !s && v.value && v.value.includes('/')) {
              const parts = v.value.split('/');
              s = parts[0].trim();
              c = parts[1].trim();
          } else if (!c && !s) {
              c = v.value || 'Original';
              s = 'Standard';
          }
          return { ...v, color: c, size: s };
        });

        // For dummy products, we need to populate missing size combinations
        let finalVariants = parsedVariants;
        const categorySizes = sizesForCategoryName(p.category_name);
        const isShoeProduct = (p.category_name || '').toLowerCase().includes('shoe');
        const hasOnlyGenericSizes = finalVariants.length > 0 && finalVariants.every((v) => !v.size || v.size === 'Standard');

        if (isDummy || (isShoeProduct && hasOnlyGenericSizes)) {
          const enrichedVariants = [];
          parsedVariants.forEach(v => {
              categorySizes.forEach(ms => {
                  enrichedVariants.push({...v, size: ms, id: `${v.id}-${ms}`});
              });
          });
          finalVariants = enrichedVariants;
        }

        // Add a default variant if none exist to ensure UI works smoothly
        if (finalVariants.length === 0) {
            finalVariants = sizesForCategoryName(p.category_name).map(size => ({
                id: `default-${size}`,
                color: 'Default',
                size: size,
                price_modifier: 0,
                image_url: p.thumbnail,
                stock: 10
            }));
        }

        p.variants = finalVariants;

        const uniqueSizes = sortSizes(finalVariants.map(v => v.size));
        setSelectedSize(uniqueSizes[0] || '');

        setProduct(p);
        setRelated(rel);
      }
    };

    fetchProduct();
  }, [slug]);

  const currentVariant = product?.variants?.find(v => v.size === selectedSize);

  const unitPrice = product
    ? parseFloat(product.price) + parseFloat(currentVariant?.price_modifier || 0)
    : 0;

  const currentDisplayImage =
    product?.thumbnail_optimized ||
    getImageSrc(product?.thumbnail) ||
    product?.thumbnail;

  const buildPayload = () => ({
    productId: product?.id,
    variantId: currentVariant?.id,
    quantity,
    sizeLabel: selectedSize,
    name: product?.name,
    price: unitPrice,
    image: currentDisplayImage,
    slug: product?.slug,
    brandName: product?.brand_name,
    variantValue: selectedSize
  });

  const handleAddToCart = async () => {
    if (!product) return;
    await addToCart(buildPayload());
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleBuyNow = async () => {
    if (!product) return;
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

  const availableSizes = sortSizes(
    product?.variants?.map((v) => v.size) || []
  );

  return (
    <div className="bg-navy-950 min-h-screen">
      <Navbar />

      <main className="pt-24 pb-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-6">
              <div className="relative aspect-square md:aspect-[4/5] bg-white overflow-hidden rounded-sm border border-gold-600/10">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentDisplayImage}
                    src={currentDisplayImage}
                    alt={product.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-contain p-8"
                  />
                </AnimatePresence>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-500">{product?.brand_name}</p>
                <h1 className="text-4xl md:text-5xl font-serif text-white leading-tight">{product?.name}</h1>
                <p className="text-2xl font-light text-gold-400 italic">KSh {unitPrice.toLocaleString()}</p>
              </div>

              {availableSizes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-gold-500">Select Size</h3>
                    <button
                      type="button"
                      className="text-[10px] uppercase tracking-widest text-gold-600/50 font-bold hover:text-gold-500 transition-colors"
                    >
                      Size Guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {availableSizes.map((size) => {
                      const variantForSize = product?.variants?.find(v => v.size === size);
                      // In dummy mode stock might be undefined, handle gracefully
                      const stock = variantForSize?.stock;
                      const isOutOfStock = variantForSize != null && Number(stock) === 0;

                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => setSelectedSize(size)}
                          title={isOutOfStock ? 'Out of stock' : undefined}
                          className={`w-12 h-12 flex items-center justify-center text-[10px] font-bold border transition-all ${
                            isOutOfStock ? 'opacity-40 cursor-not-allowed line-through bg-navy-900 text-white/30 border-gold-600/10' :
                            selectedSize === size
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

              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gold-600/20 px-4 py-3 bg-navy-950">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1 text-gold-600 hover:text-gold-500 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-6 text-[10px] font-bold text-white w-12 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-1 text-gold-600 hover:text-gold-500 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handleAddToCart()}
                    className={`flex-1 py-4 px-6 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 ${addedToCart
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-navy-950 border border-gold-600 text-gold-500 hover:bg-gold-600 hover:text-navy-950'
                      }`}
                  >
                    <ShoppingBag size={14} />
                    <span>{addedToCart ? 'Added to Bag' : 'Add to Bag'}</span>
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={() => handleBuyNow()}
                  className="w-full bg-gold-600 text-navy-950 py-5 px-6 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gold-500 transition-all shadow-xl shadow-gold-600/10"
                >
                  Buy it now
                </motion.button>

                <AnimatePresence>
                  {addedToCart && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] text-green-500 font-bold uppercase tracking-widest text-center pt-4"
                    >
                      Excellent choice. Item added to your curation.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-8 pt-10 border-t border-gold-600/10">
                <p className="text-slate-400 text-sm leading-relaxed font-light">{product?.description}</p>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-32 pt-20 border-t border-gold-600/10">
              <h2 className="text-3xl font-serif text-white mb-12">You may also like</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {related.map((p) => (
                  <Link to={`/product/${p.slug}`} key={p.id} className="group block">
                    <div className="aspect-square bg-white overflow-hidden mb-6 border border-gold-600/10">
                      <img
                        src={getPremiumImage(p)}
                        alt={p.name}
                        className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-bold text-white uppercase tracking-widest min-h-[30px] group-hover:text-gold-500 transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-xs font-light text-gold-500 italic">KSh {parseFloat(p.price).toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
