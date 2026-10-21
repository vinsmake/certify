import { Router } from 'express';
import { createTemplateSchema, idParamSchema, updateTemplateSchema } from '@certify/shared';
import { authenticate, currentUser, requireRole } from '../../middlewares/auth';
import { parseBody, parseParams } from '../../middlewares/validate';
import { sendPdf } from '../../lib/http';
import * as templates from './templates.service';

export const templateRoutes = Router();

templateRoutes.use(authenticate);

templateRoutes.get('/', async (_req, res) => {
  res.json(await templates.list());
});

// QR de ejemplo para el preview en tiempo real del editor
templateRoutes.get('/sample-qr', async (_req, res) => {
  res.json(await templates.sampleQr());
});

templateRoutes.get('/:id', async (req, res) => {
  res.json(await templates.findOrFail(parseParams(idParamSchema, req).id));
});

templateRoutes.post('/', requireRole('admin'), async (req, res) => {
  res.status(201).json(await templates.create(parseBody(createTemplateSchema, req), currentUser(req).userId));
});

templateRoutes.put('/:id', requireRole('admin'), async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  res.json(await templates.update(id, parseBody(updateTemplateSchema, req)));
});

templateRoutes.delete('/:id', requireRole('admin'), async (req, res) => {
  res.json(await templates.deactivate(parseParams(idParamSchema, req).id));
});

templateRoutes.post('/:id/preview', async (req, res) => {
  const { pdf, filename } = await templates.previewPdf(parseParams(idParamSchema, req).id);
  sendPdf(res, pdf, filename, 'inline');
});

templateRoutes.put('/:id/default', requireRole('admin'), async (req, res) => {
  res.json(await templates.setDefault(parseParams(idParamSchema, req).id));
});
