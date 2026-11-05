import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { productAPI, searchAPI } from '../services/api';
import { organizationSchema, routeSeo } from '../seo/seoData';

/** Labels for page title only — navigation lives in the menu. */
const CATEGORY_LABELS = {
  'polo-t-shirts': 'Polo T-shirts',
  shoes: 'Shoes',
  'formal-shoes': 'Official Shoes',
  casual: 'Casual Shoes',
  boots: 'Boots',
  sandals: 'Sandals',
  loafers: 'Loafers',
  shirts: 'Shirts',
  'formal-shirts': 'Official Shirts',
  'shirts-casual': 'Casual Shirts',
  presidential: 'Presidential Shirts',
  suits: 'Suits',
  'two-piece': 'Two Piece Suits',
  'three-piece': 'Three Piece Suits',
  blazers: 'Blazers',
  'track-suits': 'Track Suits',
  jackets: 'Jackets',
  'full-jackets': 'Full Jackets',
  'half-jackets': 'Half Jackets',
  vests: 'Vests',
  boxers: 'Boxers',
  trousers: 'Trousers',
  khaki: 'Khaki',
  formal: 'Formal Trousers',
  chino: 'Chinos',
  jeans: 'Jeans',
  gurkha: 'Gurkha',
  linen: 'Linen',
  'linen-set': 'Linen Set',
  'linen-trousers': 'Linen Trousers',
  'linen-shirts': 'Linen Shirts',
  'linen-shorts': 'Linen Shorts',
  sets: 'Sets',
  'caps-hats': 'Caps & Hats',
  'belts-ties': 'Belts & Ties',
  socks: 'Socks',
  sweaters: 'Sweaters',
  't-shirts': 'T-shirts',
  'sweat-shirts': 'Sweat-shirts',
  'round-neck-t-shirts': 'Round-neck T-shirts',
  'v-neck-t-shirts': 'V-neck T-shirts',
  'knitted-polos': 'Knitted Polos',
  polos: 'Polos',
};

const labelFor = (slug) => {
  if (!slug || slug === 'All') return null;
  return CATEGORY_LABELS[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const PATH_CATEGORY = {
  '/shirts': 'shirts',
  '/polo-t-shirts': 'polo-t-shirts',
  '/shoes': 'shoes',
  '/suits': 'suits',
  '/trousers': 'trousers',
  '/linen': 'linen',
};

const Products = () => {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const currentCategory = searchParams.get('category') || PATH_CATEGORY[pathname] || 'All';
  const currentSub = searchParams.get('sub') || 'All';
  const siteSearch = (searchParams.get('search') || searchParams.get('q') || '').trim();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchMeta, setSearchMeta] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const pageTitle =
    (siteSearch ? `Results for “${siteSearch}”` : labelFor(currentSub !== 'All' ? currentSub : currentCategory)) ||
    "All Men's Clothing and Shoes";
  const pageEyebrow =
    currentCategory !== 'All' || currentSub !== 'All'
      ? 'Browse collection'
      : 'Curated Selections';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setSearchMeta(null);
      try {
        if (siteSearch) {
          const res = await searchAPI.search(siteSearch, 200);
          if (cancelled) return;
          const data = res.data?.data || {};
          setSearchMeta(data);
          setProducts((data.matchType === 'exact' ? data.products : data.related) || []);
          return;
        }
        const params = { limit: 200, page: 1, sort: 'updated' };
        if (currentCategory !== 'All') params.category = currentCategory;
        if (currentSub !== 'All') params.sub = currentSub;
        const res = await productAPI.list(params);
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
  }, [currentCategory, currentSub, siteSearch]);

  const filteredProducts = products.filter((product) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      product.name.toLowerCase().includes(q) ||
      (product.brand_name || '').toLowerCase().includes(q)
    );
  });

  const cardMotion = (i) => ({
    layout: true,
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { delay: Math.min(i, 24) * 0.02 },
  });

  return (
    <div className="bg-navy-950 min-h-screen font-serif">
      <SEO
        title={siteSearch ? `Search results for ${siteSearch}` : routeSeo.products.title}
        description={routeSeo.products.description}
        path="/products"
        noindex={Boolean(siteSearch || currentCategory !== 'All' || currentSub !== 'All')}
        schema={[organizationSchema]}
      />
      <Navbar />

      <section className="pt-36 pb-10 lg:pt-44 md:pb-12 bg-navy-950 border-b border-gold-600/5">
        <div className="container mx-auto px-6">
          <div className="space-y-4 max-w-3xl">
            <span className="text-gold-300 text-[11px] uppercase tracking-[0.3em] font-semibold font-sans">
              {siteSearch ? 'Search' : pageEyebrow}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif text-white tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-sm text-navy-200/80 font-light font-sans max-w-md">
              {siteSearch && searchMeta?.correctedQuery
                ? `Showing results for “${searchMeta.correctedQuery}”.`
                : siteSearch && searchMeta?.matchType === 'related'
                  ? 'No exact match, so here are the closest pieces.'
                  : 'Newest first. Use the menu to shop a specific collection.'}
            </p>
          </div>
        </div>
      </section>

      <main className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10 md:mb-12 border-b border-gold-600/10 pb-8">
            <p className="text-sm text-navy-100 font-sans">
              {loading
                ? 'Loading…'
                : `${filteredProducts.length} item${filteredProducts.length === 1 ? '' : 's'}`}
            </p>
            <div className="relative w-full sm:w-80 group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600/30 group-focus-within:text-gold-500 transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Filter these results…"
                className="w-full pl-12 pr-4 py-3.5 bg-navy-950 border border-gold-600/10 text-sm text-white focus:border-gold-400 outline-none transition-all placeholder:text-navy-300 font-sans"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <p className="text-center text-gold-600/50 text-[10px] uppercase tracking-widest py-24 font-sans">
              Loading collection…
            </p>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 md:gap-x-8 md:gap-y-14">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} motionProps={cardMotion(i)} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="py-32 text-center space-y-6">
              <p className="text-navy-100 text-base font-sans">
                {siteSearch ? `Nothing matched “${siteSearch}”. Try a broader word, like suit or shoes.` : 'No products in this section yet.'}
              </p>
              <Link
                to="/products"
                className="inline-block text-[10px] font-bold uppercase tracking-widest text-gold-500 border-b border-gold-500/30 pb-1 font-sans"
              >
                View all products
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
