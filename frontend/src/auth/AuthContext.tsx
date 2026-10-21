import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { CurrentUser } from '@certify/shared';
import { authApi } from '../api';
import { TOKEN_KEY } from '../lib/http';

export interface AuthState {
  user: CurrentUser | null;
  /** true mientras se valida el token guardado al abrir la app */
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem(TOKEN_KEY));

  // Al cargar la app, validar el token guardado
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token } = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    // /auth/me incluye dependency_name
    const me = await authApi.me();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'admin', login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
};
