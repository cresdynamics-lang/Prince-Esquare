import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HeroSlider from '../components/HeroSlider';
import ProductShowcase from '../components/ProductShowcase';
import CategoryGrid from '../components/CategoryGrid';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="bg-navy-950 min-h-screen">
      <Navbar />
      
      <main>
        <HeroSlider />
        
        {/* Quote Section */}
        <section className="py-40 bg-navy-950 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-gold-500/50 to-transparent" />
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-4xl md:text-6xl font-serif italic text-gold-200 leading-tight">
                "True elegance is not being noticed, it's being remembered."
              </h2>
              <div className="flex items-center justify-center space-x-6">
                <div className="w-16 h-px bg-gold-600/30" />
                <span className="text-gold-500 tracking-[0.5em] text-[10px] uppercase font-bold">Giorgio Armani</span>
                <div className="w-16 h-px bg-gold-600/30" />
              </div>
            </motion.div>
          </div>
        </section>

        <ProductShowcase />

        <CategoryGrid />

        {/* Video Background CTA */}
        <section className="relative h-[600px] flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-fixed bg-cover bg-center" style={{ backgroundImage: 'url("/WhatsApp Image 2026-05-12 at 8.07.18 PM.jpeg")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-[2px]" />
          </div>
          <div className="container mx-auto px-6 relative z-10 text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto space-y-10"
            >
              <h3 className="text-gold-500 tracking-[0.3em] uppercase text-xs font-bold">The Prince Experience</h3>
              <h2 className="text-4xl md:text-7xl font-serif text-white uppercase tracking-tighter leading-none">
                Crafted For <br />
                <span className="text-gold-500 italic">Discerning Taste</span>
              </h2>
              <p className="text-navy-200 font-light leading-relaxed max-w-xl mx-auto">
                Step into a world where every detail is considered, every stitch is intentional, 
                and your unique style is celebrated.
              </p>
              <Link 
                to="/signup"
                className="inline-block bg-transparent border border-gold-600 text-gold-500 px-16 py-6 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-gold-600 hover:text-navy-950 transition-all shadow-2xl shadow-gold-600/20"
              >
                Join the Inner Circle
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Brand Promise Section */}
        <section className="py-40 bg-navy-900/30">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-24">
              {[
                { title: 'The Finest Materials', desc: 'Sourcing only the most exquisite fabrics from the heritage mills of Italy and the UK.', icon: '01' },
                { title: 'Artisanal Craft', desc: 'Every garment is a unique masterpiece created by our master tailors with decades of experience.', icon: '02' },
                { title: 'Personalized Concierge', desc: 'Our sartorial experts are at your service to curate a wardrobe that fits your unique lifestyle.', icon: '03' }
              ].map((promise, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="space-y-8 group"
                >
                  <span className="text-6xl font-serif text-gold-600/10 group-hover:text-gold-600/20 transition-colors duration-500 block">{promise.icon}</span>
                  <h3 className="text-xl font-serif text-gold-400 uppercase tracking-widest border-b border-gold-600/10 pb-4">{promise.title}</h3>
                  <p className="text-navy-300 font-light text-sm leading-relaxed">{promise.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Newsletter */}
      <section className="py-32 bg-navy-950 border-t border-gold-600/10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-12">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold-500">The Gentleman's Registry</span>
              <h2 className="text-4xl md:text-5xl font-serif text-white">Join the Elite</h2>
              <p className="text-slate-400 font-light max-w-xl mx-auto italic">
                Subscribe to receive exclusive access to new collections, seasonal editorials, and private invitations.
              </p>
            </div>
            
            <form className="flex flex-col md:flex-row gap-4">
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                className="flex-1 bg-navy-900 border border-gold-600/20 px-8 py-5 text-[10px] font-bold tracking-widest text-white focus:border-gold-600 outline-none transition-all placeholder:text-gold-600/30"
              />
              <button className="bg-gold-600 text-navy-950 px-12 py-5 text-[10px] font-bold uppercase tracking-widest hover:bg-gold-500 transition-all shadow-xl shadow-gold-600/10">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
