import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { catalogueAPI } from '../services/api';
import { useCartStore } from '../store/useCartStore';
import { getDummyProducts } from '../utils/dummyData';
import { getPremiumImage, preloadProductImages } from '../utils/productImages';

const SHOWCASE_LIMIT = 9;

const SHOWCASE_FAMILIES = [
  {
    key: 'prince-esquire-polo',
    label: 'The Esquire Polo Edit',
    kicker: 'New Color Story',
    match: (name) => name.includes('polo'),
    prefer: (product) => /black/.test(getSearchText(product)) && !/dark black/.test(getSearchText(product)),
  },
  {
    key: 'clarks-gereld-tie',
    label: 'Clarks Gereld Tie',
    match: (name) => name.includes('clarks') && name.includes('gereld') && name.includes('tie'),
    prefer: (product) => /black/.test(getSearchText(product)) && !/\bv\d*\b|\(v\d+\)/.test(getSearchText(product)),
  },
  {
    key: 'prada-tracksuit',
    label: 'Prada Tracksuit',
    match: (name) => name.includes('prada') && name.includes('tracksuit'),
    prefer: (product) => /black/.test(getSearchText(product)),
  },
  {
    key: 'zegna-tracksuit',
    label: 'Zegna Tracksuit',
    match: (name) => name.includes('zegna') && name.includes('tracksuit'),
    prefer: (product) => /grey|signature/.test(getSearchText(product)),
  },
  {
    key: 'dockers-tapered-fit-pants',
    label: 'Dockers Tapered Fit Pants',
    match: (name) => name.includes('dockers') && name.includes('tapered') && name.includes('pants'),
    prefer: (product) => !/\bv\d*\b|\(v\d+\)/.test(getSearchText(product)),
  },
  {
    key: 'santoni-leather-loafers',
    label: 'Santoni Leather Loafers',
    match: (name) => name.includes('santoni') && name.includes('loafers') && !name.includes('slip-on'),
    prefer: (product) => /black/.test(getSearchText(product)),
  },
  {
    key: 'presidential-shirts',
    label: 'Presidential Shirts',
    match: (name) => name.includes('presidential') && name.includes('shirt'),
    prefer: (product) => /green|patterned/.test(getSearchText(product)),
  },
  {
    key: 'santoni-double-monk-strap',
    label: 'Santoni Double Monk-Strap',
    match: (name) => name.includes('santoni') && name.includes('double') && name.includes('monk'),
    prefer: (product) => /dark brown|brown/.test(getSearchText(product)),
  },
  {
    key: 'black-puffer-vest',
    label: 'Black Puffer Vest',
    match: (name) => name.includes('puffer') && name.includes('vest'),
  },
];

const getSearchText = (product) => [
  product?.name,
  product?.slug,
  product?.brand_name,
  product?.category_name,
  product?.subcategory,
].filter(Boolean).join(' ').toLowerCase();

const getShowcaseProducts = (sourceProducts, fallbackProducts = []) => {
  const allProducts = [...sourceProducts];
  const seenSlugs = new Set(sourceProducts.map((product) => product.slug).filter(Boolean));

  fallbackProducts.forEach((product) => {
    if (product.slug && seenSlugs.has(product.slug)) return;
    allProducts.push(product);
    if (product.slug) seenSlugs.add(product.slug);
  });

  const selected = [];
  const usedIds = new Set();

  SHOWCASE_FAMILIES.forEach((family) => {
    const matches = allProducts.filter((product) => family.match(getSearchText(product)));
    if (!matches.length) return;

    const preferred = family.prefer ? matches.find(family.prefer) : null;
    const product = preferred || matches[0];
    selected.push({
      ...product,
      showcaseName: family.label,
      showcaseKicker: family.kicker,
    });
    usedIds.add(product.id);
  });

  allProducts.forEach((product) => {
    if (selected.length >= SHOWCASE_LIMIT) return;
    if (usedIds.has(product.id)) return;

    const duplicateFamily = SHOWCASE_FAMILIES.some((family) => family.match(getSearchText(product)));
    if (duplicateFamily) return;

    selected.push(product);
    usedIds.add(product.id);
  });

  return selected.slice(0, SHOWCASE_LIMIT);
};

const ProductShowcase = () => {
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);
  const [products, setProducts] = useState([]);
  const [addedProductId, setAddedProductId] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await catalogueAPI.get();
        const ads = response.data.data.ads || [];
        const catalogueProducts = response.data.data.products || [];
        preloadProductImages(response.data.data.image_urls || []);
        setProducts(getShowcaseProducts(ads.length ? ads : catalogueProducts, getDummyProducts()));
      } catch (error) {
        setProducts(getShowcaseProducts(getDummyProducts()));
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (product) => {
    const needsOptions = ['shoes', 'shirts', 'trousers', 'suits', 'tracksuits', 'jackets', 'linen', 't-shirts', 'polo-t-shirts']
      .includes((product.category_name || '').toLowerCase());

    if (needsOptions) {
      navigate(`/product/${product.slug}`);
      return;
    }

    await addToCart({
      productId: product.id,
      variantId: null,
      quantity: 1,
      sizeLabel: '',
      name: product.name,
      price: parseFloat(product.price),
      image: getPremiumImage(product),
      slug: product.slug,
      brandName: product.brand_name,
    });

    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1400);
  };

  return (
    <section className="py-32 bg-navy-950">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl space-y-6">
            <h2 className="text-4xl md:text-6xl font-serif text-white leading-tight">
              Our <span className="text-gold-500 italic">Collections</span>
            </h2>
            <p className="text-navy-300 font-light leading-relaxed">
              Browse selected pieces from Prince Esquire, including the color-led polo edit, and move straight from discovery to cart.
            </p>
          </div>
          <Link
            to="/products"
            className="text-gold-500 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-4 hover:gap-6 transition-all"
          >
            View All Products <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {products.map((product, index) => (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="group"
            >
              <div className="relative aspect-[4/5] bg-navy-900 overflow-hidden border border-gold-600/10 group-hover:border-gold-600/60 transition-colors">
                <img
                  src={getPremiumImage(product)}
                  alt={product.name}
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-contain p-3 bg-white transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-navy-950/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    className="bg-white text-navy-950 px-4 py-3 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 translate-y-4 group-hover:translate-y-0 transition-all duration-500"
                  >
                    <ShoppingBag size={13} />
                    {addedProductId === product.id ? 'Added' : 'Add to Cart'}
                  </button>
                  <Link
                    to={`/product/${product.slug}`}
                    className="border border-white/70 text-white px-4 py-3 text-[9px] font-bold uppercase tracking-widest translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:bg-white hover:text-navy-950"
                  >
                    View Product
                  </Link>
                </div>
              </div>
              <div className="pt-5 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold-600/50">{product.brand_name}</p>
                  {product.showcaseKicker && (
                    <span className="border border-gold-500/25 bg-gold-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-gold-300">
                      {product.showcaseKicker}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-serif text-white group-hover:text-gold-500 transition-colors">{product.showcaseName || product.name}</h3>
                <p className="text-gold-500 font-light italic">KSh {parseFloat(product.price).toLocaleString()}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
