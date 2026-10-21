import { Router } from 'express';
import { adminActivityQuerySchema, adminCertificatesQuerySchema, adminEventsQuerySchema } from '@certify/shared';
import { authenticate, requireRole } from '../../middlewares/auth';
import { parseQuery } from '../../middlewares/validate';
import * as admin from './admin.service';

export const adminRoutes = Router();

adminRoutes.use(authenticate, requireRole('admin'));

adminRoutes.get('/events', async (req, res) => {
  res.json(await admin.events(parseQuery(adminEventsQuerySchema, req)));
});

adminRoutes.get('/certificates', async (req, res) => {
  res.json(await admin.certificates(parseQuery(adminCertificatesQuerySchema, req)));
});

adminRoutes.get('/activity', async (req, res) => {
  res.json(await admin.activity(parseQuery(adminActivityQuerySchema, req).limit));
});
