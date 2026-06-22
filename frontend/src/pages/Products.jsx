import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useCartStore } from '../store/useCartStore';
import { getPremiumImage } from '../utils/productImages';
import { catalogueAPI, productAPI, adminCategoryAPI } from '../services/api';
import { buildBreadcrumbSchema, categoryFallbackIntro, routeSeo } from '../seo/seoData';
const categoryPages = ['polo-t-shirts', 'shoes', 'shirts', 'suits', 'trousers', 'linen'];

const CATEGORY_DATA = [
  { id: 'All', name: 'All', sub: [] },
  { id: 'polo-t-shirts', name: 'Polo T-shirts', sub: ['Knitted Polos', 'Polos'] },
  { id: 'shoes', name: 'Shoes', sub: ['Formal shoes', 'Casual', 'Boots', 'Sandals', 'Loafers'] },
  { id: 'trousers', name: 'Trousers', sub: ['Khaki', 'Formal', 'Chino', 'Jeans', 'Gurkha'] },
  { id: 'shirts', name: 'Shirts', sub: ['Formal shirts', 'Casual', 'Presidential'] },
  { id: 'suits', name: 'Suits', sub: ['Two piece', 'Three piece'] },
  { id: 'blazers', name: 'Blazers', sub: ['Modern', 'Casual', 'Classic'] },
  { id: 'track-suits', name: 'Track Suits', sub: [] },
  { id: 'jackets', name: 'Jackets', sub: ['Jackets', 'Half jackets'] },
  { id: 'linen', name: 'Linen', sub: ['Linen Set', 'Linen Trousers', 'Linen shirts', 'Linen shorts'] },
  { id: 'caps-hats', name: 'Caps & Hats', sub: [] },
  { id: 'belts-ties', name: 'Belts & Ties', sub: [] },
  { id: 'sweaters', name: 'Sweaters', sub: [] },
  { id: 't-shirts', name: 'T-shirts', sub: ['Sweat-shirts', 'Round-neck T-shirts', 'V-neck T-shirts'] },
];

