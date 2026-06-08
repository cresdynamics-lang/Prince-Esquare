import { useState, useEffect } from 'react';
import { ShieldCheck, Truck, CreditCard, ChevronLeft } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { orderAPI } from '../services/api';
import { toCartVariantId } from '../utils/ids';

const isCustomerSession = () => {
  const { isAuthenticated, token, isSeller, user } = useAuthStore.getState();
  return isAuthenticated && token && !isSeller && user?.accountType !== 'pos';
};

const Checkout = () => {
  const { isAuthenticated, user } = useAuthStore();
  const items = useCartStore((state) => state.items);
  const getCheckoutTotals = useCartStore((state) => state.getCheckoutTotals);
  const prepareForCheckout = useCartStore((state) => state.prepareForCheckout);
  const navigate = useNavigate();
  const [cartReady, setCartReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await prepareForCheckout();
      if (!cancelled) setCartReady(true);
    })();
    return () => { cancelled = true; };
  }, [prepareForCheckout, isAuthenticated]);

  if (!cartReady) {
    return (
      <div className="bg-navy-950 min-h-screen flex items-center justify-center text-gold-500 text-[10px] uppercase tracking-widest">
        Preparing checkout…
      </div>
    );
  }

  if (items.length === 0) return <Navigate to="/cart" />;

  const totals = getCheckoutTotals();

  const customerLoggedIn = isCustomerSession();
  const lineItems = (list) =>
    list
      .filter((it) => String(it.productId).length >= 32)
      .map((it) => ({
        product_id: it.productId,
        variant_id: toCartVariantId(it.variantId),
        quantity: it.quantity,
        size_label: it.sizeLabel || null,
      }));

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const syncedItems = customerLoggedIn ? await prepareForCheckout() : items;
      if (!syncedItems.length) {
        throw new Error('Your bag is empty. Add items before checking out.');
      }

      const shipping_address = {
        first_name: firstName,
        last_name: lastName,
        email: (email || user?.email || '').trim(),
        phone,
        line1: address,
        city,
        country: 'Kenya',
      };

      const payload = {
        shipping_address,
        billing_address: shipping_address,
        payment_method: paymentMethod,
        items: lineItems(syncedItems),
      };

      const res = customerLoggedIn
        ? await orderAPI.create(payload)
        : await orderAPI.createGuest(payload);

      if (!res.data?.success) throw new Error(res.data?.message || 'Order failed');
      const order = res.data.data;
      sessionStorage.setItem('checkout-email', shipping_address.email);
      useCartStore.getState().clearLocalItems();
      navigate(`/payment/${order.id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not place order');
    } finally {
      setSubmitting(false);
    }
  };

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

          {error && (
            <div className="mb-8 bg-red-500/10 border border-red-500/30 text-red-400 text-sm py-3 px-4 text-center">{error}</div>
          )}

          {!customerLoggedIn ? (
            <div className="mb-8 bg-navy-900/50 border border-gold-500/20 text-gold-400/90 text-sm py-4 px-6 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span>Checking out as guest — no account needed.</span>
              <Link to="/login?redirect=/checkout" className="text-gold-500 text-[10px] font-bold uppercase tracking-widest hover:text-gold-300 shrink-0">
                Sign in instead
              </Link>
            </div>
          ) : (
            <p className="mb-8 text-gold-500/50 text-[10px] uppercase tracking-widest">Signed in as {user?.email}</p>
          )}

          <form onSubmit={handlePlaceOrder}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-8 space-y-12">
                <section className="space-y-8 bg-navy-950/30 border border-gold-500/10 p-10">
                  <div className="flex items-center space-x-4 border-b border-gold-500/10 pb-6">
                    <Truck className="text-gold-500" />
                    <h2 className="text-xl font-serif text-white uppercase tracking-widest">Shipping Details</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">First Name</label>
                      <input
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-navy-950 border border-gold-500/10 py-4 px-6 text-white outline-none focus:border-gold-500"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Last Name</label>
                      <input
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-navy-950 border border-gold-500/10 py-4 px-6 text-white outline-none focus:border-gold-500"
                        placeholder="Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Email</label>
                      <input
                        required
                        type="email"
                        value={email || user?.email || ''}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-navy-950 border border-gold-500/10 py-4 px-6 text-white outline-none focus:border-gold-500"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Phone</label>
                      <input
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-navy-950 border border-gold-500/10 py-4 px-6 text-white outline-none focus:border-gold-500"
                        placeholder="+254 712 345 678"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Street address</label>
                      <input
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-navy-950 border border-gold-500/10 py-4 px-6 text-white outline-none focus:border-gold-500"
                        placeholder="Luxury Avenue, Nairobi"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">City</label>
                      <input
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-navy-950 border border-gold-500/10 py-4 px-6 text-white outline-none focus:border-gold-500"
                        placeholder="Nairobi"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-8 bg-navy-950/30 border border-gold-500/10 p-10">
                  <div className="flex items-center space-x-4 border-b border-gold-500/10 pb-6">
                    <CreditCard className="text-gold-500" />
                    <h2 className="text-xl font-serif text-white uppercase tracking-widest">Payment Method</h2>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 text-white text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="pay"
                        checked={paymentMethod === 'mpesa'}
                        onChange={() => setPaymentMethod('mpesa')}
                        className="accent-gold-600"
                      />
                      <span>M-Pesa (STK push on next step)</span>
                    </label>
                    <label className="flex items-center space-x-3 text-white text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="pay"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="accent-gold-600"
                      />
                      <span>Card (pay on next step)</span>
                    </label>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-4">
                <div className="bg-navy-950 border border-gold-500/20 p-8 space-y-8">
                  <h2 className="text-2xl font-serif text-white border-b border-gold-500/10 pb-6 uppercase tracking-widest">Order Review</h2>

                  <div className="space-y-6 max-h-[300px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gold-600">
                    {items.map((item) => (
                      <div key={item.cartItemId || `${item.productId}-${item.variantId}-${item.sizeLabel}`} className="flex space-x-4">
                        <div className="w-16 h-16 bg-navy-800 overflow-hidden shrink-0">
                          <img src={item.image} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow">
                          <p className="text-white text-xs font-serif uppercase tracking-wider">{item.name}</p>
                          <p className="text-[10px] text-navy-400 uppercase tracking-widest">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-gold-500 text-xs tracking-widest">
                          KSh {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gold-500/10">
                    <div className="flex justify-between text-navy-400 text-xs uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span>KSh {totals.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-navy-400 text-xs uppercase tracking-widest">
                      <span>VAT (16%)</span>
                      <span>KSh {totals.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-navy-400 text-xs uppercase tracking-widest">
                      <span>Shipping</span>
                      <span>KSh {totals.shipping.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-white text-xl font-bold pt-4">
                      <span className="font-serif">Total</span>
                      <span className="text-gold-400">KSh {totals.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gold-600 text-navy-950 py-5 text-sm font-bold uppercase tracking-[0.2em] hover:bg-gold-500 transition-all flex items-center justify-center space-x-3 shadow-xl mt-8 disabled:opacity-50"
                  >
                    <ShieldCheck size={20} />
                    <span>{submitting ? 'Placing order…' : 'Place order'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
