// NEW — Seller-only route guard
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const RequireSeller = () => {
  const { isAuthenticated, isSeller } = useAuthStore();
  if (!isAuthenticated || !isSeller) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
};

export default RequireSeller;
