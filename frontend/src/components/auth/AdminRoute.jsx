// 19.10 - Ruta de admin: verifica que el usuario tenga rol admin

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== 'admin') return <Navigate to="/no-autorizado" replace />;

  return <Outlet />;
};

export default AdminRoute;
