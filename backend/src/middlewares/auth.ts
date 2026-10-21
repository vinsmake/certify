import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Role } from '@certify/shared';
import { verifyToken, type AuthUser } from '../lib/auth';
import { forbidden, unauthorized } from '../lib/http-error';

/** Exige un JWT valido en `Authorization: Bearer <token>`. */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw unauthorized('Token de autenticacion requerido');
  try {
    req.user = verifyToken(header.slice(7));
  } catch {
    throw unauthorized('Token invalido o expirado');
  }
  next();
};

/** Restringe la ruta a ciertos roles. */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) throw unauthorized();
    if (!roles.includes(req.user.role)) throw forbidden();
    next();
  };

/** Admin ve todo (filtro null); rol dependencia solo ve su dependencia. */
export const scopeToDependency = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) throw unauthorized();
  if (req.user.role === 'admin') {
    req.dependencyFilter = null;
  } else {
    if (!req.user.dependency_id) throw forbidden('Usuario sin dependencia asignada');
    req.dependencyFilter = req.user.dependency_id;
  }
  next();
};

/** Usuario autenticado (para handlers detras de `authenticate`). */
export const currentUser = (req: Request): AuthUser => {
  if (!req.user) throw unauthorized();
  return req.user;
};
