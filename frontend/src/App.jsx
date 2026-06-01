import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import SEO from './components/SEO';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';

const NoIndexPage = ({ title, children }) => (
  <>
    <SEO
      title={title}
      description="Private Prince Esquire customer area."
      path={window.location.pathname}
      noindex
    />
    {children}
  </>
);

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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/polo-t-shirts" element={<Products categoryOverride="polo-t-shirts" />} />
        <Route path="/shoes" element={<Products categoryOverride="shoes" />} />
        <Route path="/shirts" element={<Products categoryOverride="shirts" />} />
        <Route path="/suits" element={<Products categoryOverride="suits" />} />
        <Route path="/trousers" element={<Products categoryOverride="trousers" />} />
        <Route path="/linen" element={<Products categoryOverride="linen" />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<NoIndexPage title="Shopping Bag"><Cart /></NoIndexPage>} />
        <Route path="/login" element={<NoIndexPage title="Client Login"><Login /></NoIndexPage>} />
        <Route path="/signup" element={<NoIndexPage title="Create Account"><SignUp /></NoIndexPage>} />
        <Route path="/checkout" element={<NoIndexPage title="Checkout"><Checkout /></NoIndexPage>} />
        <Route path="/payment/:orderId" element={<NoIndexPage title="Payment"><Payment /></NoIndexPage>} />
        <Route path="/profile" element={<NoIndexPage title="Profile"><Profile /></NoIndexPage>} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<NoIndexPage title="Staff Login"><AdminLogin /></NoIndexPage>} />
        <Route path="/admin/dashboard" element={<NoIndexPage title="Admin Dashboard"><AdminDashboard /></NoIndexPage>} />
        <Route path="/admin" element={<NoIndexPage title="Staff Login"><AdminLogin /></NoIndexPage>} />
      </Routes>
    </Router>
  );
}

export default App;
