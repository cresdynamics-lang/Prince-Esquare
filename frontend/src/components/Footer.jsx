import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Globe, Compass, MessageSquare, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

const Footer = () => {
  const [whatsappOpen, setWhatsappOpen] = React.useState(false);

  return (
    <footer className="bg-navy-950 pt-24 pb-12 border-t border-gold-500/10 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
          {/* Brand Info */}
          <div className="space-y-8">
            <h2 className="text-3xl font-serif font-bold text-gradient-gold tracking-widest">PRINCE ESQUIRE</h2>
            <p className="text-navy-300 font-light leading-relaxed">
              Defining the standard of excellence in luxury fashion for the modern gentleman.
              Quality craftsmanship meets timeless elegance.
            </p>
            <div className="flex space-x-6">
              <motion.a href="#" whileHover={{ y: -5, color: '#c58a3d' }} className="text-navy-400 hover:text-gold-500 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </motion.a>
              <motion.a href="#" whileHover={{ y: -5, color: '#c58a3d' }} className="text-navy-400 hover:text-gold-500 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </motion.a>
              <motion.a href="#" whileHover={{ y: -5, color: '#c58a3d' }} className="text-navy-400 hover:text-gold-500 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </motion.a>
              <motion.a href="#" whileHover={{ y: -5, color: '#c58a3d' }} className="text-navy-400 hover:text-gold-500 transition-colors">
                <Globe size={20} />
              </motion.a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gold-400 font-serif text-xl mb-8 tracking-widest">Collections</h3>
            <ul className="space-y-4">
              {['Formal Wear', 'Casual Collection', 'The Shoe Atelier', 'Linen Basics', 'Accessories'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-navy-400 hover:text-gold-400 transition-colors font-light text-sm tracking-wide">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="text-gold-400 font-serif text-xl mb-8 tracking-widest">Support</h3>
            <ul className="space-y-4">
              {['Contact Us', 'Bespoke Services', 'Shipping & Returns', 'Size Guide', 'Privacy Policy', 'Staff'].map((link) => (
                <li key={link}>
                  <a href={link === 'Staff' ? '/admin' : '#'} className="text-navy-400 hover:text-gold-400 transition-colors font-light text-sm tracking-wide">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Strip */}
        <div className="flex flex-col md:flex-row justify-between items-center py-12 border-y border-gold-500/10 gap-8">
          <div className="flex items-center space-x-4 text-navy-400">
            <MapPin size={18} className="text-gold-600" />
            <span className="text-xs tracking-widest uppercase">Prince Esquire Boutique, Nairobi</span>
          </div>
          <div className="flex items-center space-x-4 text-navy-400">
            <Phone size={18} className="text-gold-600" />
            <span className="text-xs tracking-widest uppercase">0724-494089</span>
          </div>
          <div className="flex items-center space-x-4 text-navy-400">
            <Mail size={18} className="text-gold-600" />
            <span className="text-xs tracking-widest uppercase">prince.esquire.staff@gmail.com</span>
          </div>
          <div className="flex items-center space-x-4 text-navy-400">
            <Globe size={18} className="text-gold-600" />
            <span className="text-xs tracking-widest uppercase">prince-esquire.co.ke</span>
          </div>
        </div>

        <div className="text-center pt-12">
          <p className="text-[10px] text-navy-500 uppercase tracking-[0.4em]">
            © 2026 PRINCE ESQUIRE. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
      {/* WhatsApp Floating Chat */}
      {whatsappOpen ? (
        <div className="fixed bottom-6 right-6 w-64 h-80 bg-white rounded-lg shadow-xl border border-gold-500/20 flex flex-col">
          <div className="flex justify-between items-center p-2 bg-gold-500 text-navy-950 rounded-t-lg">
            <span>WhatsApp Chat</span>
            <button onClick={() => setWhatsappOpen(false)} className="text-sm">✕</button>
          </div>
          <iframe src="https://wa.me/254712345678" className="flex-1 rounded-b-lg" title="WhatsApp Chat" />
        </div>
      ) : (
        <button
          onMouseEnter={() => {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(440, ctx.currentTime);
            o.connect(g);
            g.connect(ctx.destination);
            g.gain.setValueAtTime(0.001, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.01);
            o.start();
            o.stop(ctx.currentTime + 0.1);
          }}
          onClick={() => setWhatsappOpen(true)}
          className="group fixed bottom-6 right-6 bg-gold-500 rounded-full flex items-center overflow-hidden transition-all duration-300 w-12 h-12 hover:w-48"
        >
          <MessageSquare size={24} className="text-navy-950 p-2" />
          <span className="text-navy-950 font-medium ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            WhatsApp
          </span>
          <ArrowRight size={20} className="text-navy-950 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      )}
    </footer>
  );
};

export default Footer;
