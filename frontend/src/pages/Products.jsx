<<<<<<< HEAD
import { useState } from 'react';
=======
import { useState, useEffect } from 'react';
>>>>>>> ec8acc1feea52c2a4e0fe3f7a142e93e768c5f5e
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { productAPI } from '../services/api';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
<<<<<<< HEAD
  const categoryParam = searchParams.get('category');
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = ['All', ...new Set(products.map(p => p.category))];
  const filter = categories.includes(categoryParam) ? categoryParam : 'All';
  const featuredProducts = products.filter(p => p.featured);

  const updateFilter = (category) => {
    setSearchParams(category === 'All' ? {} : { category });
  };

  const filteredProducts = products.filter(product => {
    const matchesFilter = filter === 'All' || product.category === filter;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
=======
  const filter = searchParams.get('category') || 'All';

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const setFilter = (cat) => {
    if (cat === 'All') setSearchParams({});
    else setSearchParams({ category: cat });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = { limit: 100, page: 1 };
        if (filter !== 'All') params.category = filter;
        const res = await productAPI.list(params);
        if (cancelled) return;
        const list = res.data?.data?.products || [];
        setProducts(list);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const categories = ['All', 'shoes', 'tracksuits', 'trousers', 'shirts', 'outerwear'];
  const featuredProducts = products.filter((p) => p.is_featured);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
>>>>>>> ec8acc1feea52c2a4e0fe3f7a142e93e768c5f5e
  });

  return (
    <div className="bg-navy-950 min-h-screen font-serif">
      <Navbar />

      <section className="pt-32 pb-24 bg-navy-950 overflow-hidden border-b border-gold-600/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <div className="space-y-4">
              <span className="text-gold-500 text-[10px] uppercase tracking-[0.4em] font-bold">Curated Selections</span>
              <h1 className="text-5xl md:text-7xl font-serif text-white tracking-tight">The Featured Edit</h1>
            </div>
            <Link
              to="/products"
              className="hidden md:flex items-center space-x-3 text-[10px] font-bold uppercase tracking-widest text-gold-500 group mt-6 md:mt-0"
            >
              <span>View Full Collection</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="flex overflow-x-auto pb-8 space-x-8 scrollbar-hide snap-x snap-mandatory">
            {featuredProducts.map((p) => (
              <motion.div key={p.id} className="min-w-[300px] md:min-w-[450px] snap-start" whileHover={{ y: -10 }}>
                <Link to={`/product/${p.slug}`} className="block group">
                  <div className="aspect-[4/5] bg-navy-950 overflow-hidden rounded-sm mb-6 border border-gold-600/10 group-hover:border-gold-600 transition-colors">
                    <img
                      src={p.thumbnail}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold-600/50">{p.brand_name}</span>
                    <h3 className="text-2xl font-serif text-white group-hover:text-gold-500 transition-colors">{p.name}</h3>
                    <p className="text-gold-500 font-light italic">KSh {parseFloat(p.price).toLocaleString()}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <main className="py-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-8 md:space-y-0 mb-16 border-b border-gold-600/10 pb-12">
            <div className="flex flex-wrap gap-4">
              {categories.map((cat) => (
                <button
                  key={cat}
<<<<<<< HEAD
                  onClick={() => updateFilter(cat)}
=======
                  type="button"
                  onClick={() => setFilter(cat)}
>>>>>>> ec8acc1feea52c2a4e0fe3f7a142e93e768c5f5e
                  className={`px-8 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    filter === cat
                      ? 'bg-gold-600 text-navy-950'
                      : 'bg-navy-950 text-gold-600/50 border border-gold-600/10 hover:text-gold-500 hover:border-gold-500'
                  }`}
                >
                  {cat === 'All' ? 'All' : cat}
                </button>
              ))}
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
                          src={product.thumbnail}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {product.is_featured && (
                          <div className="absolute top-4 left-4 bg-gold-600 text-navy-950 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                            Featured
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gold-600/40">{product.brand_name}</p>
                        <h3 className="text-lg font-serif text-white group-hover:text-gold-500 transition-colors leading-tight min-h-[50px]">
                          {product.name}
                        </h3>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-sm font-light text-gold-500 italic">
                            KSh {parseFloat(product.price).toLocaleString()}
                          </span>
                          <div className="w-10 h-10 border border-gold-600/20 flex items-center justify-center group-hover:bg-gold-600 group-hover:text-navy-950 transition-all">
                            <ShoppingBag size={14} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="py-32 text-center">
              <p className="text-gold-600/30 text-[10px] uppercase tracking-widest font-bold">No products found.</p>
<<<<<<< HEAD
              <button 
                onClick={() => {updateFilter('All'); setSearchQuery('');}}
=======
              <button
                type="button"
                onClick={() => {
                  setFilter('All');
                  setSearchQuery('');
                }}
>>>>>>> ec8acc1feea52c2a4e0fe3f7a142e93e768c5f5e
                className="mt-6 text-[10px] font-bold uppercase tracking-widest text-gold-500 border-b border-gold-500/30 pb-1"
              >
                Reset Search
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
