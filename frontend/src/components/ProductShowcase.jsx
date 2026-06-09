import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { catalogueAPI } from '../services/api';
import { useCartStore } from '../store/useCartStore';
import { getPremiumImage, preloadProductImages } from '../utils/productImages';

const needsSizeSelection = (product) =>
  ['shoes', 'shirts', 'trousers', 'suits', 'tracksuits', 'jackets', 'linen', 't-shirts', 'polo-t-shirts']
    .includes((product.category_name || '').toLowerCase());

const HOMEPAGE_PRODUCT_LIMIT = 8;

/** One product per category first, then fill up to limit for variety. */
const pickFeaturedByCategory = (products, limit = HOMEPAGE_PRODUCT_LIMIT) => {
  const byCategory = new Map();
  for (const product of products) {
    const cat = product.category_name || product.parent_category_name || 'Collection';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(product);
  }

  const picked = [];
  const buckets = [...byCategory.values()];

  for (let round = 0; picked.length < limit; round += 1) {
    let added = false;
    for (const group of buckets) {
      if (picked.length >= limit) break;
      const product = group[round];
      if (product) {
        picked.push(product);
        added = true;
      }
    }
    if (!added) break;
  }

  return picked;
};

const ProductShowcase = () => {
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedProductId, setAddedProductId] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await catalogueAPI.get();
        const catalogue = response.data.data || {};
        preloadProductImages(catalogue.image_urls || []);
        const inStock = (catalogue.products || []).filter((p) => !p.out_of_stock);
        setProducts(pickFeaturedByCategory(inStock));
      } catch (error) {
        console.error('ProductShowcase: catalogue unavailable', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (product) => {
    if (needsSizeSelection(product)) {
      navigate(`/product/${product.slug}`);
      return;
    }

    await addToCart({
      productId: product.id,
      variantId: null,
      quantity: 1,
      sizeLabel: '',
      name: product.name,
      price: parseFloat(product.price),
      image: getPremiumImage(product),
      slug: product.slug,
      brandName: product.brand_name,
    });

    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1400);
  };

  return (
    <section className="pt-8 pb-20 md:pt-10 md:pb-24 bg-navy-950">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between gap-4 mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-serif text-white">
            Shop <span className="text-gold-500 italic">Collection</span>
          </h2>
          <Link
            to="/products"
            className="text-gold-500 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 hover:gap-4 transition-all shrink-0"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-10 sm:gap-y-12">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-navy-900 border border-gold-600/10" />
                <div className="h-4 bg-navy-900 mt-4 w-2/3" />
                <div className="h-3 bg-navy-900 mt-2 w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-gold-500/50 text-[10px] uppercase tracking-widest py-12">
            No products in stock right now.
          </p>
        ) : (
          <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-10 sm:gap-y-12">
            {products.map((product, index) => (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                className="group"
              >
                <Link to={`/product/${product.slug}`} className="block">
                  <div className="relative aspect-[4/5] bg-navy-900 overflow-hidden border border-gold-600/10 group-hover:border-gold-600/60 transition-colors">
                    <img
                      src={getPremiumImage(product)}
                      alt={product.name}
                      loading={index < 8 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="w-full h-full object-contain p-3 bg-white transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-navy-950/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 px-4 pointer-events-none group-hover:pointer-events-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                        className="bg-white text-navy-950 px-4 py-3 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 translate-y-4 group-hover:translate-y-0 transition-all duration-500"
                      >
                        <ShoppingBag size={13} />
                        {addedProductId === product.id ? 'Added' : 'Add to Cart'}
                      </button>
                      <span className="border border-white/70 text-white px-4 py-3 text-[9px] font-bold uppercase tracking-widest translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                        View Product
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="pt-4 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold-600/50">{product.brand_name}</p>
                  <h3 className="text-base md:text-lg font-serif text-white group-hover:text-gold-500 transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-gold-500 font-light italic text-sm">
                    KSh {parseFloat(product.price).toLocaleString()}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
          <div className="mt-12 md:mt-16 flex justify-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-3 border border-gold-500/50 text-gold-500 px-10 py-4 text-[10px] font-bold uppercase tracking-[0.35em] hover:bg-gold-500 hover:text-navy-950 transition-all"
            >
              View Products <ArrowRight size={14} />
            </Link>
          </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ProductShowcase;
