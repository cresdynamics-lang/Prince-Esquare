import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const collections = [
  {
    title: 'The Modern Suit',
    category: 'suits',
    image: '/WhatsApp Image 2026-05-12 at 8.07.17 PM.jpeg',
    size: 'large'
  },
  {
    title: 'Artisanal Footwear',
    category: 'shoes',
    image: '/WhatsApp Image 2026-05-12 at 8.07.12 PM.jpeg',
    size: 'small'
  },
  {
    title: 'Casual Sophistication',
    category: 'polo-t-shirts',
    image: '/WhatsApp Image 2026-05-12 at 8.07.10 PM.jpeg',
    size: 'small'
  }
];

const ProductShowcase = () => {
  return (
    <section className="py-32 bg-navy-950">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl space-y-6">
            <h2 className="text-4xl md:text-6xl font-serif text-white leading-tight">
              Curated <span className="text-gold-500 italic">Masterpieces</span>
            </h2>
            <p className="text-navy-300 font-light leading-relaxed">
              Discover our latest arrivals, featuring hand-selected fabrics and timeless designs 
              that bridge the gap between tradition and contemporary style.
            </p>
          </div>
          <Link 
            to="/products"
            className="text-gold-500 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-4 hover:gap-6 transition-all"
          >
            View All Products <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-[800px]">
          {collections.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className={`relative overflow-hidden group cursor-pointer ${
                item.size === 'large' ? 'md:col-span-8' : 'md:col-span-4'
              }`}
            >
              <Link to={`/products?category=${item.category}`}>
                <div className="absolute inset-0 bg-navy-950/20 group-hover:bg-navy-950/0 transition-all duration-700 z-10" />
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent opacity-80" />
                
                <div className="absolute bottom-10 left-10 z-20 space-y-2">
                  <p className="text-gold-500 text-[10px] font-bold uppercase tracking-widest">{item.category}</p>
                  <h3 className="text-2xl font-serif text-white uppercase tracking-tight">{item.title}</h3>
                  <div className="pt-4 overflow-hidden">
                    <span className="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
                      Explore <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
