import { Router } from 'express';
import { createBrandingSchema, idParamSchema, updateBrandingSchema } from '@certify/shared';
import { badRequest } from '../../lib/http-error';
import { imageUpload, STORAGE_DIRS, toPublicPath } from '../../lib/storage';
import { authenticate, currentUser, requireRole } from '../../middlewares/auth';
import { parseBody, parseParams } from '../../middlewares/validate';
import * as branding from './branding.service';

export const brandingRoutes = Router();

// Publico: lo usan el login y la pagina de verificacion
brandingRoutes.get('/active', async (_req, res) => {
  res.json(await branding.getActive());
});

brandingRoutes.use(authenticate, requireRole('admin'));

brandingRoutes.get('/versions', async (_req, res) => {
  res.json(await branding.list());
});

brandingRoutes.post('/versions', async (req, res) => {
  res.status(201).json(await branding.create(parseBody(createBrandingSchema, req), currentUser(req).userId));
});

brandingRoutes.put('/versions/:id/activate', async (req, res) => {
  res.json(await branding.activate(parseParams(idParamSchema, req).id));
});

brandingRoutes.put('/versions/:id', async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  res.json(await branding.update(id, parseBody(updateBrandingSchema, req)));
});

brandingRoutes.delete('/versions/:id', async (req, res) => {
  res.json(await branding.remove(parseParams(idParamSchema, req).id));
});

brandingRoutes.post('/versions/:id/logo', imageUpload(STORAGE_DIRS.brandingLogos, 'logo'), async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  if (!req.file) throw badRequest('Archivo de logo requerido');
  res.json(await branding.setLogo(id, toPublicPath(STORAGE_DIRS.brandingLogos, req.file.filename)));
});