const normalizeName = (value) => String(value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const orderDatabaseCategories = (categories) => {
  const ordered = CATEGORY_DATA.slice(1)
    .map((canonical) => {
      const fromDatabase = categories.find((category) => (
        normalizeName(category.id) === normalizeName(canonical.id) ||
        normalizeName(category.name) === normalizeName(canonical.name)
      ));

      if (!fromDatabase) return null;

      const databaseSubs = fromDatabase.sub || [];
      const orderedSubs = [
        ...canonical.sub.filter((sub) => databaseSubs.some((dbSub) => normalizeName(dbSub) === normalizeName(sub))),
        ...databaseSubs.filter((dbSub) => !canonical.sub.some((sub) => normalizeName(sub) === normalizeName(dbSub))),
      ];

      return {
        id: fromDatabase.id || canonical.id,
        name: fromDatabase.name || canonical.name,
        sub: orderedSubs.length ? orderedSubs : canonical.sub,
      };
    })
    .filter(Boolean);

  return ordered.length ? [{ id: 'All', name: 'All', sub: [] }, ...ordered] : CATEGORY_DATA;
};

const matchesText = (value, target) => (value || '').toLowerCase() === (target || '').toLowerCase();

const filterCatalogueProducts = (allProducts, category, sub) => {
  return allProducts.filter((product) => {
    const productCategory = product.category_slug || product.category_name;
    const parentCategory = product.parent_category_slug || product.parent_category_name;

    const matchesCategory = category === 'All' || [
      productCategory,
      parentCategory,
      product.category_name,
      product.parent_category_name,
    ].some((value) => matchesText(value, category));

    const matchesSub = sub === 'All' || [
      productCategory,
      product.category_name,
      product.subcategory,
    ].some((value) => matchesText(value, sub));

    return matchesCategory && matchesSub;
  });
};

const Products = ({ categoryOverride = null }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);
  
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [addedProductId, setAddedProductId] = useState(null);
  const [fetchError, setFetchError] = useState('');

  const isDedicatedCategoryPage = Boolean(categoryOverride);
  const currentCategory = categoryOverride || searchParams.get('category') || 'All';
  const currentSub = searchParams.get('sub') || 'All';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setFetchError('');
      const params = {};
      if (currentCategory !== 'All') params.category = currentCategory;
      if (currentSub !== 'All') params.sub = currentSub;

      try {
        const catalogueRes = await catalogueAPI.get();
        const catalogue = catalogueRes.data.data || {};
        const fetchedProducts = filterCatalogueProducts(catalogue.products || [], currentCategory, currentSub);
        const allCats = catalogue.categories || [];
        const parents = allCats.filter(c => !c.parent_id);
        const organized = parents.map(p => ({
          id: p.slug,
          name: p.name,
          sub: allCats.filter(c => c.parent_id === p.id).map(c => c.name)
        }));
        setDynamicCategories(organized);
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        try {
          const [response, catRes] = await Promise.all([
            productAPI.list(params),
            adminCategoryAPI.getAll().catch(() => ({ data: { data: [] } })),
          ]);
          const fetchedProducts = response.data.data.products || response.data.data || [];
          const allCats = catRes.data.data || [];
          const parents = allCats.filter(c => !c.parent_id);
          setDynamicCategories(parents.map(p => ({
            id: p.slug,
            name: p.name,
            sub: allCats.filter(c => c.parent_id === p.id).map(c => c.name)
          })));
          setProducts(fetchedProducts);
        } catch (fallbackError) {
          console.error('Fallback product fetch failed:', fallbackError);
          setFetchError('Could not load products. Please check your connection and try again.');
          setProducts([]);
        }
      } finally {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    };
    fetchData();
  }, [currentCategory, currentSub]);

  const allCategoryData = dynamicCategories.length ? orderDatabaseCategories(dynamicCategories) : CATEGORY_DATA;

  const selectedCategory = allCategoryData.find(c => c.id === currentCategory || c.name.toLowerCase() === currentCategory.toLowerCase());
  const seo = routeSeo[currentCategory] || routeSeo.products;
  const intro = seo.introCopy
    ? { title: seo.introTitle, copy: seo.introCopy }
    : categoryFallbackIntro;
  const subCategoryList = currentCategory === 'All'
    ? [...new Set(allCategoryData.flatMap((category) => category.sub || []))]
    : selectedCategory?.sub || [];

  const setFilter = (cat, sub = 'All') => {
    const params = {};

    if (cat === 'All') {
      if (sub !== 'All') params.sub = sub;
      navigate(`/products${Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : ''}`);
      return;
    }

    if (sub !== 'All') params.sub = sub;

    if (categoryPages.includes(cat)) {
      navigate(`/${cat}${Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : ''}`);
      return;
    }

    params.category = cat;
    if (sub !== 'All') params.sub = sub;
    setSearchParams(params);
  };

  const handleQuickAdd = async (product) => {
    const needsSize = ['shoes', 'shirts', 'trousers', 'suits', 'tracksuits', 'jackets', 'linen', 't-shirts', 'polo-t-shirts'].includes((product.category_name || '').toLowerCase());
    
    if (needsSize) {
      navigate(`/product/${product.slug}`);
    } else {
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
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (stockFilter === 'in_stock' && product.out_of_stock) return false;
    if (stockFilter === 'out_of_stock' && !product.out_of_stock) return false;
    return true;
  });

  return (
    <div className="bg-navy-950 min-h-screen font-serif">
      <SEO
        {...seo}
        schema={[
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: currentCategory === 'All' ? 'Collections' : selectedCategory?.name || 'Collections', path: seo.path },
          ]),
        ]}
      />
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="flex items-center space-x-4 mb-8">
            <button onClick={() => navigate(-1)} className="text-gold-500 hover:text-gold-200 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <span className="text-[10px]   text-gold-600/50">Back</span>
          </div>
          <div className="mb-12">
            <span className="text-gold-500 text-[10px]  tracking-[0.4em] font-bold">Prince Esquire</span>
            <h1 className="text-5xl md:text-6xl font-serif text-white tracking-tight mt-2">
              {currentCategory === 'All' ? 'Our Collections' : selectedCategory?.name}
            </h1>
            <div className="max-w-3xl mt-6 space-y-3">
              <h2 className="text-xl md:text-2xl font-serif text-gold-300">{intro.title}</h2>
              <p className="text-sm md:text-base text-navy-300 font-light leading-relaxed">{intro.copy}</p>
            </div>
            <div className="flex gap-4 mt-4">
                {currentSub !== 'All' && (
                <p className="text-gold-600/60 text-[12px]  ">
                    Exploring: {currentSub}
                </p>
                )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-8 md:space-y-0 mb-16 border-b border-gold-600/10 pb-12">
            <div className="w-full space-y-8">
              {!isDedicatedCategoryPage && (
              <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                {allCategoryData.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFilter(cat.id, 'All')}
                    className={`shrink-0 px-6 py-2.5 text-[9px] font-bold  tracking-[0.2em] transition-all border ${
                      currentCategory === cat.id || currentCategory.toLowerCase() === cat.name.toLowerCase()
                        ? 'bg-gold-600 text-navy-950 border-gold-600'
                        : 'bg-navy-900/50 text-gold-400 border-gold-600/30 hover:border-gold-500 hover:text-gold-200 hover:bg-navy-800'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              )}

              <div className={`flex gap-2 items-center overflow-x-auto custom-scrollbar pb-2 ${isDedicatedCategoryPage ? '' : 'pt-4 border-t border-gold-600/5'}`}>
                 <span className="text-[8px] font-black  text-gold-500/80 mr-2 ">
                   Sub Categories:
                 </span>
                 <button
                  type="button"
                  onClick={() => setFilter(currentCategory, 'All')}
                  className={`shrink-0 px-4 py-1.5 text-[8px] font-bold   transition-all rounded-full border ${
                      currentSub === 'All'
                        ? 'bg-gold-600/20 text-gold-400 border-gold-500/50 shadow-sm'
                        : 'bg-navy-900/30 text-gold-400/80 border-gold-600/20 hover:border-gold-500/50 hover:text-gold-200 hover:bg-navy-800/50'
                    }`}
                 >
                   All
                 </button>
                 {subCategoryList.map((sub) => (
                   <button
                    key={sub}
                    type="button"
                    onClick={() => setFilter(currentCategory, sub)}
                    className={`shrink-0 px-4 py-1.5 text-[8px] font-bold   transition-all rounded-full border ${
                        currentSub === sub
                          ? 'bg-gold-600/20 text-gold-400 border-gold-500/50 shadow-sm'
                          : 'bg-navy-900/30 text-gold-400/80 border-gold-600/20 hover:border-gold-500/50 hover:text-gold-200 hover:bg-navy-800/50'
                      }`}
                   >
                     {sub}
                   </button>
                 ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="bg-navy-950 border border-gold-600/10 text-[10px]   text-white px-4 py-4 outline-none focus:border-gold-600"
              >
                <option value="all">All availability</option>
                <option value="in_stock">In stock only</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
              <div className="relative w-full md:w-80 group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600/30 group-focus-within:text-gold-500 transition-colors"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search collection..."
                  className="w-full pl-12 pr-4 py-4 bg-navy-950 border border-gold-600/10 text-[10px]   text-white focus:border-gold-600 outline-none transition-all placeholder:text-gold-600/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {fetchError && (
            <p className="text-center text-red-400/80 text-sm py-8">{fetchError}</p>
          )}

          {loading ? (
            <p className="text-center text-gold-600/50 text-[10px]   py-24">Loading collection…</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-10 gap-y-12 sm:gap-y-20">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, index) => {
                  const outOfStock = product.out_of_stock === true;
                  return (
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
                          src={product.image_url || getPremiumImage(product, { width: 400 })}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          fetchPriority={index < 2 ? 'high' : 'low'}
                          className={`w-full h-full object-contain p-3 bg-white transition-transform duration-700 group-hover:scale-105 ${outOfStock ? 'opacity-50' : ''}`}
                        />
                        {outOfStock && (
                          <span className="absolute top-3 left-3 bg-red-600/90 text-white text-[9px] font-bold  tracking-wider px-2 py-1">
                            Out of Stock
                          </span>
                        )}
                        <div className="absolute inset-0 bg-navy-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 px-4">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              if (!outOfStock) handleQuickAdd(product);
                            }}
                            disabled={outOfStock}
                            className="bg-white text-navy-950 px-5 py-3 text-[10px] font-bold   transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 disabled:opacity-40"
                          >
                            {outOfStock ? 'Unavailable' : addedProductId === product.id ? 'Added' : 'Add to Cart'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/product/${product.slug}`);
                            }}
                            className="border border-white/70 text-white px-5 py-3 text-[10px] font-bold   transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:bg-white hover:text-navy-950"
                          >
                            View Product
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold   text-gold-600/50">{product.brand_name}</span>
                        </div>
                        <h3 className="text-lg font-serif text-white group-hover:text-gold-500 transition-colors">{product.name}</h3>
                        <p className="text-gold-500 font-light italic">KSh {parseFloat(product.price).toLocaleString()}</p>
                      </div>
                    </Link>
                  </motion.div>
                );})}
              </AnimatePresence>
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-24 space-y-4">
              <p className="text-gold-600/50 text-[10px]  ">No pieces found in this curation.</p>
              <button 
                onClick={() => setFilter('All')}
                className="text-white text-[10px] font-bold   border-b border-white/20 pb-1 hover:border-white transition-all"
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
