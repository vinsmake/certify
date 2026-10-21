// Hooks de consulta reutilizados en varias pantallas (catalogos y listas auxiliares).
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { courseApi, dependencyApi, tagApi, templateApi } from './index';
import { keys } from './keys';

export const useDependencies = (activeOnly = false, enabled = true) =>
  useQuery({ queryKey: keys.dependencies.list(activeOnly), queryFn: () => dependencyApi.list(activeOnly), enabled });

export const useTags = () => useQuery({ queryKey: keys.tags.all, queryFn: tagApi.list });

export const useTemplates = () => useQuery({ queryKey: keys.templates.all, queryFn: templateApi.list });

/** Cursos para selectores y filtros (hasta 500). */
export const useCourseOptions = () =>
  useQuery({
    queryKey: keys.courses.list({ options: true }),
    queryFn: () => courseApi.list({ limit: 500 }),
    select: (res) => res.data.map((c) => ({ value: String(c.id), label: c.name })),
  });

/** Opciones por defecto para listas paginadas: mantiene la pagina anterior mientras carga la nueva. */
export const paginatedOptions = { placeholderData: keepPreviousData } as const;
