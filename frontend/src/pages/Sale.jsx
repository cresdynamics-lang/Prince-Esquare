import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [bestsellers, setBestsellers] = useState([]);
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
        const shelf = Array.isArray(data.bestsellers) ? data.bestsellers : [];
        const flat =
          Array.isArray(data.products) && data.products.length
            ? data.products
            : (data.sections || []).flatMap((s) => s.products || []);
        setBestsellers(shelf);
        setProducts(flat);
        scheduleNext(data.rotation?.nextRotationAt);
      } catch {
        if (!cancelled) {
          setBestsellers([]);
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

  // Deep-link from Bestseller badge → #bestsellers shelf
  useEffect(() => {
    if (loading) return undefined;
    if (location.hash !== '#bestsellers') return undefined;
    const t = window.setTimeout(() => {
      document.getElementById('bestsellers')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [loading, location.hash, bestsellers.length]);

  const empty = !loading && bestsellers.length === 0 && products.length === 0;

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
            <h1 className="text-5xl md:text-6xl font-serif text-white tracking-tight">Sale & Bestsellers</h1>
            <p className="text-navy-200 font-light leading-relaxed">
              Bestsellers lead this page — then the markdown. Tap{' '}
              <span className="text-green-400 font-medium">WhatsApp Order</span> on any item.
            </p>
          </div>
        </div>
      </section>

      <main className="py-20">
        <div className="container mx-auto px-6 space-y-16">
          {loading ? (
            <p className="text-center text-gold-600/50 text-[10px] uppercase tracking-widest py-24">
              Loading sale picks…
            </p>
          ) : empty ? (
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
            <>
              {bestsellers.length > 0 ? (
                <section id="bestsellers" className="scroll-mt-28">
                  <div className="mb-8 flex flex-col gap-2 border-b border-gold-600/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-gold-500">
                        Curated
                      </p>
                      <h2 className="mt-2 font-serif text-2xl text-white md:text-3xl">Bestsellers</h2>
                    </div>
                    <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold-500/45">
                      {bestsellers.length} piece{bestsellers.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 md:gap-x-8 md:gap-y-14">
                    {bestsellers.map((product, i) => (
                      <ProductCard
                        key={`best-${product.id}-${rotationKey}`}
                        product={product}
                        motionProps={{
                          layout: true,
                          initial: { opacity: 0, y: 20 },
                          animate: { opacity: 1, y: 0 },
                          transition: { delay: Math.min(i, 12) * 0.04 },
                        }}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {products.length > 0 ? (
                <section id="markdown">
                  <div className="mb-8 flex flex-col gap-2 border-b border-gold-600/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-red-400/80">
                        On sale
                      </p>
                      <h2 className="mt-2 font-serif text-2xl text-white md:text-3xl">Markdown</h2>
                    </div>
                    <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold-500/45">
                      {products.length} piece{products.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 md:gap-x-8 md:gap-y-14">
                    {products.map((product, i) => (
                      <ProductCard
                        key={`sale-${product.id}-${rotationKey}`}
                        product={product}
                        motionProps={{
                          layout: true,
                          initial: { opacity: 0, y: 20 },
                          animate: { opacity: 1, y: 0 },
                          transition: { delay: Math.min(i, 12) * 0.04 },
                        }}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Sale;
