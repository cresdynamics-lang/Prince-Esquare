import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/useCartStore';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Cart = () => {
  const { items, removeFromCart, updateQuantity, getTotal } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const lineKey = (item) =>
    item.cartItemId ? `c-${item.cartItemId}` : `g-${item.productId}-${item.variantId}-${item.sizeLabel || ''}`;

  return (
    <div className="bg-navy-950 min-h-screen font-serif">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex items-center space-x-4 mb-8">
            <button onClick={() => navigate(-1)} className="text-gold-500 hover:text-gold-200 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <span className="text-[10px]   text-gold-600/50">Back</span>
          </div>
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="lg:w-2/3">
              <div className="flex justify-between items-end mb-12 border-b border-gold-600/10 pb-8">
                <h1 className="text-5xl font-serif text-white">Shopping Bag</h1>
                <span className="text-[10px] font-bold  tracking-[0.3em] text-gold-600">
                  {items.reduce((n, i) => n + i.quantity, 0)} Items
                </span>
              </div>

              {items.length === 0 ? (
                <div className="py-24 text-center border border-gold-600/10 bg-navy-950/50">
                  <div className="w-20 h-20 bg-navy-950 rounded-full flex items-center justify-center mx-auto mb-8 border border-gold-600/10">
                    <ShoppingBag className="text-gold-600/30" size={32} />
                  </div>
                  <p className="text-gold-500 mb-8 font-light italic">Your bag is currently empty.</p>
                  <Link
                    to="/products"
                    className="inline-block bg-gold-600 text-navy-950 px-12 py-5 text-[10px] font-bold  tracking-[0.2em] hover:bg-gold-500 transition-all"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-10">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={lineKey(item)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col sm:flex-row gap-8 p-8 bg-navy-950/50 border border-gold-600/10 relative group"
                      >
                        <div className="w-full sm:w-32 aspect-square bg-navy-950 overflow-hidden shrink-0 border border-gold-600/10">
                          <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold  tracking-[0.3em] text-gold-600/50">
                                {item.brandName || 'Bespoke'}
                              </p>
                              <h3 className="text-xl font-serif text-white">{item.name}</h3>
                              <div className="flex flex-wrap gap-4 pt-3">
                                <div className="text-[10px] font-bold   text-gold-400 bg-navy-950 px-4 py-1.5 border border-gold-600/20">
                                  Size: {item.sizeLabel || '—'}
                                </div>
                                <div className="text-[10px] font-bold   text-gold-400 bg-navy-950 px-4 py-1.5 border border-gold-600/20">
                                  Color: {item.variantValue || '—'}
                                </div>
                              </div>
                            </div>
                            <p className="text-lg font-light text-gold-500 italic">KSh {item.price.toLocaleString()}</p>
                          </div>

                          <div className="flex justify-between items-center mt-8">
                            <div className="flex items-center bg-navy-950 border border-gold-600/10 px-4 py-2">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item, item.quantity - 1)}
                                className="p-1 text-gold-600 hover:text-gold-400 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="px-6 text-[10px] font-bold text-white w-12 text-center">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item, item.quantity + 1)}
                                className="p-1 text-gold-600 hover:text-gold-400 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item)}
                              className="text-gold-600/30 hover:text-red-500 transition-colors p-2"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="lg:w-1/3">
              <div className="bg-navy-950/50 p-10 border border-gold-600/10 sticky top-32 space-y-10">
                <h2 className="text-2xl font-serif text-white border-b border-gold-600/10 pb-6">Summary</h2>

                <div className="space-y-6">
                  <div className="flex justify-between text-[10px] font-bold  ">
                    <span className="text-gold-600/50">Subtotal</span>
                    <span className="text-white">KSh {getTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold  ">
                    <span className="text-gold-600/50">Shipping</span>
                    <span className="text-gold-500 italic lowercase font-light">KSh 250 at checkout</span>
                  </div>
                  <div className="pt-6 border-t border-gold-600/10 flex justify-between items-center">
                    <span className="text-xl font-serif text-white">Total</span>
                    <span className="text-3xl font-serif text-gold-500 italic">KSh {getTotal().toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    disabled={items.length === 0}
                    onClick={() => navigate('/checkout')}
                    className="w-full bg-gold-600 text-navy-950 py-5 px-6 text-[10px] font-bold  tracking-[0.2em] hover:bg-gold-500 transition-all flex items-center justify-center space-x-4 disabled:opacity-30 disabled:cursor-not-allowed group shadow-xl shadow-gold-600/10"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                  <p className="text-[9px] text-gold-600/30 text-center  tracking-[0.3em] font-bold">
                    Guest checkout available — sign in optional
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
