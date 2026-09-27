import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import StayTipQueue, { SALE_STAY_TIPS } from '../components/StayTipCards';
import { productAPI } from '../services/api';
import { organizationSchema, routeSeo } from '../seo/seoData';

const FALLBACK_ROTATION_MS = 2 * 60 * 1000;

const Sale = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rotationKey, setRotationKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timerId;

    const scheduleNext = (nextRotationAt) => {
      const delay = Math.max(
        1500,
        (Number(nextRotationAt) || Date.now() + FALLBACK_ROTATION_MS) - Date.now() + 250,
      );
      timerId = window.setTimeout(() => {
        if (!cancelled) setRotationKey((k) => k + 1);
      }, delay);
    };

    (async () => {
      if (rotationKey === 0) setLoading(true);
      try {
        const res = await productAPI.sale();
        if (cancelled) return;
        const data = res.data?.data || {};
        // Prefer flat mixed list; fall back if an older API still returns sections
        const flat =
          Array.isArray(data.products) && data.products.length
            ? data.products
            : (data.sections || []).flatMap((s) => s.products || []);
        setProducts(flat);
        scheduleNext(data.rotation?.nextRotationAt);
      } catch {
        if (!cancelled) {
          setProducts([]);
          scheduleNext(Date.now() + FALLBACK_ROTATION_MS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (timerId) window.clearTimeout(timerId);
    };
  }, [rotationKey]);

  return (
    <div className="bg-navy-950 min-h-screen font-serif">
      <SEO
        title={routeSeo.sale?.title || 'Sale — Best Sellers | Prince Esquire'}
        description={routeSeo.sale?.description || 'Shop best-selling tracksuits, official shoes and boots at Prince Esquire Kenya.'}
        path="/sale"
        keywords={['sale menswear Kenya', 'tracksuits Nairobi', 'formal shoes Kenya', 'luxury fashion sale']}
        schema={[organizationSchema]}
      />
      <Navbar />
      <StayTipQueue tips={SALE_STAY_TIPS} />

      <section className="pt-32 pb-16 border-b border-gold-600/10">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl space-y-6">
            <span className="inline-block bg-red-600/90 text-white px-3 py-1 text-[9px] font-bold uppercase tracking-[0.35em]">
              Sale
            </span>
            <h1 className="text-5xl md:text-6xl font-serif text-white tracking-tight">Best Sellers</h1>
            <p className="text-navy-200 font-light leading-relaxed">
              Tap <span className="text-green-400 font-medium">WhatsApp Order</span> on any item — message us instantly with product details, price and image link. No forms.
            </p>
          </div>
        </div>
      </section>

      <main className="py-20">
        <div className="container mx-auto px-6">
          {loading ? (
            <p className="text-center text-gold-600/50 text-[10px] uppercase tracking-widest py-24">
              Loading sale picks…
            </p>
          ) : products.length === 0 ? (
            <div className="py-32 text-center space-y-6">
              <p className="text-gold-600/30 text-[10px] uppercase tracking-widest font-bold">
                No sale items available right now.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gold-500"
              >
                Browse full collection
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 md:gap-x-8 md:gap-y-14">
              {products.map((product, i) => (
                <ProductCard
                  key={`${product.id}-${rotationKey}`}
                  product={product}
                  showSaleTag
                  motionProps={{
                    layout: true,
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: Math.min(i, 12) * 0.04 },
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Sale;
