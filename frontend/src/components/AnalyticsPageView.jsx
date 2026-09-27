import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const GA_ID = 'G-NDPLT7MS4M';
const META_PIXEL_ID = '1727389474931863';

export default function AnalyticsPageView() {
  const location = useLocation();
  const isFirstView = useRef(true);

  useEffect(() => {
    const pagePath = `${location.pathname}${location.search}`;

    if (isFirstView.current) {
      isFirstView.current = false;
      return;
    }

    if (typeof window.gtag === 'function') {
      window.gtag('config', GA_ID, { page_path: pagePath });
    }

    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname, location.search]);

  return null;
}
