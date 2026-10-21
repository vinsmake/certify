import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { ensureStorageDirs } from './lib/storage';
import { closeBrowser } from './rendering/pdf';

ensureStorageDirs();

const server = createApp().listen(env.PORT, () => {
  logger.info(`Servidor corriendo en puerto ${env.PORT} (${env.NODE_ENV})`);
});

const shutdown = async (signal: string) => {
  logger.info(`${signal} recibido, cerrando...`);
  server.close();
  await Promise.allSettled([closeBrowser(), prisma.$disconnect()]);
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
