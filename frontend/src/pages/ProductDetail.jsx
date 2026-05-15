import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Plus, Minus } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCartStore } from '../store/useCartStore';
import { productAPI } from '../services/api';
import { getPremiumImage } from '../utils/productImages';

function sizesForCategoryName(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('shoe')) return ['39', '40', '41', '42', '43', '44', '45'];
  if (n.includes('trouser') || n.includes('pant')) return ['30', '32', '34', '36', '38'];
  if (n.includes('shirt')) return ['M', 'L', 'XL', 'XXL', '3XL'];
  if (n.includes('track')) return ['M', 'L', 'XL', 'XXL'];
  if (n.includes('outer')) return ['M', 'L', 'XL', 'XXL'];
  return ['M', 'L', 'XL', 'XXL'];
}

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError('');
      setProduct(null);
      try {
        const res = await productAPI.getBySlug(slug);
        if (cancelled) return;
        if (!res.data?.success) {
          setLoadError('Product not found.');
          return;
        }
        const p = res.data.data;
        setProduct(p);
        const vars = p.variants || [];
        setSelectedVariant(vars[0] || null);
        const sizes = sizesForCategoryName(p.category_name);
        setSelectedSize(sizes[0] || '');
        try {
          const rel = await productAPI.related(p.id);
          if (!cancelled && rel.data?.success && Array.isArray(rel.data.data)) {
            setRelated(rel.data.data.slice(0, 4));
          }
        } catch {
          setRelated([]);
        }
      } catch {
        if (!cancelled) setLoadError('Product not found.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const unitPrice = product
    ? parseFloat(product.price) + parseFloat(selectedVariant?.price_modifier || 0)
    : 0;

  const buildPayload = () => ({
    productId: product.id,
    variantId: selectedVariant?.id || null,
    quantity,
    sizeLabel: selectedSize,
    name: product.name,
    price: unitPrice,
    image: getPremiumImage(product),
    slug: product.slug,
    brandName: product.brand_name,
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

  return (
    <div className="bg-navy-950 min-h-screen">
      <Navbar />

      <main className="pt-24 pb-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-6">
              <div className="relative aspect-square md:aspect-[4/5] bg-navy-900 overflow-hidden rounded-sm border border-gold-600/10">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={getPremiumImage(product)}
                    src={getPremiumImage(product)}
                    alt={product.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                {product.is_featured && (
                  <div className="absolute top-6 left-6 bg-gold-600 text-navy-950 px-4 py-1 text-[10px] font-bold uppercase tracking-widest">
                    Featured Edit
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-500">{product.brand_name}</p>
                <h1 className="text-4xl md:text-5xl font-serif text-white leading-tight">{product.name}</h1>
                <p className="text-2xl font-light text-gold-400 italic">KSh {unitPrice.toLocaleString()}</p>
              </div>

              {product.variants?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-gold-500">Color Selection</h3>
                  <div className="flex flex-col space-y-3">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        className={`flex items-center justify-between px-6 py-4 border transition-all group ${
                          selectedVariant?.id === variant.id
                            ? 'bg-gold-600 text-navy-950 border-gold-600'
                            : 'bg-navy-900 text-white border-gold-600/20 hover:border-gold-600'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest">{variant.value}</span>
                        <div
                          className={`w-3 h-3 rounded-full border ${
                            selectedVariant?.id === variant.id ? 'bg-navy-950 border-white/20' : 'bg-gold-600/20 border-gold-600/40'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                  {sizesForCategoryName(product.category_name).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 flex items-center justify-center text-[10px] font-bold border transition-all ${
                        selectedSize === size
                          ? 'bg-gold-600 text-navy-950 border-gold-600'
                          : 'bg-navy-900 text-white border-gold-600/20 hover:border-gold-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

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
                    className={`flex-1 py-4 px-6 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 ${
                      addedToCart 
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
                <p className="text-slate-400 text-sm leading-relaxed font-light">{product.description}</p>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-32 pt-20 border-t border-gold-600/10">
              <h2 className="text-3xl font-serif text-white mb-12">You may also like</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {related.map((p) => (
                  <Link to={`/product/${p.slug}`} key={p.id} className="group block">
                    <div className="aspect-square bg-navy-900 overflow-hidden mb-6 border border-gold-600/10">
                      <img
                        src={getPremiumImage(p)}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
