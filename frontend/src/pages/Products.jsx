import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { products } from '../data/products';
import { ShoppingBag, Search, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Products = () => {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = ['All', ...new Set(products.map(p => p.category))];
  const featuredProducts = products.filter(p => p.featured);

  const filteredProducts = products.filter(product => {
    const matchesFilter = filter === 'All' || product.category === filter;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-navy-950 min-h-screen font-serif">
      <Navbar />

      {/* Featured Products Hero Section */}
      <section className="pt-32 pb-24 bg-navy-950 overflow-hidden border-b border-gold-600/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <div className="space-y-4">
              <span className="text-gold-500 text-[10px] uppercase tracking-[0.4em] font-bold">Curated Selections</span>
              <h1 className="text-5xl md:text-7xl font-serif text-white tracking-tight">The Featured Edit</h1>
            </div>
            <Link to="/products" className="hidden md:flex items-center space-x-3 text-[10px] font-bold uppercase tracking-widest text-gold-500 group mt-6 md:mt-0">
              <span>View Full Collection</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="flex overflow-x-auto pb-8 space-x-8 scrollbar-hide snap-x snap-mandatory">
            {featuredProducts.map((p) => (
              <motion.div 
                key={p.id}
                className="min-w-[300px] md:min-w-[450px] snap-start"
                whileHover={{ y: -10 }}
              >
                <Link to={`/product/${p.id}`} className="block group">
                  <div className="aspect-[4/5] bg-navy-950 overflow-hidden rounded-sm mb-6 border border-gold-600/10 group-hover:border-gold-600 transition-colors">
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold-600/50">{p.brand}</span>
                    <h3 className="text-2xl font-serif text-white group-hover:text-gold-500 transition-colors">{p.name}</h3>
                    <p className="text-gold-500 font-light italic">KSh {p.price.toLocaleString()}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Catalog */}
      <main className="py-20">
        <div className="container mx-auto px-6">
          
          {/* Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-8 md:space-y-0 mb-16 border-b border-gold-600/10 pb-12">
            <div className="flex flex-wrap gap-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-8 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    filter === cat 
                      ? 'bg-gold-600 text-navy-950' 
                      : 'bg-navy-950 text-gold-600/50 border border-gold-600/10 hover:text-gold-500 hover:border-gold-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600/30 group-focus-within:text-gold-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search collection..."
                className="w-full pl-12 pr-4 py-4 bg-navy-950 border border-gold-600/10 text-[10px] uppercase tracking-widest text-white focus:border-gold-600 outline-none transition-all placeholder:text-gold-600/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Product Grid */}
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
                  <Link to={`/product/${product.id}`} className="block">
                    <div className="relative aspect-square bg-navy-950 overflow-hidden mb-6 border border-gold-600/10 group-hover:border-gold-600 transition-colors">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {product.featured && (
                        <div className="absolute top-4 left-4 bg-gold-600 text-navy-950 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                          Featured
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gold-600/40">{product.brand}</p>
                      <h3 className="text-lg font-serif text-white group-hover:text-gold-500 transition-colors leading-tight min-h-[50px]">
                        {product.name}
                      </h3>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm font-light text-gold-500 italic">KSh {product.price.toLocaleString()}</span>
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

          {filteredProducts.length === 0 && (
            <div className="py-32 text-center">
              <p className="text-gold-600/30 text-[10px] uppercase tracking-widest font-bold">No products found.</p>
              <button 
                onClick={() => {setFilter('All'); setSearchQuery('');}}
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
