import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import CategoryGrid from '../components/CategoryGrid';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div className="bg-navy-950 min-h-screen">
      <Navbar />
      
      <main>
        <Hero />
        
        {/* Quote Section */}
        <section className="py-32 bg-navy-950 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-gold-500/50 to-transparent" />
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-4xl md:text-5xl font-serif italic text-gold-200 leading-tight">
                "Style is a way to say who you are without having to speak."
              </h2>
              <div className="flex items-center justify-center space-x-4">
                <div className="w-12 h-px bg-gold-600/30" />
                <span className="text-gold-500 tracking-[0.3em] text-[10px] uppercase font-bold">Christian Dior</span>
                <div className="w-12 h-px bg-gold-600/30" />
              </div>
            </motion.div>
          </div>
        </section>

        <CategoryGrid />

        {/* Brand Promise Section */}
        <section className="py-32 border-y border-gold-500/10">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {[
                { title: 'The Finest Materials', desc: 'Sourcing only the most exquisite fabrics from Italy and the UK.' },
                { title: 'Artisanal Craft', desc: 'Every garment is a masterpiece created by our master tailors.' },
                { title: 'Concierge Service', desc: 'A personalized shopping experience tailored to your lifestyle.' }
              ].map((promise, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="text-center space-y-6"
                >
                  <h3 className="text-xl font-serif text-gold-400 uppercase tracking-widest">{promise.title}</h3>
                  <p className="text-navy-300 font-light text-sm leading-relaxed">{promise.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
