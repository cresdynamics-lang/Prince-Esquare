import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCartStore } from '../store/useCartStore';
import { getPremiumImage } from '../utils/productImages';
import { getDummyProducts } from '../utils/dummyData';
import { productAPI, adminCategoryAPI, adminBrandAPI } from '../services/api';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);
  
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [dynamicBrands, setDynamicBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const currentCategory = searchParams.get('category') || 'All';
  const currentSub = searchParams.get('sub') || 'All';
  const currentBrand = searchParams.get('brand') || 'All';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = {};
        if (currentCategory !== 'All') params.category = currentCategory;
        if (currentSub !== 'All') params.sub = currentSub;
        if (currentBrand !== 'All') params.brand = currentBrand;
        
        // Fetch products
        const response = await productAPI.list(params);
        const fetchedProducts = response.data.data.products || response.data.data || [];
        
        // Fetch categories for the filter
        const catRes = await adminCategoryAPI.getAll().catch(() => ({ data: { data: [] } }));
        const allCats = catRes.data.data || [];
        const parents = allCats.filter(c => !c.parent_id);
        const organized = parents.map(p => ({
          id: p.slug,
          name: p.name,
          sub: allCats.filter(c => c.parent_id === p.id).map(c => c.name)
        }));
        setDynamicCategories(organized);

        // Fetch brands for the filter
        const brandRes = await adminBrandAPI.getAll().catch(() => ({ data: { data: [] } }));
        setDynamicBrands(brandRes.data.data || []);

        // Get dummy products
        const dummyData = getDummyProducts(currentCategory, currentSub);
        
        // Combine them, filtering out dummies that have the same slug as a fetched product
        const fetchedSlugs = new Set(fetchedProducts.map(p => p.slug));
        const uniqueDummies = dummyData.filter(d => !fetchedSlugs.has(d.slug));
        
        setProducts([...fetchedProducts, ...uniqueDummies]);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts(getDummyProducts(currentCategory, currentSub));
      } finally {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    };
    fetchData();
  }, [currentCategory, currentSub, currentBrand]);

  const hardcodedCategories = [
    { id: 'All', name: 'All', sub: [] },
    { id: 'polo-t-shirts', name: 'Polo T-shirts', sub: ['Knitted Polos', 'Polos'] },
    { id: 'shoes', name: 'Shoes', sub: ['Formal shoes', 'Casual', 'Boots', 'Sandals', 'Loafers'] },
    { id: 'shirts', name: 'Shirts', sub: ['Formal shirts', 'Casual', 'Presidential'] },
    { id: 'suits', name: 'Suits', sub: ['Two piece', 'Three piece'] },
    { id: 'trousers', name: 'Trousers', sub: ['Khaki', 'Formal', 'Chino', 'Jeans', 'Gurkha'] },
    { id: 'linen', name: 'Linen', sub: ['Linen Set', 'Linen Trousers', 'Linen shirts', 'Linen shorts'] },
    { id: 'more', name: 'More', sub: ['Blazers', 'Track Suits', 'Jackets', 'Half jackets', 'Caps & Hats', 'Belts & Ties', 'Sweaters', 'Sweat-shirts', 'Round-neck T-shirts', 'V-neck T-shirts'] },
  ];

  const CATEGORY_DATA = [...hardcodedCategories];
  dynamicCategories.forEach(dCat => {
    if (!CATEGORY_DATA.find(c => c.name.toLowerCase() === dCat.name.toLowerCase())) {
        CATEGORY_DATA.push(dCat);
    }
  });

  const dummyBrands = [...new Set(getDummyProducts().map(p => p.brand_name))];
  const BRAND_LIST = ['All', ...new Set([...dummyBrands, ...dynamicBrands.map(b => b.name)])];

  const setFilter = (cat, sub = 'All', brand = 'All') => {
    const params = {};
    if (cat !== 'All') params.category = cat;
    if (sub !== 'All') params.sub = sub;
    if (brand !== 'All') params.brand = brand;
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
    
    const matchesBrand = currentBrand === 'All' || 
      product.brand_name?.toLowerCase() === currentBrand.toLowerCase();

    return matchesSearch && matchesBrand;
  });

  return (
    <div className="bg-navy-950 min-h-screen font-serif">
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="mb-12">
            <span className="text-gold-500 text-[10px] uppercase tracking-[0.4em] font-bold">Prince Esquire</span>
            <h1 className="text-5xl md:text-6xl font-serif text-white tracking-tight mt-2">
              {currentCategory === 'All' ? 'Our Collections' : CATEGORY_DATA.find(c => c.id === currentCategory || c.name.toLowerCase() === currentCategory.toLowerCase())?.name}
            </h1>
            <div className="flex gap-4 mt-4">
                {currentSub !== 'All' && (
                <p className="text-gold-600/60 text-[12px] uppercase tracking-widest border-r border-gold-600/20 pr-4">
                    Exploring: {currentSub}
                </p>
                )}
                {currentBrand !== 'All' && (
                <p className="text-gold-600/60 text-[12px] uppercase tracking-widest">
                    Brand: {currentBrand}
                </p>
                )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-8 md:space-y-0 mb-16 border-b border-gold-600/10 pb-12">
            <div className="w-full space-y-8">
              <div className="flex flex-wrap gap-3">
                {CATEGORY_DATA.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFilter(cat.id, 'All', currentBrand)}
                    className={`px-6 py-2.5 text-[9px] font-bold uppercase tracking-[0.2em] transition-all border ${
                      currentCategory === cat.id || currentCategory.toLowerCase() === cat.name.toLowerCase()
                        ? 'bg-gold-600 text-navy-950 border-gold-600'
                        : 'bg-transparent text-gold-600/50 border-gold-600/10 hover:border-gold-600/30 hover:text-gold-500'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-gold-600/5 items-center">
                 <span className="text-[8px] font-black uppercase text-gold-500/40 mr-2 tracking-widest">Brands:</span>
                 {BRAND_LIST.map((b) => (
                   <button
                    key={b}
                    type="button"
                    onClick={() => setFilter(currentCategory, currentSub, b)}
                    className={`px-4 py-1.5 text-[8px] font-bold uppercase tracking-widest transition-all rounded-full border ${
                        currentBrand === b
                          ? 'bg-gold-600/10 text-gold-500 border-gold-500/30'
                          : 'bg-transparent text-gold-600/30 border-transparent hover:text-gold-600'
                      }`}
                   >
                     {b}
                   </button>
                 ))}
              </div>

              <AnimatePresence>
                {currentCategory !== 'All' &&
                  CATEGORY_DATA.find((c) => c.id === currentCategory || c.name.toLowerCase() === currentCategory.toLowerCase())?.sub.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-wrap gap-2 pt-4 border-t border-gold-600/5"
                    >
                      <button
                        type="button"
                        onClick={() => setFilter(currentCategory, 'All', currentBrand)}
                        className={`px-4 py-1.5 text-[8px] font-bold uppercase tracking-widest transition-all rounded-full border ${
                          currentSub === 'All'
                            ? 'bg-gold-600/10 text-gold-500 border-gold-500/30'
                            : 'bg-transparent text-gold-600/30 border-transparent hover:text-gold-600'
                        }`}
                      >
                        All {CATEGORY_DATA.find(c => c.id === currentCategory || c.name.toLowerCase() === currentCategory.toLowerCase())?.name}
                      </button>
                      {CATEGORY_DATA.find((c) => c.id === currentCategory || c.name.toLowerCase() === currentCategory.toLowerCase()).sub.map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setFilter(currentCategory, sub, currentBrand)}
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
