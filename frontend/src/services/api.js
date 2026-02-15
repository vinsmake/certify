// 18.04 - Instancia de Axios configurada con baseURL, interceptores JWT y manejo de 401

import axios from 'axios';
import { toast } from '../utils/toastManager';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 18.05 - Interceptor de request: agregar token JWT si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 18.06 - Interceptor de response: redirigir a login si recibe 401
// 30.05 - Manejo de errores de red (sin respuesta del backend)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      toast.error('No se pudo conectar con el servidor. Verifica tu conexion.');
    } else if (error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response.status === 403) {
      toast.warning('No tienes permisos para realizar esta accion.');
    } else if (error.response.status >= 500) {
      toast.error('Error interno del servidor. Intenta de nuevo mas tarde.');
    }
    return Promise.reject(error);
  }
);

export default api;
