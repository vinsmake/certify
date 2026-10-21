// Variables de entorno validadas al arrancar: si falta algo obligatorio, el proceso
// falla de inmediato con un mensaje claro en vez de fallar a mitad de una peticion.
import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRATION: z.string().default('8h'),

  // Origen del frontend (CORS)
  FRONTEND_URL: z.url().default('http://localhost:5173'),
  // Base de la URL que se incrusta en el QR: VERIFICATION_BASE_URL/<uuid>
  VERIFICATION_BASE_URL: z.url().default('http://localhost:5173/verificar'),

  // Carpeta raiz de archivos subidos y PDFs generados
  STORAGE_ROOT: z.string().default('/app/storage'),
  PUPPETEER_EXECUTABLE_PATH: z.string().default('/usr/bin/chromium-browser'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Variables de entorno invalidas:\n' + z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isDev: parsed.data.NODE_ENV === 'development',
  isTest: parsed.data.NODE_ENV === 'test',
  // Raiz del paquete backend (assets, prisma). npm ejecuta los scripts desde aqui.
  BACKEND_ROOT: process.cwd(),
  ASSETS_DIR: path.join(process.cwd(), 'assets'),
};
