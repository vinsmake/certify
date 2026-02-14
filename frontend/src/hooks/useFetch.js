// 21.10 - Hook generico para peticiones con estado de loading, data y error

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

/**
 * useFetch(url, options?)
 *
 * Retorna: { data, loading, error, refetch }
 *
 * options:
 *   - params:   query params (objeto)
 *   - method:   'GET' por defecto
 *   - body:     payload para POST/PUT
 *   - skip:     no ejecutar automaticamente si es true
 */
const useFetch = (url, options = {}) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(!options.skip);
  const [error,   setError]   = useState(null);

  // Usamos ref para evitar re-renders al pasar options como objeto literal
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchData = useCallback(async () => {
    if (!url) return;
    const { params, method = 'GET', body, skip } = optionsRef.current;
    if (skip) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.request({
        url,
        method,
        params,
        data: body,
      });
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!options.skip) {
      fetchData();
    }
  }, [fetchData, url]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch: fetchData };
};

export default useFetch;
