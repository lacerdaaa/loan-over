import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../../lib/auth';

export const ProtectedRoute = () =>
  isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
