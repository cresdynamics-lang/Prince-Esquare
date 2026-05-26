import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useCartStore } from '../store/useCartStore';
import { getDummyProducts } from '../utils/dummyData';
import { getPremiumImage } from '../utils/productImages';

const ProductShowcase = () => {
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);
  const [products, setProducts] = useState([]);
  const [addedProductId, setAddedProductId] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productAPI.list({ limit: 8 });
        const fetchedProducts = response.data.data.products || response.data.data || [];
        setProducts(fetchedProducts.length ? fetchedProducts.slice(0, 8) : getDummyProducts().slice(0, 8));
      } catch (error) {
        setProducts(getDummyProducts().slice(0, 8));
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (product) => {
    const needsOptions = ['shoes', 'shirts', 'trousers', 'suits', 'tracksuits', 'jackets', 'linen', 't-shirts', 'polo-t-shirts']
      .includes((product.category_name || '').toLowerCase());

    if (needsOptions) {
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
    <section className="py-32 bg-navy-950">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl space-y-6">
            <h2 className="text-4xl md:text-6xl font-serif text-white leading-tight">
              Our <span className="text-gold-500 italic">Collections</span>
            </h2>
            <p className="text-navy-300 font-light leading-relaxed">
              Browse selected pieces from Prince Esquire and move straight from discovery to cart.
            </p>
          </div>
          <Link
            to="/products"
            className="text-gold-500 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-4 hover:gap-6 transition-all"
          >
            View All Products <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {products.map((product, index) => (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="group"
            >
              <div className="relative aspect-[4/5] bg-navy-900 overflow-hidden border border-gold-600/10 group-hover:border-gold-600/60 transition-colors">
                <img
                  src={getPremiumImage(product)}
                  alt={product.name}
                  className="w-full h-full object-contain p-3 bg-white transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-navy-950/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    className="bg-white text-navy-950 px-4 py-3 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 translate-y-4 group-hover:translate-y-0 transition-all duration-500"
                  >
                    <ShoppingBag size={13} />
                    {addedProductId === product.id ? 'Added' : 'Add to Cart'}
                  </button>
                  <Link
                    to={`/product/${product.slug}`}
                    className="border border-white/70 text-white px-4 py-3 text-[9px] font-bold uppercase tracking-widest translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:bg-white hover:text-navy-950"
                  >
                    View Product
                  </Link>
                </div>
              </div>
              <div className="pt-5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gold-600/50">{product.brand_name}</p>
                <h3 className="text-lg font-serif text-white group-hover:text-gold-500 transition-colors">{product.name}</h3>
                <p className="text-gold-500 font-light italic">KSh {parseFloat(product.price).toLocaleString()}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
