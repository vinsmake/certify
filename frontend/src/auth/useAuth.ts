import { use } from 'react';
import { AuthContext } from './AuthContext';

export const useAuth = () => {
  const context = use(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

/** Usuario autenticado. Solo para componentes bajo ProtectedRoute. */
export const useCurrentUser = () => {
  const { user, isAdmin } = useAuth();
  if (!user) throw new Error('useCurrentUser requiere un usuario autenticado');
  return { user, isAdmin };
};
