import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Smartphone, CreditCard } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuthStore } from '../store/useAuthStore';
import { orderAPI, paymentAPI } from '../services/api';

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await orderAPI.getOne(orderId);
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

  const payMpesa = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const digits = phone.replace(/\D/g, '');
      await paymentAPI.stkPush({
        amount: Math.round(total),
        phoneNumber: digits || '254700000000',
        order_id: orderId,
      });
      setDone(true);
    } catch (er) {
      setErr(er.response?.data?.message || 'Payment request failed');
    } finally {
      setBusy(false);
    }
  };

  const payCardDemo = async () => {
    setBusy(true);
    try {
      await paymentAPI.stkPush({
        amount: Math.round(total),
        phoneNumber: '254000000000',
        order_id: orderId,
      });
      setDone(true);
    } catch (er) {
      setErr(er.response?.data?.message || 'Could not confirm payment');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-navy-950 min-h-screen">
      <Navbar />
      <main className="pt-32 pb-24 container mx-auto px-6 max-w-lg">
        <Link to="/" className="inline-flex items-center text-gold-500 hover:text-gold-200 mb-10 text-[10px] uppercase tracking-widest">
          <ChevronLeft size={18} />
          Home
        </Link>

        {!order ? (
          <p className="text-gold-500/60 text-[10px] uppercase tracking-widest text-center py-20">Loading order…</p>
        ) : done ? (
          <div className="border border-gold-500/20 p-10 text-center space-y-6">
            <p className="text-white font-serif text-2xl">Thank you</p>
            <p className="text-navy-300 text-sm">Your payment has been recorded for order #{String(order.id).slice(0, 8)}.</p>
            <Link to="/products" className="inline-block bg-gold-600 text-navy-950 px-8 py-4 text-[10px] font-bold uppercase tracking-widest">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="border border-gold-500/20 p-10 space-y-8">
            <div className="text-center space-y-2">
              <p className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Amount due</p>
              <p className="text-4xl font-serif text-white">KSh {Math.round(total).toLocaleString()}</p>
              <p className="text-[10px] text-navy-400 uppercase tracking-widest">Order #{String(order.id).slice(0, 8)}</p>
            </div>

            {err && <div className="text-red-400 text-xs text-center bg-red-500/10 py-2 px-3">{err}</div>}

            {method === 'mpesa' ? (
              <form onSubmit={payMpesa} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-gold-500 uppercase tracking-widest font-bold flex items-center gap-2">
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
                  className="w-full bg-gold-600 text-navy-950 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-gold-500 disabled:opacity-50"
                >
                  {busy ? 'Sending…' : 'Pay with M-Pesa'}
                </button>
              </form>
            ) : (
              <div className="space-y-6 text-center">
                <CreditCard className="mx-auto text-gold-500" size={40} />
                <p className="text-navy-300 text-sm">Card processing is not connected. Confirm this demo payment to mark the order paid.</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={payCardDemo}
                  className="w-full bg-gold-600 text-navy-950 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-gold-500 disabled:opacity-50"
                >
                  {busy ? 'Processing…' : 'Confirm payment'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Payment;
