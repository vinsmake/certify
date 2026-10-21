// Validacion de formularios con los mismos esquemas Zod que usa el backend.
import type { z } from 'zod';

export type FieldErrors = Partial<Record<string, string>>;

/** Valida con un esquema compartido; devuelve los datos o un mapa campo -> primer mensaje. */
export const validate = <S extends z.ZodType>(
  schema: S,
  data: unknown,
): { ok: true; data: z.output<S> } | { ok: false; errors: FieldErrors } => {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? '_');
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
};

/** '' -> null; util para campos opcionales de texto. */
export const nullIfEmpty = (value: string) => (value.trim() === '' ? null : value.trim());
