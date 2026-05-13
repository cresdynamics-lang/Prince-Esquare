import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, CreditCard, ChevronLeft } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

const Checkout = () => {
  const { isAuthenticated } = useAuthStore();
  const { items, getTotal } = useCartStore();

  if (!isAuthenticated) return <Navigate to="/login?redirect=checkout" />;
  if (items.length === 0) return <Navigate to="/cart" />;

  return (
    <div className="bg-navy-950 min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6">
          <div className="flex items-center space-x-4 mb-12">
            <Link to="/cart" className="text-gold-500 hover:text-gold-200">
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-4xl font-serif text-white uppercase tracking-widest">Checkout</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8 space-y-12">
              {/* Shipping Information */}
              <section className="space-y-8 bg-navy-950/30 border border-gold-500/10 p-10">
                <div className="flex items-center space-x-4 border-b border-gold-500/10 pb-6">
                  <Truck className="text-gold-500" />
                  <h2 className="text-xl font-serif text-white uppercase tracking-widest">Shipping Details</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">First Name</label>
                    <input className="w-full bg-navy-950 border border-gold-500/10 py-4 px-6 text-white outline-none focus:border-gold-500" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Last Name</label>
                    <input className="w-full bg-navy-950 border border-gold-500/10 py-4 px-6 text-white outline-none focus:border-gold-500" placeholder="Doe" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Address</label>
                    <input className="w-full bg-navy-950 border border-gold-500/10 py-4 px-6 text-white outline-none focus:border-gold-500" placeholder="Luxury Avenue, Nairobi" />
                  </div>
                </div>
              </section>

              {/* Payment Information */}
              <section className="space-y-8 bg-navy-950/30 border border-gold-500/10 p-10">
                <div className="flex items-center space-x-4 border-b border-gold-500/10 pb-6">
                  <CreditCard className="text-gold-500" />
                  <h2 className="text-xl font-serif text-white uppercase tracking-widest">Payment Method</h2>
                </div>
                <div className="space-y-4">
                  <p className="text-navy-400 text-sm font-light">Secure encrypted transaction.</p>
                  <div className="p-6 bg-navy-950 border border-gold-500/20 text-gold-500 text-center uppercase tracking-widest text-xs font-bold">
                    Credit Card / M-Pesa Integration Point
                  </div>
                </div>
              </section>
            </div>

            {/* Order Review */}
            <div className="lg:col-span-4">
              <div className="bg-navy-950 border border-gold-500/20 p-8 space-y-8">
                <h2 className="text-2xl font-serif text-white border-b border-gold-500/10 pb-6 uppercase tracking-widest">Order Review</h2>
                
                <div className="space-y-6 max-h-[300px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gold-600">
                  {items.map(item => (
                    <div key={item.id} className="flex space-x-4">
                      <div className="w-16 h-16 bg-navy-800 overflow-hidden shrink-0">
                        <img src={item.image} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-white text-xs font-serif uppercase tracking-wider">{item.name}</p>
                        <p className="text-[10px] text-navy-400 uppercase tracking-widest">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-gold-500 text-xs tracking-widest">KSh {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-6 border-t border-gold-500/10">
                  <div className="flex justify-between text-navy-400 text-xs uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>KSh {getTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-navy-400 text-xs uppercase tracking-widest">
                    <span>Shipping</span>
                    <span className="text-gold-500">Free</span>
                  </div>
                  <div className="flex justify-between text-white text-xl font-bold pt-4">
                    <span className="font-serif">Total</span>
                    <span className="text-gold-400">KSh {getTotal().toLocaleString()}</span>
                  </div>
                </div>

                <button className="w-full bg-gold-600 text-navy-950 py-5 text-sm font-bold uppercase tracking-[0.2em] hover:bg-gold-500 transition-all flex items-center justify-center space-x-3 shadow-xl mt-8">
                  <ShieldCheck size={20} />
                  <span>Place Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
