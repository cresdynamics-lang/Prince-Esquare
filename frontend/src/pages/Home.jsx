import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HeroSlider from '../components/HeroSlider';
import ProductShowcase from '../components/ProductShowcase';
import CategoryGrid from '../components/CategoryGrid';
import HomeBlogSection from '../components/HomeBlogSection';
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
        <HeroSlider />

        <ProductShowcase categoryRows={homepageData?.categoryRows} />

        <section className="relative overflow-hidden border-t border-gold-600/10 bg-navy-950 py-16 text-center md:py-20">
          <div className="absolute left-1/2 top-0 h-24 w-px -translate-x-1/2 bg-gradient-to-b from-gold-500/50 to-transparent" />
          <div className="container mx-auto max-w-4xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="font-serif text-3xl italic leading-tight text-gold-200 md:text-4xl">
                &ldquo;True elegance is not being noticed, it&apos;s being remembered.&rdquo;
              </h2>
              <div className="flex items-center justify-center space-x-6">
                <div className="h-px w-16 bg-gold-600/30" />
                <span className="text-[10px] font-bold tracking-[0.5em] text-gold-500">Giorgio Armani</span>
                <div className="h-px w-16 bg-gold-600/30" />
              </div>
            </motion.div>
          </div>
        </section>

        <CategoryGrid />

        <section className="border-y border-gold-600/10 bg-navy-950 py-28">
          <div className="container mx-auto grid grid-cols-1 items-start gap-16 px-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-5">
              <span className="text-[10px] font-bold tracking-[0.4em] text-gold-500">Luxury Fashion Kenya</span>
              <h1 className="font-serif text-3xl leading-tight text-white md:text-4xl">
                Curated Luxury Fashion in Kenya
              </h1>
            </div>
            <div className="space-y-6 font-light leading-relaxed text-navy-200 lg:col-span-7">
              <p>
                Prince Esquire is Nairobi&apos;s destination for luxury fashion in Kenya, bringing together premium menswear,
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
              <p>
                Visit us in person at <span className="text-gold-400">Yala Towers, Nairobi CBD</span> — The Man&apos;s Shop —
                or order directly on WhatsApp for delivery countrywide.
              </p>
              <div className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-3">
                {['Curated premium labels', 'Yala Towers, Nairobi', 'Delivery across Kenya'].map((item) => (
                  <div key={item} className="border-l border-gold-600/30 pl-5">
                    <p className="text-[10px] font-bold tracking-[0.25em] text-gold-400">{item}</p>
                  </div>
                ))}
              </div>
              <Link
                to="/products"
                className="mt-4 inline-block bg-gold-600 px-10 py-4 text-[10px] font-bold tracking-[0.25em] text-navy-950 transition-all hover:bg-gold-500 rounded-full"
              >
                Shop the Collection
              </Link>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-[480px] items-center overflow-hidden py-24 md:h-[600px] md:py-0">
          <img
            src="/hero/tracksuits-1600.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-navy-950/85" />
          <div className="container relative z-10 mx-auto space-y-8 px-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mx-auto max-w-3xl space-y-10"
            >
              <h3 className="text-xs font-bold tracking-[0.3em] text-gold-500">The Prince Experience</h3>
              <h2 className="font-serif text-3xl leading-none tracking-tighter text-white md:text-4xl">
                Crafted For <br />
                <span className="italic text-gold-500">Discerning Taste</span>
              </h2>
              <p className="mx-auto max-w-xl font-light leading-relaxed text-navy-200">
                Step into a world where every detail is considered, every stitch is intentional,
                and your unique style is celebrated.
              </p>
              <Link
                to="/signup"
                className="inline-block border border-gold-600 bg-transparent px-16 py-6 text-[10px] font-bold tracking-[0.3em] text-gold-500 shadow-2xl shadow-gold-600/20 transition-all hover:bg-gold-600 hover:text-navy-950 rounded-full"
              >
                Join the Inner Circle
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="bg-navy-900/30 py-40">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 gap-24 md:grid-cols-3">
              {[
                { title: 'The Finest Materials', desc: 'Sourcing only the most exquisite fabrics from the heritage mills of Italy and the UK.', icon: '01' },
                { title: 'Artisanal Craft', desc: 'Every garment is a unique masterpiece created by our master tailors with decades of experience.', icon: '02' },
                { title: 'Personalized Concierge', desc: 'Our sartorial experts are at your service to curate a wardrobe that fits your unique lifestyle.', icon: '03' },
              ].map((promise, i) => (
                <motion.div
                  key={promise.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="group space-y-8"
                >
                  <span className="block font-serif text-4xl text-gold-600/10 transition-colors duration-500 group-hover:text-gold-600/20">
                    {promise.icon}
                  </span>
                  <h3 className="border-b border-gold-600/10 pb-4 font-serif text-lg text-gold-400 md:text-xl">
                    {promise.title}
                  </h3>
                  <p className="text-sm font-light leading-relaxed text-navy-300">{promise.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <HomeBlogSection />
      </main>

      <Footer />
    </div>
  );
};

export default Home;
