// Error con status HTTP: el errorHandler lo convierte en { error: message }.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string, details?: unknown) => new HttpError(400, message, details);
export const unauthorized = (message = 'No autenticado') => new HttpError(401, message);
export const forbidden = (message = 'No tienes permisos para realizar esta accion') => new HttpError(403, message);
export const notFound = (message: string) => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);

/** Devuelve el valor o lanza 404 si es null/undefined. */
export const orNotFound = <T>(value: T | null | undefined, message: string): T => {
  if (value === null || value === undefined) throw notFound(message);
  return value;
};
