import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { productAPI } from '../services/api';
import { organizationSchema, routeSeo } from '../seo/seoData';

const NewArrivals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await productAPI.list({ limit: 100, page: 1, sort: 'updated' });
        if (cancelled) return;
        const list = res.data?.data?.products || [];
        list.sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)
        );
        setProducts(list);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-navy-950 min-h-screen font-serif">
      <SEO
        title={routeSeo['new-arrivals']?.title || 'New Arrivals | Prince Esquire'}
        description={
          routeSeo['new-arrivals']?.description ||
          'Shop the newest updates at Prince Esquire Kenya — freshly edited menswear, shoes and accessories.'
        }
        path="/new-arrivals"
        keywords={['new arrivals Kenya', 'latest menswear Nairobi', 'Prince Esquire new']}
        schema={[organizationSchema]}
      />
      <Navbar />

      <section className="pt-32 pb-16 border-b border-gold-600/10">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl space-y-6">
            <span className="inline-block text-gold-500 text-[9px] font-bold uppercase tracking-[0.35em]">
              Just updated
            </span>
            <h1 className="text-5xl md:text-6xl font-serif text-white tracking-tight">New Arrivals</h1>
            <p className="text-navy-200 font-light leading-relaxed">
              Products freshly added or updated on the site — newest first.
            </p>
          </div>
        </div>
      </section>

      <main className="py-20">
        <div className="container mx-auto px-6">
          {loading ? (
            <p className="text-center text-gold-600/50 text-[10px] uppercase tracking-widest py-24">
              Loading new arrivals…
            </p>
          ) : products.length === 0 ? (
            <div className="py-32 text-center space-y-6">
              <p className="text-gold-600/30 text-[10px] uppercase tracking-widest font-bold">
                No new arrivals right now.
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
                  key={product.id}
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NewArrivals;
