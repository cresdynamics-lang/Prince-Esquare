import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HeroSlider from '../components/HeroSlider';
import ProductShowcase from '../components/ProductShowcase';
import CategoryGrid from '../components/CategoryGrid';
import BlogShowcase from '../components/BlogShowcase';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { bannerAPI } from '../services/api';
import { localBusinessSchema, organizationSchema, routeSeo, websiteSchema } from '../seo/seoData';

const Home = () => {
  const [homepageData, setHomepageData] = useState(null);
  const [featuredBlogs, setFeaturedBlogs] = useState([]);

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

  useEffect(() => {
    let cancelled = false;

    const fetchFeaturedBlogs = async () => {
      try {
        const response = await fetch('/api/blog?limit=3', {
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch featured blogs');
        const data = await response.json();

        if (!cancelled) {
          setFeaturedBlogs(Array.isArray(data.posts) ? data.posts : []);
        }
      } catch (error) {
        console.error('Home: featured blogs unavailable', error);
      }
    };

    fetchFeaturedBlogs();

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

        {featuredBlogs.length > 0 && (
          <section className="py-24 bg-navy-950 border-y border-gold-600/10">
            <div className="container mx-auto px-6">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
                <div className="max-w-3xl space-y-4">
                  <span className="text-gold-500 text-[10px] tracking-[0.4em] font-bold uppercase">
                    Style Journal
                  </span>
                  <h2 className="text-3xl md:text-5xl font-serif text-white leading-tight">
                    Recent notes from the Prince Esquire journal
                  </h2>
                  <p className="text-navy-200 max-w-2xl leading-relaxed">
                    Short editorial reads, wardrobe guidance, and product-led style ideas that support the collection and keep the brand discoverable.
                  </p>
                </div>
                <Link
                  to="/blog"
                  className="inline-flex items-center justify-center bg-gold-600 text-navy-950 px-7 py-3 text-[10px] font-bold tracking-[0.25em] uppercase hover:bg-gold-500 transition-colors"
                >
                  View all articles
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredBlogs.map((blog) => (
                  <BlogShowcase key={blog.id} blog={blog} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Quote Section */}
        <section className="py-16 md:py-20 bg-navy-950 text-center relative overflow-hidden border-t border-gold-600/10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-gold-500/50 to-transparent" />
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-4xl md:text-6xl font-serif italic text-gold-200 leading-tight">
                "True elegance is not being noticed, it's being remembered."
              </h2>
              <div className="flex items-center justify-center space-x-6">
                <div className="w-16 h-px bg-gold-600/30" />
                <span className="text-gold-500 tracking-[0.5em] text-[10px]  font-bold">Giorgio Armani</span>
                <div className="w-16 h-px bg-gold-600/30" />
              </div>
            </motion.div>
          </div>
        </section>

        <CategoryGrid />

        <section className="py-28 bg-navy-950 border-y border-gold-600/10">
          <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-gold-500 text-[10px]  tracking-[0.4em] font-bold">Luxury Fashion Kenya</span>
              <h1 className="text-4xl md:text-6xl font-serif text-white leading-tight">
                Curated Luxury Fashion in Kenya
              </h1>
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
                  <div key={item} className="border-l border-gold-600/30 pl-5">
                    <p className="text-gold-400 text-[10px]  tracking-[0.25em] font-bold">{item}</p>
                  </div>
                ))}
              </div>
              <Link
                to="/products"
                className="inline-block mt-4 bg-gold-600 text-navy-950 px-10 py-4 text-[10px] font-bold  tracking-[0.25em] hover:bg-gold-500 transition-all"
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
              <h3 className="text-gold-500 tracking-[0.3em]  text-xs font-bold">The Prince Experience</h3>
              <h2 className="text-4xl md:text-7xl font-serif text-white  tracking-tighter leading-none">
                Crafted For <br />
                <span className="text-gold-500 italic">Discerning Taste</span>
              </h2>
              <p className="text-navy-200 font-light leading-relaxed max-w-xl mx-auto">
                Step into a world where every detail is considered, every stitch is intentional,
                and your unique style is celebrated.
              </p>
              <Link
                to="/signup"
                className="inline-block bg-transparent border border-gold-600 text-gold-500 px-16 py-6 text-[10px] font-bold  tracking-[0.3em] hover:bg-gold-600 hover:text-navy-950 transition-all shadow-2xl shadow-gold-600/20"
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
