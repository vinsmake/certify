// 19.01 - Contexto de autenticacion con estado de usuario, token y funciones login/logout

import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // 19.05 - Al cargar la app, verificar si hay token en localStorage y validarlo
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      authService
        .getMe()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          // Token invalido o expirado
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // 19.04 - Login: guardar token, luego obtener datos completos via getMe (incluye dependency_name)
  const login = useCallback(async (email, password) => {
    const { token: newToken } = await authService.login(email, password);
    localStorage.setItem('token', newToken);
    setToken(newToken);
    const userData = await authService.getMe();
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
