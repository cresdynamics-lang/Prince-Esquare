import { useState } from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { getPremiumImage } from '../utils/productImages';

const needsSizeSelection = (product) =>
  ['shoes', 'shirts', 'trousers', 'suits', 'tracksuits', 'jackets', 'linen', 't-shirts', 'polo-t-shirts']
    .includes((product.category_name || product.parent_category_name || '').toLowerCase());

const ProductCard = ({ product, onAddToCart, addedProductId }) => (
  <article className="group flex-shrink-0 w-[46%] sm:w-[32%] md:w-[24%] lg:w-[18%] min-w-[140px]">
    <Link to={`/product/${product.slug}`} className="block">
      <div className="relative aspect-[4/5] bg-navy-900 overflow-hidden border border-gold-600/10 group-hover:border-gold-600/60 transition-colors">
        <img
          src={product.image_url || getPremiumImage(product, { width: 400 })}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain p-3 bg-white"
        />
        <div className="absolute inset-0 bg-navy-950/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 px-4 pointer-events-none group-hover:pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onAddToCart(product);
            }}
            className="bg-white text-navy-950 px-4 py-3 text-[9px] font-bold   flex items-center gap-2"
          >
            <ShoppingBag size={13} />
            {addedProductId === product.id ? 'Added' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
    <div className="pt-3 space-y-1">
      <p className="text-[10px] font-bold   text-gold-600/50">{product.brand_name}</p>
      <h3 className="text-sm md:text-base font-serif text-white group-hover:text-gold-500 transition-colors line-clamp-2">
        {product.name}
      </h3>
      <p className="text-gold-500 font-light italic text-sm">
        KSh {parseFloat(product.price).toLocaleString()}
      </p>
    </div>
  </article>
);

const ProductShowcase = ({ categoryRows = [] }) => {
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);
  const [addedProductId, setAddedProductId] = useState(null);

  const handleAddToCart = async (product) => {
    if (needsSizeSelection(product)) {
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

  if (!categoryRows.length) return null;

  return (
    <section className="pt-8 pb-20 md:pt-10 md:pb-24 bg-navy-950">
      <div className="container mx-auto px-6 space-y-12 md:space-y-14">
        {categoryRows.map((row) => (
          <div key={row.slug}>
            <div className="flex items-center justify-between gap-4 mb-5 md:mb-6">
              <h2 className="text-xl md:text-2xl font-serif text-white">
                {row.title}
              </h2>
              <Link
                to={row.path || '/products'}
                className="text-gold-500 text-[10px] font-bold  tracking-[0.3em] flex items-center gap-2 hover:gap-3 transition-all shrink-0"
              >
                View All <ArrowRight size={14} />
              </Link>
            </div>

            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-gold-600/30 scrollbar-track-transparent">
              {row.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  addedProductId={addedProductId}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 flex justify-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-3 border border-gold-500/50 text-gold-500 px-10 py-4 text-[10px] font-bold  tracking-[0.35em] hover:bg-gold-500 hover:text-navy-950 transition-all"
          >
            View All Products <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
