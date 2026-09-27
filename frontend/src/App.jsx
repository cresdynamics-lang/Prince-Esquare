import { useEffect, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Home from './pages/Home';
import IsolatedRoute from './components/IsolatedRoute';
import PageErrorBoundary from './components/PageErrorBoundary';
import AnalyticsPageView from './components/AnalyticsPageView';
import VisitorTracker from './components/VisitorTracker';
import ScrollToTop from './components/ScrollToTop';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';

// Lazy route islands — each page chunk loads independently; a broken chunk
// cannot take down Home, search overlay, or other routes.
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const CategoryLanding = lazy(() => import('./pages/CategoryLanding'));
const Sale = lazy(() => import('./pages/Sale'));
const NewArrivals = lazy(() => import('./pages/NewArrivals'));
const Cart = lazy(() => import('./pages/Cart'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Payment = lazy(() => import('./pages/Payment'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));

function RedirectJacketsOuterwearSub() {
  const { sub } = useParams();
  return <Navigate to={`/shop/jackets/${sub || ''}`} replace />;
}

function App() {
  useEffect(() => {
    const t = setTimeout(() => {
      if (useAuthStore.getState().isAuthenticated) {
        useCartStore.getState().loadCart();
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <Router>
      <ScrollToTop />
      {/* Analytics + visitor tracking sit outside page islands — survive page crashes */}
      <AnalyticsPageView />
      <VisitorTracker />
      <PageErrorBoundary label="the storefront">
        <Routes>
          <Route
            path="/"
            element={
              <IsolatedRoute label="Home">
                <Home />
              </IsolatedRoute>
            }
          />
          <Route
            path="/sale"
            element={
              <IsolatedRoute label="Sale">
                <Sale />
              </IsolatedRoute>
            }
          />
          <Route
            path="/new-arrivals"
            element={
              <IsolatedRoute label="New Arrivals">
                <NewArrivals />
              </IsolatedRoute>
            }
          />
          <Route
            path="/shop/:slug/:sub/:tier"
            element={
              <IsolatedRoute label="Collection">
                <CategoryLanding />
              </IsolatedRoute>
            }
          />
          <Route
            path="/shop/:slug/:sub"
            element={
              <IsolatedRoute label="Collection">
                <CategoryLanding />
              </IsolatedRoute>
            }
          />
          <Route
            path="/shop/:slug"
            element={
              <IsolatedRoute label="Collection">
                <CategoryLanding />
              </IsolatedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <IsolatedRoute label="Products">
                <Products />
              </IsolatedRoute>
            }
          />
          <Route
            path="/product/:slug"
            element={
              <IsolatedRoute label="Product">
                <ProductDetail />
              </IsolatedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <IsolatedRoute label="Cart">
                <Cart />
              </IsolatedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <IsolatedRoute label="Login">
                <Login />
              </IsolatedRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <IsolatedRoute label="Sign up">
                <SignUp />
              </IsolatedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <IsolatedRoute label="Checkout">
                <Checkout />
              </IsolatedRoute>
            }
          />
          <Route
            path="/payment/:orderId"
            element={
              <IsolatedRoute label="Payment">
                <Payment />
              </IsolatedRoute>
            }
          />
          <Route
            path="/contact-us"
            element={
              <IsolatedRoute label="Contact">
                <ContactUs />
              </IsolatedRoute>
            }
          />
          <Route
            path="/contact"
            element={<Navigate to="/contact-us" replace />}
          />

          {/* Legacy flat category URLs → taxonomy landings */}
          <Route path="/shirts" element={<Navigate to="/shop/shirts" replace />} />
          <Route path="/shirts/formal" element={<Navigate to="/shop/shirts/formal-shirts" replace />} />
          <Route path="/shirts/casual" element={<Navigate to="/shop/shirts/shirts-casual" replace />} />
          <Route path="/shirts/polo" element={<Navigate to="/shop/shirts/polo-t-shirts" replace />} />
          <Route path="/shirts/t-shirts" element={<Navigate to="/shop/shirts/t-shirts" replace />} />
          <Route path="/shirts/sweatshirts" element={<Navigate to="/shop/shirts/sweat-shirts" replace />} />
          <Route path="/polo-t-shirts" element={<Navigate to="/shop/shirts/polo-t-shirts" replace />} />
          <Route path="/shoes" element={<Navigate to="/shop/shoes" replace />} />
          <Route path="/shoes/formal" element={<Navigate to="/shop/shoes/formal-shoes" replace />} />
          <Route path="/shoes/bespoke-formal" element={<Navigate to="/shop/shoes/bespoke-formal" replace />} />
          <Route path="/shoes/loafers" element={<Navigate to="/shop/shoes/loafers" replace />} />
          <Route path="/shoes/casual" element={<Navigate to="/shop/shoes/casual" replace />} />
          <Route path="/suits" element={<Navigate to="/shop/suits" replace />} />
          <Route path="/trousers" element={<Navigate to="/shop/trousers" replace />} />
          <Route path="/trousers/chino" element={<Navigate to="/shop/trousers/chino" replace />} />
          <Route path="/trousers/khaki" element={<Navigate to="/shop/trousers/khaki" replace />} />
          <Route path="/trousers/linen" element={<Navigate to="/shop/trousers/linen-trousers" replace />} />
          <Route path="/trousers/denim-jeans" element={<Navigate to="/shop/trousers/jeans" replace />} />
          <Route path="/trousers/cargo" element={<Navigate to="/shop/trousers/cargo" replace />} />
          <Route path="/jackets-outerwear" element={<Navigate to="/shop/jackets" replace />} />
          <Route path="/jackets-outerwear/full-jackets" element={<Navigate to="/shop/jackets/full-jackets" replace />} />
          <Route path="/jackets-outerwear/half-jackets" element={<Navigate to="/shop/jackets/half-jackets" replace />} />
          <Route path="/jackets-outerwear/track-tops" element={<Navigate to="/shop/jackets/track-tops" replace />} />
          <Route path="/shop/jackets-outerwear" element={<Navigate to="/shop/jackets" replace />} />
          <Route path="/shop/jackets-outerwear/:sub" element={<RedirectJacketsOuterwearSub />} />
          <Route path="/accessories" element={<Navigate to="/shop/accessories" replace />} />
        <Route path="/accessories/belts" element={<Navigate to="/shop/accessories/belts" replace />} />
        <Route path="/accessories/ties" element={<Navigate to="/shop/accessories/ties" replace />} />
        <Route path="/accessories/caps" element={<Navigate to="/shop/accessories/caps" replace />} />
        <Route path="/accessories/hats" element={<Navigate to="/shop/accessories/hats" replace />} />
        <Route path="/gift-sets" element={<Navigate to="/shop/gift-sets" replace />} />
        <Route path="/gifts" element={<Navigate to="/shop/gift-sets" replace />} />
        <Route path="/linen" element={<Navigate to="/shop/linen-edit" replace />} />

          <Route
            path="/admin/login"
            element={
              <IsolatedRoute label="Admin login">
                <AdminLogin />
              </IsolatedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <IsolatedRoute label="Admin">
                <AdminDashboard />
              </IsolatedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </PageErrorBoundary>
    </Router>
  );
}

export default App;
