import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { errorMessage, httpStatus } from '../lib/http';
import { toast } from '../lib/toast';

interface Options<TData, TVars> {
  mutationFn: (vars: TVars) => Promise<TData>;
  /** Prefijos de queries a refrescar al terminar bien */
  invalidate?: QueryKey[];
  /** Mensaje de exito (texto fijo o calculado con la respuesta) */
  success?: string | ((data: TData, vars: TVars) => string);
  onSuccess?: (data: TData, vars: TVars) => void;
  /** Mensaje si el backend no da uno */
  errorFallback?: string;
}

/**
 * useMutation con las convenciones de la app: invalida las queries indicadas y avisa con toasts.
 * Los errores de red, 403 y 5xx ya los avisa el cliente HTTP, asi que aqui no se repiten.
 */
export const useApiMutation = <TData = unknown, TVars = void>({
  mutationFn,
  invalidate = [],
  success,
  onSuccess,
  errorFallback,
}: Options<TData, TVars>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (data, vars) => {
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      if (success) toast.success(typeof success === 'function' ? success(data, vars) : success);
      onSuccess?.(data, vars);
    },
    onError: (error) => {
      const status = httpStatus(error);
      if (status && status !== 403 && status < 500) toast.error(errorMessage(error, errorFallback));
    },
  });
};
