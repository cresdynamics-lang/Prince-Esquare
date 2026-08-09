import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/useCartStore';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { orderAPI } from '../services/api';
import { toCartVariantId } from '../utils/ids';

const DRAFT_KEY = 'prince-esquire-draft-order-id';

const Cart = () => {
  const { items, removeFromCart, updateQuantity, getTotal } = useCartStore();
  const navigate = useNavigate();
  const [cartPhone, setCartPhone] = useState(() => sessionStorage.getItem('prince-esquire-cart-phone') || '');
  const [cartName, setCartName] = useState('');
  const [savingLead, setSavingLead] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [leadError, setLeadError] = useState('');

  const lineKey = (item) =>
    item.cartItemId ? `c-${item.cartItemId}` : `g-${item.productId}-${item.variantId}-${item.sizeLabel || ''}`;

  const saveCartLead = async () => {
    setLeadError('');
    const digits = String(cartPhone).replace(/\D/g, '');
    if (digits.length < 9) {
      setLeadError('Enter a valid Kenyan phone number (e.g. 0712 345 678).');
      return;
    }
    if (!items.length) {
      setLeadError('Your bag is empty.');
      return;
    }
    setSavingLead(true);
    try {
      const names = cartName.trim().split(/\s+/);
      const shipping_address = {
        first_name: names[0] || '',
        last_name: names.slice(1).join(' ') || '',
        phone: cartPhone.trim(),
        email: '',
        line1: 'Details pending at checkout',
        city: 'Nairobi',
        country: 'Kenya',
        stage: 'cart_capture',
      };
      const res = await orderAPI.saveDraft({
        draft_id: sessionStorage.getItem(DRAFT_KEY) || undefined,
        shipping_address,
        items: items
          .filter((it) => String(it.productId).length >= 32)
          .map((it) => ({
            product_id: it.productId,
            variant_id: toCartVariantId(it.variantId),
            quantity: it.quantity,
            size_label: it.sizeLabel || null,
          })),
      });
      if (!res.data?.success) throw new Error(res.data?.message || 'Could not save');
      if (res.data?.data?.id) sessionStorage.setItem(DRAFT_KEY, res.data.data.id);
      sessionStorage.setItem('prince-esquire-cart-phone', cartPhone.trim());
      setLeadSaved(true);
    } catch (err) {
      setLeadError(err.response?.data?.message || err.message || 'Could not save phone');
    } finally {
      setSavingLead(false);
    }
  };
  return (
    <div className="bg-navy-950 min-h-screen font-serif">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="lg:w-2/3">
              <div className="flex justify-between items-end mb-12 border-b border-gold-600/10 pb-8">
                <h1 className="text-5xl font-serif text-white">Shopping Bag</h1>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-600">
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
                    className="inline-block bg-gold-600 text-navy-950 px-12 py-5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gold-500 transition-all rounded-full"
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
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-600/50">
                                {item.brandName || 'Bespoke'}
                              </p>
                              <h3 className="text-xl font-serif text-white">{item.name}</h3>
                              {item.slug && (
                                <a
                                  href={`https://prince-esquire.co.ke/product/${item.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1 inline-block text-[10px] font-bold uppercase tracking-widest text-green-400 hover:text-green-300"
                                >
                                  {item.name} — KSh {item.price.toLocaleString()} · View product
                                </a>
                              )}
                              <div className="flex flex-wrap gap-4 pt-3">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-gold-400 bg-navy-950 px-4 py-1.5 border border-gold-600/20">
                                  Size: {item.sizeLabel || '—'}
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-gold-400 bg-navy-950 px-4 py-1.5 border border-gold-600/20">
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
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-gold-600/50">Subtotal</span>
                    <span className="text-white">KSh {getTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-gold-600/50">Shipping</span>
                    <span className="text-gold-500 italic lowercase font-light">KSh 250 at checkout</span>
                  </div>
                  <div className="pt-6 border-t border-gold-600/10 flex justify-between items-center">
                    <span className="text-xl font-serif text-white">Total</span>
                    <span className="text-3xl font-serif text-gold-500 italic">KSh {getTotal().toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-6">
                  {items.length > 0 && (
                    <div className="space-y-3 border border-gold-600/15 bg-navy-950/80 p-5">
                      <div className="flex items-center gap-2 text-gold-500">
                        <Phone size={14} />
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Hold this order</p>
                      </div>
                      <p className="text-[11px] text-navy-300 font-sans font-light leading-relaxed">
                        Drop your phone (and name if you like). We save your bag now so staff can follow up even if you don&apos;t finish checkout.
                      </p>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={cartPhone}
                        onChange={(e) => { setCartPhone(e.target.value); setLeadSaved(false); }}
                        placeholder="0712 345 678"
                        className="w-full bg-navy-900 border border-gold-500/15 py-3 px-4 text-sm text-white outline-none focus:border-gold-500 font-sans"
                      />
                      <input
                        type="text"
                        value={cartName}
                        onChange={(e) => setCartName(e.target.value)}
                        placeholder="Your name (optional)"
                        className="w-full bg-navy-900 border border-gold-500/15 py-3 px-4 text-sm text-white outline-none focus:border-gold-500 font-sans"
                      />
                      <button
                        type="button"
                        onClick={saveCartLead}
                        disabled={savingLead}
                        className="w-full border border-gold-500/40 text-gold-400 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gold-500 hover:text-navy-950 transition-all disabled:opacity-40 font-sans"
                      >
                        {savingLead ? 'Saving…' : leadSaved ? 'Saved — continue to checkout' : 'Save phone & bag'}
                      </button>
                      {leadSaved && (
                        <p className="text-[10px] text-green-400 font-sans">Details saved. You can finish checkout anytime.</p>
                      )}
                      {leadError && (
                        <p className="text-[10px] text-red-400 font-sans">{leadError}</p>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={items.length === 0}
                    onClick={() => navigate('/checkout')}
                    className="w-full bg-gold-600 text-navy-950 py-5 px-6 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gold-500 transition-all flex items-center justify-center space-x-4 disabled:opacity-30 disabled:cursor-not-allowed group rounded-full"
                  >
                    <span>Begin Checkout</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-[9px] text-gold-600/30 text-center uppercase tracking-[0.3em] font-bold">Secure Global Delivery</p>
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
