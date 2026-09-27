import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const GA_ID = 'G-NDPLT7MS4M';
const META_PIXEL_ID = '1727389474931863';

/**
 * SPA page views for GA4 + Meta Pixel — kept outside IsolatedRoute so
 * retargeting audiences keep updating even if a page island crashes.
 */
export default function AnalyticsPageView() {
  const location = useLocation();
  const isFirstView = useRef(true);

  useEffect(() => {
    const pagePath = `${location.pathname}${location.search}`;

    if (isFirstView.current) {
      isFirstView.current = false;
      return;
    }

    try {
      if (typeof window.gtag === 'function') {
        window.gtag('config', GA_ID, { page_path: pagePath });
      }
    } catch {
      /* GA must never break navigation */
    }

    try {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'PageView');
        // Custom signal for Ads Manager custom audiences (path-based retargeting)
        window.fbq('trackCustom', 'SpaPageView', {
          page_path: pagePath,
          pixel_id: META_PIXEL_ID,
        });
      }
    } catch {
      /* Pixel must never break navigation */
    }
  }, [location.pathname, location.search]);

  return null;
}
