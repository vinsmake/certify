import type { AuthUser } from '../lib/auth';

declare global {
  namespace Express {
    interface Request {
      /** Usuario autenticado (lo asigna `authenticate`). */
      user?: AuthUser;
      /**
       * Filtro por dependencia (lo asigna `scopeToDependency`):
       * null = admin (ve todo), numero = solo esa dependencia.
       */
      dependencyFilter?: number | null;
    }
  }
}

export {};
