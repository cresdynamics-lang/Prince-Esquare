import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import HomeHero from '../components/home/HomeHero';
import HomeCategoryRail from '../components/home/HomeCategoryRail';
import HomeProductRail from '../components/home/HomeProductRail';
import HomeEditorial from '../components/home/HomeEditorial';
import HomeBespokeStrip from '../components/home/HomeBespokeStrip';
import HomeWideBanner from '../components/home/HomeWideBanner';
import HomeSignupBand from '../components/home/HomeSignupBand';
import { productAPI } from '../services/api';
import { HOME_LINEN_BANNER, HOME_GIFT_BANNER } from '../data/homepageContent';
import { localBusinessSchema, organizationSchema, routeSeo, websiteSchema } from '../seo/seoData';

const Home = () => {
  const [newArrivals, setNewArrivals] = useState([]);
  const [saleRail, setSaleRail] = useState([]);
  const [editorial, setEditorial] = useState([]);
  const [bespokeLeadDays, setBespokeLeadDays] = useState(14);
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingSale, setLoadingSale] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoadingNew(true);
    productAPI
      .newArrivals({ limit: 16 })
      .then((res) => {
        if (!cancelled) {
          const payload = res.data?.data;
          setNewArrivals(Array.isArray(payload) ? payload : payload?.products || []);
        }
      })
      .catch(() => {
        if (!cancelled) setNewArrivals([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingNew(false);
      });

    setLoadingSale(true);
    productAPI
      .sale()
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data || {};
        const bestsellers = data.bestsellers || [];
        const markdown = data.products || [];
        // One row: bestsellers first, then on-sale (deduped by API already)
        const seen = new Set();
        const merged = [];
        for (const p of [...bestsellers, ...markdown]) {
          if (!p?.id || seen.has(p.id)) continue;
          seen.add(p.id);
          merged.push(p);
        }
        setSaleRail(merged.slice(0, 16));
      })
      .catch(() => {
        if (!cancelled) setSaleRail([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSale(false);
      });

    productAPI
      .editorial()
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data || {};
        setEditorial(data.products || []);
        if (data.bespokeLeadDays) setBespokeLeadDays(data.bespokeLeadDays);
      })
      .catch(() => {
        if (!cancelled) setEditorial([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-navy-950">
      <SEO
        {...routeSeo.home}
        schema={[organizationSchema, localBusinessSchema, websiteSchema]}
      />
      <Navbar />

      <main>
        <HomeHero />
        <HomeCategoryRail />
        <HomeProductRail
          id="home-new-arrivals"
          eyebrow="This Week's Arrivals"
          title="See it before it's everywhere."
          products={newArrivals}
          loading={loadingNew}
          endHref="/new-arrivals"
          endLabel="View all new arrivals"
        />
        <HomeProductRail
          id="home-sale"
          eyebrow="Bestsellers & Sale"
          title="What everyone else is already choosing — some of it reduced."
          products={saleRail}
          loading={loadingSale}
          badgeMode="sale-rail"
          endHref="/sale"
          endLabel="Shop the Sale"
        />
        <HomeEditorial products={editorial} />
        <HomeBespokeStrip leadDays={bespokeLeadDays} />
        <HomeWideBanner {...HOME_LINEN_BANNER} />
        <HomeWideBanner {...HOME_GIFT_BANNER} />
        <HomeSignupBand />
      </main>

      <Footer />
    </div>
  );
};

export default Home;
