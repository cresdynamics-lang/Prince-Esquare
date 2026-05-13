import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { products } from '../data/products';
import { 
  ShoppingBag, 
  Plus, 
  Minus
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCartStore } from '../store/useCartStore';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find(p => p.id === parseInt(id));
  const addToCart = useCartStore((state) => state.addToCart);
  
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[0] || '');
      setSelectedVariant(product.variants?.[0] || { name: 'Default', image: product.image });
      setActiveImage(product.image);
    }
  }, [product]);

  useEffect(() => {
    if (selectedVariant) {
      setActiveImage(selectedVariant.image);
    }
  }, [selectedVariant]);

  if (!product) return (
    <div className="min-h-screen pt-32 text-center text-white bg-navy-950 font-serif">
      Product not found.
      <Link to="/products" className="block mt-4 text-gold-500 underline uppercase tracking-widest text-[10px]">Back to products</Link>
    </div>
  );

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedVariant.name);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedVariant.name);
    navigate('/checkout');
  };

  return (
    <div className="bg-navy-950 min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-24">
        <div className="container mx-auto px-4 md:px-6">
          
          {/* Main Product Area: Two-column grid (Editorial Structure) */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Image Area */}
            <div className="lg:col-span-6">
              <div className="relative aspect-square md:aspect-[4/5] bg-navy-900 overflow-hidden rounded-sm border border-gold-600/10">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={activeImage}
                    src={activeImage} 
                    alt={product.name} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                {product.featured && (
                  <div className="absolute top-6 left-6 bg-gold-600 text-navy-950 px-4 py-1 text-[10px] font-bold uppercase tracking-widest">
                    Featured Edit
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Product Details (Refined for Navy/Gold theme) */}
            <div className="lg:col-span-4 space-y-8">
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-500">{product.brand}</p>
                <h1 className="text-4xl md:text-5xl font-serif text-white leading-tight">
                  {product.name}
                </h1>
                <p className="text-2xl font-light text-gold-400 italic">KSh {product.price.toLocaleString()}</p>
              </div>

              {/* Color Variants: Vertical stack */}
              {product.variants && (
                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-gold-500">Color Selection</h3>
                  <div className="flex flex-col space-y-3">
                    {product.variants.map((variant, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedVariant(variant)}
                        className={`flex items-center justify-between px-6 py-4 border transition-all group ${
                          selectedVariant?.name === variant.name 
                            ? 'bg-gold-600 text-navy-950 border-gold-600' 
                            : 'bg-navy-900 text-white border-gold-600/20 hover:border-gold-600'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest">{variant.name}</span>
                        <div className={`w-3 h-3 rounded-full border ${selectedVariant?.name === variant.name ? 'bg-navy-950 border-white/20' : 'bg-gold-600/20 border-gold-600/40'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-gold-500">Select Size</h3>
                  <button className="text-[10px] uppercase tracking-widest text-gold-600/50 font-bold hover:text-gold-500 transition-colors">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.sizes?.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 flex items-center justify-center text-[10px] font-bold border transition-all ${
                        selectedSize === size 
                          ? 'bg-gold-600 text-navy-950 border-gold-600' 
                          : 'bg-navy-900 text-white border-gold-600/20 hover:border-gold-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gold-600/20 px-4 py-3 bg-navy-950">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1 text-gold-600 hover:text-gold-500 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-6 text-[10px] font-bold text-white w-12 text-center">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-1 text-gold-600 hover:text-gold-500 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  <button 
                    onClick={handleAddToCart}
                    className="flex-1 bg-navy-950 border border-gold-600 text-gold-500 py-4 px-6 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gold-600 hover:text-navy-950 transition-all flex items-center justify-center space-x-3"
                  >
                    <ShoppingBag size={14} />
                    <span>Add to Bag</span>
                  </button>
                </div>
                
                <button 
                  onClick={handleBuyNow}
                  className="w-full bg-gold-600 text-navy-950 py-5 px-6 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gold-500 transition-all"
                >
                  Buy it now
                </button>
              </div>

              {/* Features */}
              <div className="space-y-8 pt-10 border-t border-gold-600/10">
                <p className="text-slate-400 text-sm leading-relaxed font-light">
                  {product.description}
                </p>
                
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-gold-500">Key Features</h4>
                  <ul className="space-y-3">
                    {product.features?.map((feature, i) => (
                      <li key={i} className="flex items-start space-x-3 text-slate-300 text-xs">
                        <span className="shrink-0">{feature.split(' ')[0]}</span>
                        <span className="font-light">{feature.split(' ').slice(1).join(' ')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-32 pt-20 border-t border-gold-600/10">
              <h2 className="text-3xl font-serif text-white mb-12">You may also like</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {relatedProducts.map((p) => (
                  <Link to={`/product/${p.id}`} key={p.id} className="group block">
                    <div className="aspect-square bg-navy-900 overflow-hidden mb-6 border border-gold-600/10">
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-bold text-white uppercase tracking-widest min-h-[30px] group-hover:text-gold-500 transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-xs font-light text-gold-500 italic">KSh {p.price.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
