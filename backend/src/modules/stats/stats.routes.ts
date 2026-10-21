import { Router } from 'express';
import { idParamSchema } from '@certify/shared';
import { authenticate, currentUser, requireRole } from '../../middlewares/auth';
import { parseParams } from '../../middlewares/validate';
import * as stats from './stats.service';

export const statsRoutes = Router();

statsRoutes.use(authenticate);

statsRoutes.get('/', requireRole('admin'), async (_req, res) => {
  res.json(await stats.globalStats());
});

// Admin sin dependencia recibe las globales
statsRoutes.get('/me', async (req, res) => {
  const user = currentUser(req);
  if (user.role === 'admin' && !user.dependency_id) {
    res.json(await stats.globalStats());
    return;
  }
  res.json(await stats.myStats(user.dependency_id as number));
});

statsRoutes.get('/dependency/:id', requireRole('admin'), async (req, res) => {
  res.json(await stats.dependencyStats(parseParams(idParamSchema, req).id));
});
