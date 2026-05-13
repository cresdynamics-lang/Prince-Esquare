import { motion } from 'framer-motion';
import { Globe, Compass, MessageSquare, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-navy-950 pt-24 pb-12 border-t border-gold-500/10 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          {/* Brand Info */}
          <div className="space-y-8">
            <h2 className="text-3xl font-serif font-bold text-gradient-gold tracking-widest">PRINCE ESQUIRE</h2>
            <p className="text-navy-300 font-light leading-relaxed">
              Defining the standard of excellence in luxury fashion for the modern gentleman.
              Quality craftsmanship meets timeless elegance.
            </p>
            <div className="flex space-x-6">
              {[Globe, Compass, MessageSquare].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ y: -5, color: '#c58a3d' }}
                  className="text-navy-400 transition-colors"
                >
                  <Icon size={20} />
                </motion.a>
              ))}
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
              {['Contact Us', 'Bespoke Services', 'Shipping & Returns', 'Size Guide', 'Privacy Policy'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-navy-400 hover:text-gold-400 transition-colors font-light text-sm tracking-wide">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-8">
            <h3 className="text-gold-400 font-serif text-xl mb-8 tracking-widest">The Inner Circle</h3>
            <p className="text-navy-300 font-light text-sm">
              Join our exclusive list for early access to new collections and private sales.
            </p>
            <div className="relative">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full bg-navy-900/50 border border-gold-500/10 py-4 px-6 text-sm focus:border-gold-500 outline-none transition-all placeholder:text-navy-500 tracking-wider"
              />
              <button className="absolute right-2 top-2 bottom-2 bg-gold-600 px-6 text-navy-950 text-xs font-bold uppercase tracking-widest hover:bg-gold-500 transition-colors">
                Join
              </button>
            </div>
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
    </footer>
  );
};

export default Footer;
