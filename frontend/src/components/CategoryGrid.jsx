import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { adminCategoryAPI } from '../services/api';

const dummyCategories = [
  {
    title: 'The Shoe Atelier',
    subtitle: 'Premium Italian Craftsmanship',
    image: '/WhatsApp Image 2026-05-12 at 8.07.37 PM.jpeg',
    span: 'col-span-1 row-span-2',
    category: 'shoes',
  },
  {
    title: 'Luxury Tracksuits',
    subtitle: 'Prada & Zegna Collections',
    image: '/WhatsApp Image 2026-05-12 at 8.07.17 PM.jpeg',
    span: 'col-span-1 row-span-1',
    category: 'tracksuits',
  },
  {
    title: 'Executive Shirts',
    subtitle: 'The Presidential Series',
    image: '/WhatsApp Image 2026-05-12 at 8.07.30 PM.jpeg',
    span: 'col-span-1 row-span-1',
    category: 'shirts',
  },
  {
    title: 'Tailored Essentials',
    subtitle: 'Dockers & Smart Trousers',
    image: '/WhatsApp Image 2026-05-12 at 8.07.20 PM.jpeg',
    span: 'col-span-2 row-span-1',
    category: 'trousers',
  },
];

const CategoryGrid = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(dummyCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await adminCategoryAPI.getAll();
        const fetchedCats = res.data.data || [];
        
        // Map to our UI format
        const formattedCats = fetchedCats.map((c, i) => ({
          title: c.name,
          subtitle: c.description || 'Premium Collection',
          image: c.image || '/WhatsApp Image 2026-05-12 at 8.07.37 PM.jpeg',
          span: 'col-span-1 row-span-1',
          category: c.slug || c.name.toLowerCase(),
        }));
        
        // Combine dummy and fetched categories
        setCategories([...dummyCategories, ...formattedCats]);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  if (loading || categories.length === 0) return null;

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
            onClick={() => navigate('/products')}
            className="text-gold-400 border-b border-gold-400/30 pb-2 uppercase text-[10px] tracking-[0.2em] font-bold hover:text-gold-200 hover:border-gold-200 transition-all"
          >
            Explore All Categories
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-8 h-auto md:h-[900px]">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              className={`relative overflow-hidden group cursor-pointer ${cat.span} border border-gold-500/10`}
              onClick={() => navigate(`/products?category=${cat.category}`)}
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
