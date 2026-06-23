import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Mail, Phone, MapPin } from 'lucide-react';
import { SITE_URL, SOCIAL_INSTAGRAM, SOCIAL_FACEBOOK } from '../seo/seoData';
import { WHATSAPP_NUMBER } from '../lib/storeContact';

const Footer = () => {
  return (
    <footer className="bg-navy-950 pt-24 pb-12 border-t border-gold-500/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
          <div className="space-y-8">
            <h2 className="text-3xl font-serif font-bold text-gradient-gold">PRINCE ESQUIRE</h2>
            <p className="text-navy-300 font-light leading-relaxed">
              Defining the standard of excellence in luxury fashion for the modern gentleman.
              Quality craftsmanship meets timeless elegance.
            </p>
            <div className="flex space-x-6">
              <motion.a
                href={SOCIAL_INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Prince Esquire on Instagram"
                whileHover={{ y: -5, color: '#c58a3d' }}
                className="text-navy-400 hover:text-gold-500 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </motion.a>
              <motion.a
                href={SOCIAL_FACEBOOK}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Prince Esquire on Facebook"
                whileHover={{ y: -5, color: '#c58a3d' }}
                className="text-navy-400 hover:text-gold-500 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </motion.a>
              <motion.a href="#" whileHover={{ y: -5, color: '#c58a3d' }} className="text-navy-400 hover:text-gold-500 transition-colors" aria-label="Social link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
              </motion.a>
              <motion.a href="#" whileHover={{ y: -5, color: '#c58a3d' }} className="text-navy-400 hover:text-gold-500 transition-colors" aria-label="Social link">
                <Globe size={20} />
              </motion.a>
            </div>
          </div>

          <div>
            <h3 className="text-gold-400 font-serif text-xl mb-8">Collections</h3>
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

          <div>
            <h3 className="text-gold-400 font-serif text-xl mb-8">Support</h3>
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

        <div className="flex flex-col md:flex-row justify-between items-center py-12 border-y border-gold-500/10 gap-8">
          <div className="flex items-center space-x-4 text-navy-400">
            <MapPin size={18} className="text-gold-600" />
            <span className="text-xs">Prince Esquire Boutique, Nairobi</span>
          </div>
          <div className="flex items-center space-x-4 text-navy-400">
            <Phone size={18} className="text-gold-600" />
            <span className="text-xs">0724-494089</span>
          </div>
          <div className="flex items-center space-x-4 text-navy-400">
            <Mail size={18} className="text-gold-600" />
            <span className="text-xs">prince.esquire.staff@gmail.com</span>
          </div>
          <a href={SITE_URL} className="flex items-center space-x-4 text-navy-400 hover:text-gold-400 transition-colors">
            <Globe size={18} className="text-gold-600" />
            <span className="text-xs">prince-esquire.co.ke</span>
          </a>
          <a href={SOCIAL_INSTAGRAM} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 text-navy-400 hover:text-gold-400 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-600" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            <span className="text-xs">@prince_esquire.1</span>
          </a>
          <a href={SOCIAL_FACEBOOK} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 text-navy-400 hover:text-gold-400 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-600" aria-hidden="true">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
            <span className="text-xs">prince.esquire254</span>
          </a>
        </div>

        <div className="text-center pt-12">
          <p className="text-[10px] text-navy-500 tracking-[0.4em]">
            Copyright 2026 PRINCE ESQUIRE. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="group fixed bottom-6 right-6 flex h-12 w-12 items-center overflow-hidden rounded-full bg-[#25D366] shadow-lg transition-all duration-300 hover:w-40"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center">
          <svg viewBox="0 0 448 512" aria-hidden="true" className="h-[22px] w-[22px] fill-white">
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32 101.2 32 0 133.2 0 256c0 45.1 11.7 89.2 33.8 127.1L0 480l97.7-33.3C134.5 468.1 178 480 223.9 480c122.7 0 223.9-101.2 223.9-224 0-59.3-23.1-115.1-66.9-158.9zM223.9 438.6c-39.7 0-78.6-10.7-112.3-31l-7.8-4.6-57.7 19.7 19.3-56.1-5-8c-21.9-34.8-33.5-75-33.5-116.6 0-119.2 97-216.2 216.2-216.2 57.7 0 111.9 22.5 152.9 63.5 41 41 63.5 95.2 63.5 152.9 0 119.2-97 216.3-215.6 216.3zm125.2-162.6c-6.8-3.4-40.4-20-46.7-22.4-6.2-2.4-10.8-3.4-15.4 3.4-4.6 6.8-17.8 22.4-21.8 27-4 4.6-8 5.1-14.8 1.7-6.8-3.4-28.5-10.5-54.3-33.5-20.1-17.9-33.7-40-37.7-46.8-4-6.8-.4-10.4 3-13.8 3.1-3.1 6.8-8.1 10.2-12.1 3.4-4 4.5-6.8 6.8-11.3 2.3-4.6 1.1-8.6-.6-12.1-1.7-3.4-15.4-37.1-21.1-50.8-5.5-13.2-11.1-11.4-15.4-11.7-4-.2-8.6-.2-13.2-.2s-12.1 1.7-18.4 8.6c-6.2 6.8-23.9 23.4-23.9 57.1 0 33.7 24.5 66.2 27.9 70.8 3.4 4.6 48.3 73.9 117 103.5 16.4 7.1 29.2 11.3 39.2 14.5 16.5 5.2 31.5 4.5 43.4 2.7 13.2-2 40.4-16.5 46-32.4 5.7-15.9 5.7-29.6 4-32.4-1.7-2.8-6.2-4.5-13-7.9z" />
          </svg>
        </span>
        <span className="ml-1 whitespace-nowrap text-white font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          WhatsApp
        </span>
      </a>
    </footer>
  );
};

export default Footer;
