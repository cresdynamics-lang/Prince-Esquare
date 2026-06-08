import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CATEGORY_TILES } from '../data/homepageContent';

const CategoryGrid = () => {
  const navigate = useNavigate();

  useEffect(() => {
    CATEGORY_TILES.forEach((cat) => {
      const img = new Image();
      img.src = cat.image;
    });
  }, []);

  return (
    <section className="py-32 bg-navy-950">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2 className="text-4xl md:text-7xl font-serif text-white">Curated Collections</h2>
            <div className="flex items-center space-x-4">
              <div className="h-px w-12 bg-gold-600" />
              <p className="text-gold-400 tracking-[0.3em] uppercase text-[10px] font-bold">Discover your signature style</p>
            </div>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            type="button"
            onClick={() => navigate('/products')}
            className="text-gold-400 border-b border-gold-400/30 pb-2 uppercase text-[10px] tracking-[0.2em] font-bold hover:text-gold-200 hover:border-gold-200 transition-all"
          >
            Explore All Categories
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[360px] md:auto-rows-[260px] gap-8">
          {CATEGORY_TILES.map((cat, index) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              className={`relative min-h-[360px] md:min-h-0 overflow-hidden group cursor-pointer ${cat.span} border border-gold-500/10`}
              onClick={() => navigate(cat.path || `/products?category=${cat.category}`)}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.5s] group-hover:scale-110"
                style={{ backgroundImage: `url('${cat.image}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="absolute bottom-10 left-10 right-10 transition-transform duration-700 transform group-hover:-translate-y-4">
                <span className="text-gold-500 text-[10px] uppercase tracking-[0.4em] font-bold block mb-4 opacity-80">{cat.subtitle}</span>
                <h3 className="text-3xl font-serif text-white uppercase tracking-wider mb-6 leading-tight">{cat.title}</h3>
                <div className="w-12 group-hover:w-full h-px bg-gold-500 transition-all duration-1000" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
