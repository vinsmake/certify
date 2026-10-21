import { Router } from 'express';
import {
  emitCertificatesSchema,
  idParamSchema,
  listCertificatesQuerySchema,
  revokeCertificateSchema,
} from '@certify/shared';
import { authenticate, currentUser, scopeToDependency } from '../../middlewares/auth';
import { parseBody, parseParams, parseQuery } from '../../middlewares/validate';
import * as certificates from './certificates.service';

export const certificateRoutes = Router();

certificateRoutes.use(authenticate);

certificateRoutes.get('/', scopeToDependency, async (req, res) => {
  res.json(await certificates.list(parseQuery(listCertificatesQuerySchema, req), req.dependencyFilter));
});

certificateRoutes.get('/:id', async (req, res) => {
  res.json(await certificates.get(parseParams(idParamSchema, req).id, currentUser(req)));
});

certificateRoutes.post('/emit', async (req, res) => {
  const results = await certificates.emit(parseBody(emitCertificatesSchema, req), currentUser(req));
  res.status(results.emitted.length > 0 ? 201 : 200).json(results);
});

certificateRoutes.get('/:id/download', async (req, res) => {
  const { absolutePath, filename } = await certificates.pdfFile(parseParams(idParamSchema, req).id, currentUser(req));
  res.download(absolutePath, filename);
});

certificateRoutes.post('/:id/reprint', async (req, res) => {
  res.json(await certificates.reprint(parseParams(idParamSchema, req).id, currentUser(req)));
});

certificateRoutes.post('/:id/revoke', async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  const { reason } = parseBody(revokeCertificateSchema, req);
  res.json(await certificates.revoke(id, reason, currentUser(req)));
});
