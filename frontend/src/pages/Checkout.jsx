import { useState, useEffect } from 'react';
import { Truck, ChevronLeft, ShoppingBag } from 'lucide-react';
import MpesaCheckoutSection from '../components/MpesaCheckoutSection';
import { Link, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { orderAPI } from '../services/api';
import { toCartVariantId } from '../utils/ids';
import { buildOrderTrackUrl, buildWhatsAppOrderUrl } from '../lib/storeContact';

const isCustomerSession = () => {
  const { isAuthenticated, token, isSeller, user } = useAuthStore.getState();
  return isAuthenticated && token && !isSeller && user?.accountType !== 'pos';
};

const Checkout = () => {
  const { isAuthenticated, user } = useAuthStore();
  const items = useCartStore((state) => state.items);
  const getCheckoutTotals = useCartStore((state) => state.getCheckoutTotals);
  const prepareForCheckout = useCartStore((state) => state.prepareForCheckout);
  const [cartReady, setCartReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mpesaConfirmed, setMpesaConfirmed] = useState(false);
  const [mpesaCode, setMpesaCode] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

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

    if (!mpesaConfirmed) {
      setError('Please confirm you will pay via M-Pesa before placing your order.');
      return;
    }

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
        ...(mpesaCode.trim() ? { mpesa_code: mpesaCode.trim().toUpperCase() } : {}),
      };

      const payload = {
        shipping_address,
        billing_address: shipping_address,
        payment_method: 'whatsapp_mpesa',
        items: lineItems(syncedItems),
      };

      const res = customerLoggedIn
        ? await orderAPI.create(payload)
        : await orderAPI.createGuest(payload);

      if (!res.data?.success) throw new Error(res.data?.message || 'Order failed');
      const order = res.data.data;
      sessionStorage.setItem('checkout-email', shipping_address.email);
      useCartStore.getState().clearLocalItems();

      const trackUrl = buildOrderTrackUrl(order.id, shipping_address.email);
      const whatsappUrl = buildWhatsAppOrderUrl({
        order: { ...order, shipping_address, total_amount: order.total_amount ?? totals.total },
        items: syncedItems.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          size_label: it.sizeLabel || null,
        })),
        trackUrl,
      });
      window.location.href = whatsappUrl;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-navy-950 min-h-screen">
      <Navbar />

      <main className="pt-24 sm:pt-32 pb-16 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="flex items-center space-x-3 sm:space-x-4 mb-6 sm:mb-8">
            <Link to="/cart" className="text-gold-500 hover:text-gold-200 shrink-0">
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-serif text-white uppercase tracking-widest">Checkout</h1>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-sm py-3 px-4 text-center">{error}</div>
          )}

          {!customerLoggedIn ? (
            <div className="mb-6 bg-navy-900/50 border border-gold-500/20 text-gold-400/90 text-sm py-3 px-4 sm:px-6 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <span>Checking out as guest — no account needed.</span>
              <Link to="/login?redirect=/checkout" className="text-gold-500 text-[10px] font-bold uppercase tracking-widest hover:text-gold-300 shrink-0">
                Sign in instead
              </Link>
            </div>
          ) : (
            <p className="mb-6 text-gold-500/50 text-[10px] uppercase tracking-widest">Signed in as {user?.email}</p>
          )}

          <form onSubmit={handlePlaceOrder} className="space-y-6 sm:space-y-8">
            <section className="bg-navy-950/30 border border-gold-500/10 p-5 sm:p-8 space-y-6">
              <div className="flex items-center space-x-3 border-b border-gold-500/10 pb-4">
                <Truck className="text-gold-500 shrink-0" size={20} />
                <h2 className="text-lg font-serif text-white uppercase tracking-widest">Delivery details</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">First name</label>
                  <input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-navy-950 border border-gold-500/10 py-3 px-4 text-white outline-none focus:border-gold-500 text-base"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Last name</label>
                  <input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-navy-950 border border-gold-500/10 py-3 px-4 text-white outline-none focus:border-gold-500 text-base"
                    placeholder="Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Email</label>
                  <input
                    required
                    type="email"
                    value={email || user?.email || ''}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-navy-950 border border-gold-500/10 py-3 px-4 text-white outline-none focus:border-gold-500 text-base"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Phone</label>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-navy-950 border border-gold-500/10 py-3 px-4 text-white outline-none focus:border-gold-500 text-base"
                    placeholder="0712 345 678"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Delivery location</label>
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-navy-950 border border-gold-500/10 py-3 px-4 text-white outline-none focus:border-gold-500 text-base"
                    placeholder="Estate, street, landmark"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Town / city</label>
                  <input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-navy-950 border border-gold-500/10 py-3 px-4 text-white outline-none focus:border-gold-500 text-base"
                    placeholder="Nairobi"
                  />
                </div>
              </div>
            </section>

            {items.length > 0 && (
              <section className="bg-navy-950/30 border border-gold-500/10 p-5 sm:p-8 space-y-4">
                <p className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Your items</p>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.cartItemId || `${item.productId}-${item.variantId}-${item.sizeLabel}`} className="flex gap-3 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-navy-800 overflow-hidden shrink-0">
                        <img src={item.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{item.name}</p>
                        <p className="text-[10px] text-navy-400">Qty {item.quantity}{item.sizeLabel ? ` · ${item.sizeLabel}` : ''}</p>
                      </div>
                      <p className="text-gold-500 text-sm shrink-0">KSh {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-navy-950/30 border border-gold-500/10 p-5 sm:p-8 space-y-5">
              <MpesaCheckoutSection
                totals={totals}
                mpesaConfirmed={mpesaConfirmed}
                onMpesaConfirmedChange={setMpesaConfirmed}
                mpesaCode={mpesaCode}
                onMpesaCodeChange={setMpesaCode}
                showSummary
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#00A651] hover:bg-[#009648] text-white py-4 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingBag size={18} />
                <span>{submitting ? 'Placing order…' : 'Place order'}</span>
              </button>
            </section>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
