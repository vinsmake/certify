import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { HttpError } from '../lib/http-error';
import { logger } from '../lib/logger';
import { Prisma } from '../lib/prisma';

// Formato de error de la API: { error: string, details?: [...] }
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Datos de entrada invalidos',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, ...(err.details !== undefined && { details: err.details }) });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'El archivo excede el tamano maximo (5MB)' : err.message;
    res.status(400).json({ error: message });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe un registro con esos datos' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }
    if (err.code === 'P2003') {
      res.status(409).json({ error: 'El registro esta en uso por otros datos y no se puede modificar o eliminar' });
      return;
    }
  }

  // JSON mal formado en el body
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'JSON invalido' });
    return;
  }

  logger.error({ err, method: req.method, url: req.originalUrl }, 'Error no controlado');
  res.status(500).json({
    error: 'Error interno del servidor',
    ...(env.isDev && { message: (err as Error).message, stack: (err as Error).stack }),
  });
};
