import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Always open page sections from the top (not mid-page / footer). */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    // Jump immediately so category/nav links never land on old scroll position
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search, hash]);

  return null;
}
