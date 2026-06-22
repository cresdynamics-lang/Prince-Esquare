import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Copy, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MpesaPaymentGuide from '../components/MpesaPaymentGuide';
import { useAuthStore } from '../store/useAuthStore';
import { orderAPI } from '../services/api';
import { buildOrderTrackUrl } from '../lib/storeContact';

const isCustomerSession = () => {
  const { isAuthenticated, token, isSeller, user } = useAuthStore.getState();
  return isAuthenticated && token && !isSeller && user?.accountType !== 'pos';
};

const Payment = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState('');

  const checkoutEmail = sessionStorage.getItem('checkout-email') || searchParams.get('email') || '';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
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
    return () => { cancelled = true; };
  }, [orderId, navigate, checkoutEmail]);

  const trackUrl = useMemo(() => {
    if (!order?.id) return '';
    const email = checkoutEmail || order.shipping_address?.email || '';
    return buildOrderTrackUrl(order.id, email);
  }, [order, checkoutEmail]);

  const total = order ? parseFloat(order.total_amount) : 0;
  const shortId = order ? String(order.id).slice(0, 8).toUpperCase() : '';
  const addr = order?.shipping_address || {};
  const isWhatsAppFlow = order?.payment_method === 'whatsapp_mpesa' || !order?.payment_method;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(trackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr('Could not copy link');
    }
  };

  return (
    <div className="bg-navy-950 min-h-screen">
      <Navbar />
      <main className="pt-24 sm:pt-32 pb-16 sm:pb-24 container mx-auto px-4 sm:px-6 max-w-lg">
        <Link to="/products" className="inline-flex items-center text-gold-500 hover:text-gold-200 mb-6 sm:mb-10 text-[10px] uppercase tracking-widest">
          <ChevronLeft size={18} />
          Continue shopping
        </Link>

        {!order ? (
          <p className="text-gold-500/60 text-[10px] uppercase tracking-widest text-center py-20">Loading order…</p>
        ) : isWhatsAppFlow ? (
          <div className="space-y-6 sm:space-y-8">
            <div className="border border-gold-500/20 p-5 sm:p-8 text-center space-y-2">
              <p className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Order placed</p>
              <p className="text-2xl sm:text-3xl font-serif text-white">KSh {Math.round(total).toLocaleString()}</p>
              <p className="text-[10px] text-navy-400 uppercase tracking-widest">Order #{shortId} · Pending payment</p>
              {addr.first_name && (
                <p className="text-sm text-navy-300 pt-2">
                  {[addr.first_name, addr.last_name].filter(Boolean).join(' ')} · {addr.phone}
                </p>
              )}
            </div>

            {err && <div className="text-red-400 text-xs text-center bg-red-500/10 py-2 px-3 border border-red-500/20">{err}</div>}

            <div className="border border-gold-500/20 p-5 sm:p-8">
              <MpesaPaymentGuide amount={total} orderRef={shortId} />
            </div>

            {order.items?.length > 0 && (
              <div className="border border-gold-500/20 p-4 sm:p-6 space-y-3">
                <p className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Your items</p>
                <ul className="text-xs text-navy-300 space-y-1">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.name}
                      {item.size_label ? ` (${item.size_label})` : ''} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border border-gold-500/20 p-4 sm:p-6 space-y-3">
              <p className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Your order link</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  readOnly
                  value={trackUrl}
                  className="w-full min-w-0 text-xs bg-navy-950 border border-gold-500/10 px-3 py-2.5 text-navy-300 truncate outline-none"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="w-full sm:w-auto shrink-0 px-4 py-2.5 border border-gold-500/20 text-gold-500 text-[10px] uppercase tracking-widest hover:bg-gold-500/10 flex items-center justify-center gap-1.5"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-gold-500/20 p-10 text-center space-y-6">
            <p className="text-white font-serif text-2xl">Thank you</p>
            <p className="text-navy-300 text-sm">Your order #{shortId} has been recorded.</p>
            <Link to="/products" className="inline-block bg-gold-600 text-navy-950 px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-gold-500">
              Continue shopping
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Payment;
