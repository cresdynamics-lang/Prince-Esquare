import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HeroSlider from '../components/HeroSlider';
import ProductShowcase from '../components/ProductShowcase';
import CategoryGrid from '../components/CategoryGrid';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { bannerAPI } from '../services/api';
import { localBusinessSchema, organizationSchema, routeSeo, websiteSchema } from '../seo/seoData';

const Home = () => {
  const [homepageData, setHomepageData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    bannerAPI
      .getHomepageData()
      .then((res) => {
        if (!cancelled) setHomepageData(res.data?.data || null);
      })
      .catch((error) => {
        console.error('Home: homepage data unavailable', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-navy-950 min-h-screen">
      <SEO
        {...routeSeo.home}
        schema={[organizationSchema, localBusinessSchema, websiteSchema]}
      />
      <Navbar />

      <main>
        <HeroSlider heroSlides={homepageData?.heroSlides} />

        <ProductShowcase categoryRows={homepageData?.categoryRows} />

        {/* Quote Section */}
        <section className="py-16 md:py-20 bg-navy-950 text-center relative overflow-hidden border-t border-gold-600/10">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-2xl md:text-4xl font-serif italic text-gold-200 leading-snug">
                "True elegance is not being noticed, it's being remembered."
              </h2>
              <span className="text-gold-500 text-xs font-medium">Giorgio Armani</span>
            </motion.div>
          </div>
        </section>

        <CategoryGrid />

        <section className="py-28 bg-navy-950 border-y border-gold-600/10">
          <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-gold-500 text-xs font-medium">Luxury Fashion Kenya</span>
              <h2 className="text-2xl md:text-4xl font-serif text-white leading-snug">
                Curated Luxury Fashion in Kenya
              </h2>
            </div>
            <div className="lg:col-span-7 space-y-6 text-navy-200 font-light leading-relaxed">
              <p>
                Prince Esquire is Nairobi's destination for luxury fashion in Kenya, bringing together premium menswear,
                designer shoes, refined linen, tailored suits and polished accessories for wardrobes with presence.
              </p>
              <p>
                Our edit is built for discerning Kenyan professionals, diaspora clients and East African style enthusiasts
                who value authenticity, considered detail and pieces that move confidently from business to private occasions.
              </p>
              <p>
                Every collection is selected with a careful eye for fabric, silhouette and finish. From luxury suits in
                Nairobi to designer shoes and elegant casualwear, Prince Esquire offers a composed shopping experience with
                delivery across Kenya and attentive customer care.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                {['Curated premium labels', 'Nairobi-based service', 'Delivery across Kenya'].map((item) => (
                  <div key={item} className="border-l border-gold-600/30 pl-4">
                    <p className="text-gold-400 text-xs font-medium">{item}</p>
                  </div>
                ))}
              </div>
              <Link
                to="/products"
                className="inline-block mt-4 bg-gold-600 text-navy-950 px-8 py-3 text-xs font-semibold hover:bg-gold-500 transition-all"
              >
                Shop the Collection
              </Link>
            </div>
          </div>
        </section>

        {/* Video Background CTA */}
        <section className="relative h-[600px] flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-fixed bg-cover bg-center" style={{ backgroundImage: 'url("/WhatsApp Image 2026-05-12 at 8.07.18 PM.jpeg")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-[2px]" />
          </div>
          <div className="container mx-auto px-6 relative z-10 text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto space-y-10"
            >
              <h3 className="text-gold-500 text-sm font-medium">The Prince Experience</h3>
              <h2 className="text-3xl md:text-5xl font-serif text-white tracking-tight leading-tight">
                Crafted For <br />
                <span className="text-gold-500 italic">Discerning Taste</span>
              </h2>
              <p className="text-navy-200 font-light leading-relaxed max-w-xl mx-auto">
                Step into a world where every detail is considered, every stitch is intentional,
                and your unique style is celebrated.
              </p>
              <Link
                to="/signup"
                className="inline-block bg-transparent border border-gold-600 text-gold-500 px-10 py-4 text-xs font-semibold hover:bg-gold-600 hover:text-navy-950 transition-all"
              >
                Join the Inner Circle
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Brand Promise Section */}
        <section className="py-40 bg-navy-900/30">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-24">
              {[
                { title: 'The Finest Materials', desc: 'Sourcing only the most exquisite fabrics from the heritage mills of Italy and the UK.', icon: '01' },
                { title: 'Artisanal Craft', desc: 'Every garment is a unique masterpiece created by our master tailors with decades of experience.', icon: '02' },
                { title: 'Personalized Concierge', desc: 'Our sartorial experts are at your service to curate a wardrobe that fits your unique lifestyle.', icon: '03' }
              ].map((promise, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="space-y-8 group"
                >
                  <span className="text-6xl font-serif text-gold-600/10 group-hover:text-gold-600/20 transition-colors duration-500 block">{promise.icon}</span>
                  <h3 className="text-xl font-serif text-gold-400   border-b border-gold-600/10 pb-4">{promise.title}</h3>
                  <p className="text-navy-300 font-light text-sm leading-relaxed">{promise.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
