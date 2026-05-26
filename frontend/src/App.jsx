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
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';

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
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment/:orderId" element={<Payment />} />
        <Route path="/profile" element={<Profile />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin" element={<AdminLogin />} />
      </Routes>
    </Router>
  );
}

export default App;
