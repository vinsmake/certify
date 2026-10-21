import { Router } from 'express';
import { createTagSchema, idParamSchema, updateTagSchema } from '@certify/shared';
import { badRequest } from '../../lib/http-error';
import { imageUpload, STORAGE_DIRS, toPublicPath } from '../../lib/storage';
import { authenticate, requireRole } from '../../middlewares/auth';
import { parseBody, parseParams } from '../../middlewares/validate';
import * as tags from './tags.service';

export const tagRoutes = Router();

tagRoutes.use(authenticate);

tagRoutes.get('/', async (_req, res) => {
  res.json(await tags.list());
});

tagRoutes.get('/:id', async (req, res) => {
  res.json(await tags.get(parseParams(idParamSchema, req).id));
});

tagRoutes.post('/', requireRole('admin'), async (req, res) => {
  res.status(201).json(await tags.create(parseBody(createTagSchema, req)));
});

tagRoutes.put('/:id', requireRole('admin'), async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  res.json(await tags.update(id, parseBody(updateTagSchema, req)));
});

tagRoutes.delete('/:id', requireRole('admin'), async (req, res) => {
  res.json(await tags.remove(parseParams(idParamSchema, req).id));
});

tagRoutes.post('/:id/logo', requireRole('admin'), imageUpload(STORAGE_DIRS.tagLogos, 'logo'), async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  if (!req.file) throw badRequest('Archivo de logo requerido');
  res.json(await tags.setLogo(id, toPublicPath(STORAGE_DIRS.tagLogos, req.file.filename)));
});
