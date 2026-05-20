import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCartStore } from '../store/useCartStore';
import { getPremiumImage } from '../utils/productImages';
import { getDummyProducts } from '../utils/dummyData';
import { productAPI } from '../services/api';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);
  
  const CATEGORY_DATA = [
    { id: 'All', name: 'All', sub: [] },
    { id: 'polo-t-shirts', name: 'Polo T-shirts', sub: ['Knitted Polos', 'Polos'] },
    { id: 'shoes', name: 'Shoes', sub: ['Formal shoes', 'Casual', 'Boots', 'Sandals', 'Loafers'] },
    { id: 'shirts', name: 'Shirts', sub: ['Formal shirts', 'Casual', 'Presidential'] },
    { id: 'suits', name: 'Suits', sub: ['Two piece', 'Three piece'] },
    { id: 'trousers', name: 'Trousers', sub: ['Khaki', 'Formal', 'Chino', 'Jeans', 'Gurkha'] },
    { id: 'linen', name: 'Linen', sub: ['Linen Set', 'Linen Trousers', 'Linen shirts', 'Linen shorts'] },
    { id: 'more', name: 'More', sub: ['Blazers', 'Track Suits', 'Jackets', 'Half jackets', 'Caps & Hats', 'Belts & Ties', 'Sweaters', 'Sweat-shirts', 'Round-neck T-shirts', 'V-neck T-shirts'] },
  ];

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const currentCategory = searchParams.get('category') || 'All';
  const currentSub = searchParams.get('sub') || 'All';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {};
        if (currentCategory !== 'All') params.category = currentCategory;
        if (currentSub !== 'All') params.sub = currentSub;
        
        // Fetch from backend
        const response = await productAPI.list(params);
        const fetchedProducts = response.data.data.products || response.data.data || [];
        
        // Get dummy products
        const dummyData = getDummyProducts(currentCategory, currentSub);
        
        // Combine them
        setProducts([...dummyData, ...fetchedProducts]);
      } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback to just dummy products if backend fails
        setProducts(getDummyProducts(currentCategory, currentSub));
      } finally {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    };
    fetchProducts();
  }, [currentCategory, currentSub]);

  const setFilter = (cat, sub = 'All') => {
    const params = {};
    if (cat !== 'All') params.category = cat;
    if (sub !== 'All') params.sub = sub;
    setSearchParams(params);
  };

  const handleQuickAdd = async (product) => {
    const needsSize = ['shoes', 'shirts', 'trousers', 'suits', 'tracksuits', 'jackets', 'linen', 't-shirts'].includes((product.category_name || '').toLowerCase());
    
    if (needsSize) {
      navigate(`/product/${product.slug}`);
    } else {
      addToCart({
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
      alert(`Added ${product.name} to your collection.`);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="bg-navy-950 min-h-screen font-serif">
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="mb-12">
            <span className="text-gold-500 text-[10px] uppercase tracking-[0.4em] font-bold">Prince Esquire</span>
            <h1 className="text-5xl md:text-6xl font-serif text-white tracking-tight mt-2">
              {currentCategory === 'All' ? 'Our Collections' : CATEGORY_DATA.find(c => c.id === currentCategory)?.name}
            </h1>
            {currentSub !== 'All' && (
              <p className="text-gold-600/60 text-[12px] uppercase tracking-widest mt-4">
                Exploring: {currentSub}
              </p>
            )}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-8 md:space-y-0 mb-16 border-b border-gold-600/10 pb-12">
            <div className="w-full space-y-8">
              <div className="flex flex-wrap gap-3">
                {CATEGORY_DATA.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFilter(cat.id)}
                    className={`px-6 py-2.5 text-[9px] font-bold uppercase tracking-[0.2em] transition-all border ${
                      currentCategory === cat.id
                        ? 'bg-gold-600 text-navy-950 border-gold-600'
                        : 'bg-transparent text-gold-600/50 border-gold-600/10 hover:border-gold-600/30 hover:text-gold-500'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {currentCategory !== 'All' &&
                  CATEGORY_DATA.find((c) => c.id === currentCategory)?.sub.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-wrap gap-2 pt-4 border-t border-gold-600/5"
                    >
                      <button
                        type="button"
                        onClick={() => setFilter(currentCategory, 'All')}
                        className={`px-4 py-1.5 text-[8px] font-bold uppercase tracking-widest transition-all rounded-full border ${
                          currentSub === 'All'
                            ? 'bg-gold-600/10 text-gold-500 border-gold-500/30'
                            : 'bg-transparent text-gold-600/30 border-transparent hover:text-gold-600'
                        }`}
                      >
                        All {CATEGORY_DATA.find(c => c.id === currentCategory)?.name}
                      </button>
                      {CATEGORY_DATA.find((c) => c.id === currentCategory).sub.map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setFilter(currentCategory, sub)}
                          className={`px-4 py-1.5 text-[8px] font-bold uppercase tracking-widest transition-all rounded-full border ${
                            currentSub === sub
                              ? 'bg-gold-600/10 text-gold-500 border-gold-500/30'
                              : 'bg-transparent text-gold-600/30 border-transparent hover:text-gold-600'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </motion.div>
                  )}
              </AnimatePresence>
            </div>

            <div className="relative w-full md:w-80 group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600/30 group-focus-within:text-gold-500 transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Search collection..."
                className="w-full pl-12 pr-4 py-4 bg-navy-950 border border-gold-600/10 text-[10px] uppercase tracking-widest text-white focus:border-gold-600 outline-none transition-all placeholder:text-gold-600/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <p className="text-center text-gold-600/50 text-[10px] uppercase tracking-widest py-24">Loading collection…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-20">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group"
                  >
                    <Link to={`/product/${product.slug}`} className="block">
                      <div className="relative aspect-square bg-navy-950 overflow-hidden mb-6 border border-gold-600/10 group-hover:border-gold-600 transition-colors">
                        <img
                          src={getPremiumImage(product)}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-navy-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              handleQuickAdd(product);
                            }}
                            className="bg-white text-navy-950 px-6 py-3 text-[10px] font-bold uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-all duration-500"
                          >
                            Quick Add
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gold-600/50">{product.brand_name}</span>
                        </div>
                        <h3 className="text-lg font-serif text-white group-hover:text-gold-500 transition-colors">{product.name}</h3>
                        <p className="text-gold-500 font-light italic">KSh {parseFloat(product.price).toLocaleString()}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-24 space-y-4">
              <p className="text-gold-600/50 text-[10px] uppercase tracking-widest">No pieces found in this curation.</p>
              <button 
                onClick={() => setFilter('All')}
                className="text-white text-[10px] font-bold uppercase tracking-widest border-b border-white/20 pb-1 hover:border-white transition-all"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
