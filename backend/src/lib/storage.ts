// Archivos en disco: rutas publicas (/storage/...) <-> rutas absolutas, lectura como
// data URL para incrustar en el HTML del PDF, y subidas con multer.
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env';
import { badRequest } from './http-error';

export const STORAGE_DIRS = {
  certificates: 'certificates',
  brandingLogos: 'logos/branding',
  dependencyLogos: 'logos/dependencies',
  tagLogos: 'logos/tags',
  signatures: 'signatures',
} as const;
export type StorageDir = (typeof STORAGE_DIRS)[keyof typeof STORAGE_DIRS];

const MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};
const IMAGE_EXTENSIONS = Object.keys(MIME_TYPES).map((ext) => `.${ext}`);

export const absoluteDir = (dir: StorageDir) => path.join(env.STORAGE_ROOT, dir);

/** '/storage/logos/x.png' -> '<STORAGE_ROOT>/logos/x.png' */
export const toAbsolutePath = (publicPath: string) =>
  path.join(env.STORAGE_ROOT, publicPath.replace(/^\/storage\//, ''));

export const toPublicPath = (dir: StorageDir, filename: string) => `/storage/${dir}/${filename}`;

export const ensureStorageDirs = () => {
  for (const dir of Object.values(STORAGE_DIRS)) fs.mkdirSync(absoluteDir(dir), { recursive: true });
};

/** Lee un archivo como data URL; devuelve '' si no existe. */
export const readAsDataUrl = (absolutePath: string): string => {
  if (!fs.existsSync(absolutePath)) return '';
  const ext = path.extname(absolutePath).slice(1).toLowerCase();
  const mime = MIME_TYPES[ext] ?? 'application/octet-stream';
  return `data:${mime};base64,${fs.readFileSync(absolutePath).toString('base64')}`;
};

/** Igual que readAsDataUrl pero partiendo de una ruta publica opcional. */
export const publicFileAsDataUrl = (publicPath: string | null | undefined) =>
  publicPath ? readAsDataUrl(toAbsolutePath(publicPath)) : '';

/** Middleware multer para una imagen (max 5MB) guardada con nombre aleatorio en `dir`. */
export const imageUpload = (dir: StorageDir, field: string) =>
  multer({
    storage: multer.diskStorage({
      destination: absoluteDir(dir),
      filename: (_req, file, cb) => cb(null, randomUUID() + path.extname(file.originalname).toLowerCase()),
    }),
    fileFilter: (_req, file, cb) => {
      if (IMAGE_EXTENSIONS.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
      else cb(badRequest('Formato de imagen no permitido'));
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }).single(field);
