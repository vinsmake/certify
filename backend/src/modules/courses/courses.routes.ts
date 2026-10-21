import { Router } from 'express';
import {
  addCourseDependencySchema,
  courseDependencyParamsSchema,
  courseParticipantParamsSchema,
  createCourseSchema,
  enrollParticipantsSchema,
  idParamSchema,
  listCoursesQuerySchema,
  updateAttendanceSchema,
  updateCourseSchema,
} from '@certify/shared';
import { badRequest } from '../../lib/http-error';
import { imageUpload, STORAGE_DIRS, toPublicPath } from '../../lib/storage';
import { authenticate, currentUser, scopeToDependency } from '../../middlewares/auth';
import { parseBody, parseParams, parseQuery } from '../../middlewares/validate';
import * as courses from './courses.service';

export const courseRoutes = Router();

courseRoutes.use(authenticate);

courseRoutes.get('/', scopeToDependency, async (req, res) => {
  res.json(await courses.list(parseQuery(listCoursesQuerySchema, req), req.dependencyFilter));
});

courseRoutes.get('/:id', async (req, res) => {
  res.json(await courses.get(parseParams(idParamSchema, req).id, currentUser(req)));
});

courseRoutes.post('/', async (req, res) => {
  res.status(201).json(await courses.create(parseBody(createCourseSchema, req), currentUser(req)));
});

courseRoutes.put('/:id', async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  res.json(await courses.update(id, parseBody(updateCourseSchema, req), currentUser(req)));
});

courseRoutes.delete('/:id', async (req, res) => {
  res.json(await courses.remove(parseParams(idParamSchema, req).id, currentUser(req)));
});

// ---------- Dependencias colaboradoras ----------

courseRoutes.post('/:id/dependencies', async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  const { dependency_id, display_order } = parseBody(addCourseDependencySchema, req);
  res.status(201).json(await courses.addDependency(id, dependency_id, display_order, currentUser(req)));
});

courseRoutes.delete('/:id/dependencies/:depId', async (req, res) => {
  const { id, depId } = parseParams(courseDependencyParamsSchema, req);
  res.json(await courses.removeDependency(id, depId, currentUser(req)));
});

// ---------- Inscripciones ----------

courseRoutes.get('/:id/participants', async (req, res) => {
  res.json(await courses.participants(parseParams(idParamSchema, req).id, currentUser(req)));
});

courseRoutes.post('/:id/participants', async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  const { participant_ids } = parseBody(enrollParticipantsSchema, req);
  res.status(201).json(await courses.enroll(id, participant_ids, currentUser(req)));
});

courseRoutes.put('/:id/participants/:participantId', async (req, res) => {
  const { id, participantId } = parseParams(courseParticipantParamsSchema, req);
  const { attendance_status } = parseBody(updateAttendanceSchema, req);
  res.json(await courses.updateAttendance(id, participantId, attendance_status, currentUser(req)));
});

courseRoutes.delete('/:id/participants/:participantId', async (req, res) => {
  const { id, participantId } = parseParams(courseParticipantParamsSchema, req);
  res.json(await courses.unenroll(id, participantId, currentUser(req)));
});

// ---------- Firma del instructor ----------

courseRoutes.post('/:id/signature', imageUpload(STORAGE_DIRS.signatures, 'signature'), async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  if (!req.file) throw badRequest('Archivo de firma requerido');
  res.json(await courses.setSignature(id, toPublicPath(STORAGE_DIRS.signatures, req.file.filename), currentUser(req)));
});

courseRoutes.delete('/:id/signature', async (req, res) => {
  res.json(await courses.setSignature(parseParams(idParamSchema, req).id, null, currentUser(req)));
});
