import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsAPI } from '../services/api';

const SESSION_KEY = 'pe-visitor-session';

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `vs_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `vs_${Date.now()}`;
  }
}

function track(payload) {
  analyticsAPI.track(payload).catch(() => {});
}

export default function VisitorTracker() {
  const location = useLocation();
  const sessionId = useRef(getSessionId());
  const isFirst = useRef(true);

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;

    if (isFirst.current) {
      isFirst.current = false;
    }

    track({
      session_id: sessionId.current,
      event_type: 'page_view',
      path,
    });
  }, [location.pathname, location.search]);

  return null;
}

export function trackProductClick(product) {
  if (!product?.slug) return;
  track({
    session_id: getSessionId(),
    event_type: 'product_click',
    path: window.location.pathname,
    product_id: product.id,
    product_slug: product.slug,
    product_name: product.name,
    product_price: product.price,
  });
}

export function trackProductAddCart(product) {
  if (!product?.slug) return;
  track({
    session_id: getSessionId(),
    event_type: 'product_add_cart',
    path: window.location.pathname,
    product_id: product.id,
    product_slug: product.slug,
    product_name: product.name,
    product_price: product.price,
  });
}

export function trackWhatsAppOrderClick(product, { sizeLabel = '' } = {}) {
  if (!product?.slug) return;
  const path = sizeLabel
    ? `${window.location.pathname}?size=${encodeURIComponent(sizeLabel)}`
    : window.location.pathname;
  track({
    session_id: getSessionId(),
    event_type: 'whatsapp_order_click',
    path,
    product_id: product.id,
    product_slug: product.slug,
    product_name: product.name,
    product_price: product.price,
  });
}
