// Cliente HTTP de la API. Usa rutas relativas: en desarrollo Vite reenvia /api al backend
// y en produccion lo hace nginx.
import axios, { isAxiosError } from 'axios';
import type { ApiErrorBody } from '@certify/shared';
import { toast } from './toast';

export const TOKEN_KEY = 'token';

export const http = axios.create({ baseURL: '/api' });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const isLogin = error.config?.url === '/auth/login';
      if (!error.response) {
        toast.error('No se pudo conectar con el servidor. Verifica tu conexion.');
      } else if (status === 401 && !isLogin) {
        // Sesion expirada o token invalido
        localStorage.removeItem(TOKEN_KEY);
        if (window.location.pathname !== '/login') window.location.href = '/login';
      } else if (status === 403) {
        toast.warning('No tienes permisos para realizar esta accion.');
      } else if (status && status >= 500) {
        toast.error('Error interno del servidor. Intenta de nuevo mas tarde.');
      }
    }
    return Promise.reject(error);
  },
);

/** Mensaje legible de un error de la API (incluye el detalle de validacion si lo hay). */
export const errorMessage = (error: unknown, fallback = 'Ocurrio un error inesperado.') => {
  if (isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    if (body?.details?.length) return body.details.map((d) => d.message).join('. ');
    if (body?.error) return body.error;
  }
  return fallback;
};

export const httpStatus = (error: unknown) => (isAxiosError(error) ? error.response?.status : undefined);
