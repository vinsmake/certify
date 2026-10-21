import { useEffect, useState } from 'react';

/** Devuelve el valor solo despues de que deje de cambiar durante `delay` ms. */
export const useDebounced = <T>(value: T, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};
