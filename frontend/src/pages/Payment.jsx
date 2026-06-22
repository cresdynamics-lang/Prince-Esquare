import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Smartphone, CreditCard, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuthStore } from '../store/useAuthStore';
import { orderAPI, paymentAPI } from '../services/api';
import { buildWhatsAppCheckoutLink } from '../utils/whatsapp';

const isCustomerSession = () => {
  const { isAuthenticated, token, isSeller, user } = useAuthStore.getState();
  return isAuthenticated && token && !isSeller && user?.accountType !== 'pos';
};

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const checkoutEmail = sessionStorage.getItem('checkout-email') || '';
        let res;
        if (isCustomerSession()) {
          res = await orderAPI.getOne(orderId);
        } else {
          if (!checkoutEmail) {
            if (!cancelled) navigate('/checkout');
            return;
          }
          res = await orderAPI.getCheckout(orderId, checkoutEmail);
        }
        if (cancelled) return;
        if (res.data?.success) setOrder(res.data.data);
        else navigate('/cart');
      } catch {
        if (!cancelled) navigate('/cart');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, navigate]);

  const total = order ? parseFloat(order.total_amount) : 0;
  const method = order?.payment_method || 'mpesa';
  const checkoutEmail = sessionStorage.getItem('checkout-email') || '';

  const payPayload = () => ({
    amount: Math.round(total),
    phoneNumber: phone.replace(/\D/g, '') || '254700000000',
    order_id: orderId,
    email: checkoutEmail,
  });

  const payMpesa = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const res = await paymentAPI.stkPush(payPayload());
      setDevMode(Boolean(res.data?.data?.devMode));
      setDone(true);
      sessionStorage.removeItem('checkout-email');
    } catch (er) {
      setErr(er.response?.data?.message || 'Payment request failed');
    } finally {
      setBusy(false);
    }
  };

  const payCardDemo = async () => {
    setBusy(true);
    try {
      const res = await paymentAPI.stkPush(payPayload());
      setDevMode(Boolean(res.data?.data?.devMode));
      setDone(true);
      sessionStorage.removeItem('checkout-email');
    } catch (er) {
      setErr(er.response?.data?.message || 'Could not confirm payment');
    } finally {
      setBusy(false);
    }
  };

  const handleWhatsAppCheckout = () => {
    // Build order summary for WhatsApp
    const customerName = order?.shipping_address?.first_name || 'Valued Customer';
    const orderItems = order?.line_items || [];
    
    // Format items for message
    const items = orderItems.map(item => ({
      name: item.product_name || item.name || 'Item',
      quantity: item.quantity || 1,
      price: parseFloat(item.unit_price || item.price || 0),
    }));

    const totals = {
      subtotal: Math.round(total * (100 / 116)), // Reverse calculate from total
      tax: Math.round(total * (16 / 116)),
      shipping: 250,
      total: Math.round(total),
    };

    const waLink = buildWhatsAppCheckoutLink(items, totals, customerName);
    window.open(waLink, '_blank', 'noopener,noreferrer');
    setDone(true);
    sessionStorage.removeItem('checkout-email');
  };

  return (
    <div className="bg-navy-950 min-h-screen">
      <Navbar />
      <main className="pt-32 pb-24 container mx-auto px-6 max-w-lg">
        <Link to="/" className="inline-flex items-center text-gold-500 hover:text-gold-200 mb-10 text-[10px]  ">
          <ChevronLeft size={18} />
          Home
        </Link>

        {!order ? (
          <p className="text-gold-500/60 text-[10px]   text-center py-20">Loading order…</p>
        ) : done ? (
          <div className="border border-gold-500/20 p-10 text-center space-y-6">
            <p className="text-white font-serif text-2xl">Thank you</p>
            <p className="text-navy-300 text-sm">Your payment has been recorded for order #{String(order.id).slice(0, 8)}.</p>
            {devMode && (
              <p className="text-amber-400/80 text-xs">Development payment mode — configure MPESA_* in production .env for live M-Pesa.</p>
            )}
            <Link to="/products" className="inline-block bg-gold-600 text-navy-950 px-8 py-4 text-[10px] font-bold  ">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="border border-gold-500/20 p-10 space-y-8">
            <div className="text-center space-y-2">
              <p className="text-[10px] text-gold-500   font-bold">Amount due</p>
              <p className="text-4xl font-serif text-white">KSh {Math.round(total).toLocaleString()}</p>
              <p className="text-[10px] text-navy-400  ">Order #{String(order.id).slice(0, 8)}</p>
            </div>

            {err && <div className="text-red-400 text-xs text-center bg-red-500/10 py-2 px-3">{err}</div>}

            {method === 'mpesa' ? (
              <form onSubmit={payMpesa} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-gold-500   font-bold flex items-center gap-2">
                    <Smartphone size={14} /> M-Pesa phone
                  </label>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-navy-950 border border-gold-500/10 py-4 px-6 text-white outline-none focus:border-gold-500"
                    placeholder="254712345678"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-gold-600 text-navy-950 py-4 text-[10px] font-bold   hover:bg-gold-500 disabled:opacity-50"
                >
                  {busy ? 'Sending…' : 'Pay with M-Pesa'}
                </button>
              </form>
            ) : (
              <div className="space-y-6 text-center">
                <CreditCard className="mx-auto text-gold-500" size={40} />
                <p className="text-navy-300 text-sm">Card processing is not connected. Confirm payment to complete your order.</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={payCardDemo}
                  className="w-full bg-gold-600 text-navy-950 py-4 text-[10px] font-bold   hover:bg-gold-500 disabled:opacity-50"
                >
                  {busy ? 'Processing…' : 'Confirm payment'}
                </button>
              </div>
            )}

            {/* WhatsApp Payment Option */}
            <div className="border-t border-gold-500/10 pt-6 space-y-4">
              <p className="text-center text-[10px] text-gold-500/70   font-bold">Alternative Payment</p>
              <button
                type="button"
                onClick={handleWhatsAppCheckout}
                disabled={busy}
                className="w-full bg-green-600 text-white py-4 text-[10px] font-bold   hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle size={16} />
                <span>Send Order via WhatsApp</span>
              </button>
              <p className="text-[9px] text-navy-400 text-center italic">Click to send your order details to WhatsApp and confirm payment</p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Payment;
