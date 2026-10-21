import { Navigate, Outlet } from 'react-router';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from './useAuth';

/** Exige sesion iniciada; con adminOnly ademas exige rol admin. */
export const ProtectedRoute = ({ adminOnly = false }: { adminOnly?: boolean }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/no-autorizado" replace />;
  return <Outlet />;
};
