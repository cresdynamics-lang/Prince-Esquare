import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Navbar, { SECTION_SHOP_LINKS } from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { productAPI } from '../services/api';
import { organizationSchema, routeSeo } from '../seo/seoData';

const Sale = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await productAPI.sale();
        if (!cancelled) setSections(res.data?.data?.sections || []);
      } catch {
        if (!cancelled) setSections([]);
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
        title={routeSeo.sale?.title || 'Sale — Best Sellers | Prince Esquire'}
        description={routeSeo.sale?.description || 'Shop best-selling tracksuits, official shoes and boots at Prince Esquire Kenya.'}
        path="/sale"
        keywords={['sale menswear Kenya', 'tracksuits Nairobi', 'formal shoes Kenya', 'luxury fashion sale']}
        schema={[organizationSchema]}
      />
      <Navbar />

      <section className="pt-32 pb-16 border-b border-gold-600/10">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl space-y-6">
            <span className="inline-block bg-red-600/90 text-white px-3 py-1 text-[9px] font-bold uppercase tracking-[0.35em]">
              Sale
            </span>
            <h1 className="text-5xl md:text-6xl font-serif text-white tracking-tight">Best Sellers</h1>
            <p className="text-navy-200 font-light leading-relaxed">
              Tap <span className="text-green-400 font-medium">WhatsApp Order</span> on any item — choose your size, then message us instantly with the product details, price and image link. No forms.
            </p>
          </div>
        </div>
      </section>

      <main className="py-20">
        <div className="container mx-auto px-6 space-y-24">
          {loading ? (
            <p className="text-center text-gold-600/50 text-[10px] uppercase tracking-widest py-24">
              Loading sale picks…
            </p>
          ) : sections.length === 0 ? (
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
            sections.map((section) => (
              <section key={section.slug} className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gold-600/10 pb-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-red-500/80">On sale</span>
                    <h2 className="text-3xl md:text-4xl font-serif text-white mt-2">{section.title}</h2>
                  </div>
                  <Link
                    to={SECTION_SHOP_LINKS[section.slug] || '/products'}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gold-500 hover:text-gold-400 transition-colors"
                  >
                    Shop all {section.title.toLowerCase()}
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-16">
                  {section.products.map((product, i) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      motionProps={{
                        layout: true,
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { delay: i * 0.04 },
                      }}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Sale;
