import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { absoluteDir, STORAGE_DIRS } from './lib/storage';
import { errorHandler } from './middlewares/error-handler';
import { adminRoutes } from './modules/admin/admin.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { brandingRoutes } from './modules/branding/branding.routes';
import { certificateRoutes } from './modules/certificates/certificates.routes';
import { courseRoutes } from './modules/courses/courses.routes';
import { dependencyRoutes } from './modules/dependencies/dependencies.routes';
import { participantRoutes } from './modules/participants/participants.routes';
import { statsRoutes } from './modules/stats/stats.routes';
import { tagRoutes } from './modules/tags/tags.routes';
import { templateRoutes } from './modules/templates/templates.routes';
import { userRoutes } from './modules/users/users.routes';
import { verificationRoutes } from './modules/verification/verification.routes';

export const createApp = () => {
  const app = express();
  app.set('trust proxy', 1);

  // CORS solo para el origen del frontend (antes de todo, cubre tambien los estaticos)
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

  // Logos y firmas son publicos y se sirven ANTES de helmet para evitar el bloqueo CORP.
  // Los PDFs NO se sirven aqui: solo por el endpoint autenticado de descarga.
  app.use('/storage/logos', express.static(path.join(env.STORAGE_ROOT, 'logos')));
  app.use('/storage/signatures', express.static(absoluteDir(STORAGE_DIRS.signatures)));
  app.use('/assets', express.static(env.ASSETS_DIR));

  app.use(helmet());
  app.use(express.json({ limit: '5mb' }));
  if (!env.isTest) app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/dependencies', dependencyRoutes);
  app.use('/api/templates', templateRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/participants', participantRoutes);
  app.use('/api/branding', brandingRoutes);
  app.use('/api/certificates', certificateRoutes);
  app.use('/api/verify', verificationRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/tags', tagRoutes);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  app.use(errorHandler);
  return app;
};
