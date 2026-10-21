import { Router } from 'express';
import { createUserSchema, idParamSchema, updateUserSchema } from '@certify/shared';
import { authenticate, requireRole, scopeToDependency } from '../../middlewares/auth';
import { parseBody, parseParams } from '../../middlewares/validate';
import * as users from './users.service';

export const userRoutes = Router();

userRoutes.use(authenticate, requireRole('admin'));

userRoutes.get('/', scopeToDependency, async (req, res) => {
  res.json(await users.list(req.dependencyFilter ?? null));
});

userRoutes.post('/', async (req, res) => {
  res.status(201).json(await users.create(parseBody(createUserSchema, req)));
});

userRoutes.put('/:id', async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  res.json(await users.update(id, parseBody(updateUserSchema, req)));
});

userRoutes.delete('/:id', async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  res.json(await users.deactivate(id));
});
