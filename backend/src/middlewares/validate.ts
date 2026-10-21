// Validacion tipada con Zod dentro de los handlers:
//   const body = parseBody(createCourseSchema, req);
// Si falla, lanza ZodError y el errorHandler responde 400 con el detalle por campo.
import type { Request } from 'express';
import type { z } from 'zod';

export const parseBody = <T extends z.ZodType>(schema: T, req: Request): z.infer<T> => schema.parse(req.body ?? {});
export const parseQuery = <T extends z.ZodType>(schema: T, req: Request): z.infer<T> => schema.parse(req.query);
export const parseParams = <T extends z.ZodType>(schema: T, req: Request): z.infer<T> => schema.parse(req.params);
