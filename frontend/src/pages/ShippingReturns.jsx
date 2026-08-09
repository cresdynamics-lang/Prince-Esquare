import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Package, RefreshCw, Shield, Clock, Globe } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const ShippingReturns = () => {
  return (
    <div className="bg-navy-950 min-h-screen font-serif">
      <SEO
        title="Shipping & Returns - Prince Esquire"
        description="Learn about our shipping policies and return procedures at Prince Esquire."
        path="/shipping-returns"
      />
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-16">
              <span className="text-gold-500 text-[10px] tracking-[0.4em] font-bold">POLICIES</span>
              <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tight mt-4">Shipping & Returns</h1>
              <p className="text-navy-300 font-light mt-4">
                Everything you need to know about getting your order and our return policy.
              </p>
            </div>

            {/* Shipping Policy */}
            <div className="bg-navy-900/50 border border-gold-600/10 p-8 mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gold-600/10 p-3 rounded-lg">
                  <Truck className="text-gold-500" size={24} />
                </div>
                <h2 className="text-2xl font-serif text-gold-400">Shipping Policy</h2>
              </div>

              <div className="space-y-6 text-navy-300">
                <div>
                  <h3 className="text-white font-semibold mb-2">Delivery Within Kenya</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>Nairobi:</strong> 1-2 business days</li>
                    <li>• <strong>Major Towns:</strong> 2-3 business days</li>
                    <li>• <strong>Other Areas:</strong> 3-5 business days</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2">International Shipping</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>East Africa:</strong> 5-7 business days</li>
                    <li>• <strong>Rest of Africa:</strong> 7-10 business days</li>
                    <li>• <strong>International:</strong> 10-14 business days</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2">Free Shipping</h3>
                  <p className="text-sm">Enjoy free shipping on all orders over a specified amount within Kenya.</p>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2">Order Processing</h3>
                  <p className="text-sm">All orders are processed within 1-2 business days. You will receive a confirmation email with tracking information once your order ships.</p>
                </div>
              </div>
            </div>

            {/* Returns Policy */}
            <div className="bg-navy-900/50 border border-gold-600/10 p-8 mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gold-600/10 p-3 rounded-lg">
                  <RefreshCw className="text-gold-500" size={24} />
                </div>
                <h2 className="text-2xl font-serif text-gold-400">Returns & Exchanges</h2>
              </div>

              <div className="space-y-6 text-navy-300">
                <div>
                  <h3 className="text-white font-semibold mb-2">Return Policy</h3>
                  <p className="text-sm mb-2">We accept returns within 14 days of delivery. Items must be unworn, unwashed, and in original condition with tags attached.</p>
                  <ul className="space-y-1 text-sm">
                    <li>• Full refund available for eligible returns</li>
                    <li>• Store credit option available</li>
                    <li>• Return shipping fee applies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2">Exchanges</h3>
                  <p className="text-sm mb-2">Exchanges are available for different sizes or colors of the same item, subject to availability.</p>
                  <ul className="space-y-1 text-sm">
                    <li>• Free exchange within 7 days of delivery</li>
                    <li>• Size exchanges only (no style changes)</li>
                    <li>• Subject to stock availability</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2">Non-Returnable Items</h3>
                  <p className="text-sm">The following items cannot be returned or exchanged:</p>
                  <ul className="space-y-1 text-sm mt-2">
                    <li>• Bespoke and made-to-measure items</li>
                    <li>• Personalized or monogrammed items</li>
                    <li>• Undergarments and socks</li>
                    <li>• Items marked as final sale</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-navy-900/50 border border-gold-600/10 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="text-gold-500" size={20} />
                  <h3 className="text-white font-semibold">Secure Packaging</h3>
                </div>
                <p className="text-navy-300 text-sm">All items are carefully packaged to ensure they arrive in perfect condition.</p>
              </div>

              <div className="bg-navy-900/50 border border-gold-600/10 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Clock className="text-gold-500" size={20} />
                  <h3 className="text-white font-semibold">Order Tracking</h3>
                </div>
                <p className="text-navy-300 text-sm">Track your order in real-time with the tracking number provided via email.</p>
              </div>

              <div className="bg-navy-900/50 border border-gold-600/10 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Package className="text-gold-500" size={20} />
                  <h3 className="text-white font-semibold">Lost or Damaged Items</h3>
                </div>
                <p className="text-navy-300 text-sm">Contact us immediately if your order is lost or arrives damaged. We'll arrange a replacement or refund.</p>
              </div>

              <div className="bg-navy-900/50 border border-gold-600/10 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Globe className="text-gold-500" size={20} />
                  <h3 className="text-white font-semibold">Customs & Duties</h3>
                </div>
                <p className="text-navy-300 text-sm">International orders may be subject to customs duties and taxes, which are the customer's responsibility.</p>
              </div>
            </div>

            {/* Contact CTA */}
            <div className="mt-12 text-center">
              <p className="text-navy-300 mb-4">Have questions about shipping or returns?</p>
              <a href="/contact-us" className="text-gold-500 hover:text-gold-400 font-semibold">
                Contact Our Support Team
              </a>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ShippingReturns;
