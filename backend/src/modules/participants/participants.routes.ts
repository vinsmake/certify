import { Router } from 'express';
import {
  createParticipantSchema,
  idParamSchema,
  listParticipantsQuerySchema,
  updateParticipantSchema,
} from '@certify/shared';
import { authenticate, currentUser, scopeToDependency } from '../../middlewares/auth';
import { parseBody, parseParams, parseQuery } from '../../middlewares/validate';
import * as participants from './participants.service';

export const participantRoutes = Router();

// Ambos roles gestionan participantes; dependencia solo los suyos
participantRoutes.use(authenticate, scopeToDependency);

participantRoutes.get('/', async (req, res) => {
  const query = parseQuery(listParticipantsQuerySchema, req);
  // Admin puede filtrar por dependencia; rol dependencia siempre ve la suya
  const dependencyId = currentUser(req).role === 'admin' ? query.dependency_id : req.dependencyFilter;
  res.json(await participants.list(query, dependencyId));
});

participantRoutes.get('/:id', async (req, res) => {
  res.json(await participants.get(parseParams(idParamSchema, req).id, currentUser(req)));
});

participantRoutes.post('/', async (req, res) => {
  res.status(201).json(await participants.create(parseBody(createParticipantSchema, req), currentUser(req)));
});

participantRoutes.put('/:id', async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  res.json(await participants.update(id, parseBody(updateParticipantSchema, req), currentUser(req)));
});

participantRoutes.delete('/:id', async (req, res) => {
  res.json(await participants.remove(parseParams(idParamSchema, req).id, currentUser(req)));
});

participantRoutes.get('/:id/certificates', async (req, res) => {
  res.json(await participants.certificates(parseParams(idParamSchema, req).id, currentUser(req)));
});
