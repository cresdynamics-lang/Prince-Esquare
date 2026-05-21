import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative h-screen flex items-center overflow-hidden bg-navy-950">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-1/2 h-full">
          <motion.div 
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ duration: 2 }}
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: "url('/WhatsApp Image 2026-05-12 at 8.07.12 PM.jpeg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-navy-950/80 to-navy-950" />
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="flex items-center space-x-4">
              <div className="h-px w-12 bg-gold-600" />
              <p className="text-gold-500 tracking-[0.4em] uppercase text-[10px] font-bold">Excellence in every stitch</p>
            </div>
            
            <h1 className="text-6xl md:text-9xl font-serif text-white leading-tight">
              Bespoke <br />
              <span className="text-gold-500 italic">Elegance.</span>
            </h1>
            
            <p className="text-lg text-slate-300 max-w-xl font-light leading-relaxed">
              Experience the pinnacle of luxury tailoring and curated footwear. 
              Crafted for the modern gentleman who demands nothing less than perfection.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-6 sm:space-y-0 sm:space-x-8 pt-8">
              <Link 
                to="/products"
                className="bg-gold-600 text-navy-950 px-12 py-5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gold-500 transition-all flex items-center space-x-4 group"
              >
                <span>Discover Collection</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button className="flex items-center space-x-4 group">
                <div className="w-16 h-16 rounded-full border border-gold-600/30 flex items-center justify-center group-hover:bg-gold-600 group-hover:border-gold-600 transition-all duration-500">
                  <Play size={20} className="text-gold-500 group-hover:text-navy-950 fill-current" />
                </div>
                <span className="text-gold-500 text-[10px] font-bold uppercase tracking-[0.2em]">Watch Film</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative vertical text */}
      <div className="absolute right-10 bottom-20 origin-right rotate-90 hidden lg:block">
        <p className="text-gold-600/30 text-[10px] font-bold tracking-[1em] uppercase">Prince Esquare · 2026</p>
      </div>
    </section>
  );
};

export default Hero;
