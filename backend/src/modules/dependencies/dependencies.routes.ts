import { Router } from 'express';
import {
  createDependencySchema,
  idParamSchema,
  listDependenciesQuerySchema,
  updateDependencySchema,
} from '@certify/shared';
import { authenticate, requireRole } from '../../middlewares/auth';
import { parseBody, parseParams, parseQuery } from '../../middlewares/validate';
import * as dependencies from './dependencies.service';

export const dependencyRoutes = Router();

dependencyRoutes.use(authenticate);

dependencyRoutes.get('/', async (req, res) => {
  const { active_only } = parseQuery(listDependenciesQuerySchema, req);
  res.json(await dependencies.list(active_only === 'true'));
});

dependencyRoutes.get('/:id', async (req, res) => {
  res.json(await dependencies.get(parseParams(idParamSchema, req).id));
});

dependencyRoutes.post('/', requireRole('admin'), async (req, res) => {
  res.status(201).json(await dependencies.create(parseBody(createDependencySchema, req)));
});

dependencyRoutes.put('/:id', requireRole('admin'), async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  res.json(await dependencies.update(id, parseBody(updateDependencySchema, req)));
});

dependencyRoutes.delete('/:id', requireRole('admin'), async (req, res) => {
  res.json(await dependencies.deactivate(parseParams(idParamSchema, req).id));
});
