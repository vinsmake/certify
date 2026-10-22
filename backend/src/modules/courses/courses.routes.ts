import { Router } from 'express';
import {
  addCourseDependencySchema,
  applyTemplateSchema,
  courseDependencyParamsSchema,
  courseParticipantParamsSchema,
  coursePreviewSchema,
  createCourseSchema,
  enrollParticipantsSchema,
  idParamSchema,
  listCoursesQuerySchema,
  updateAttendanceSchema,
  updateCourseDependencySchema,
  updateCourseDesignSchema,
  updateCourseSchema,
} from '@certify/shared';
import { badRequest } from '../../lib/http-error';
import { sendPdf } from '../../lib/http';
import { imageUpload, STORAGE_DIRS, toPublicPath } from '../../lib/storage';
import { authenticate, currentUser, scopeToDependency } from '../../middlewares/auth';
import { parseBody, parseParams, parseQuery } from '../../middlewares/validate';
import { coursePreview } from '../certificates/certificates.service';
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

// Firmante, orden, logo y firma de la colaboradora en este curso
courseRoutes.put('/:id/dependencies/:depId', async (req, res) => {
  const { id, depId } = parseParams(courseDependencyParamsSchema, req);
  res.json(await courses.updateDependency(id, depId, parseBody(updateCourseDependencySchema, req), currentUser(req)));
});

courseRoutes.post('/:id/dependencies/:depId/logo', imageUpload(STORAGE_DIRS.dependencyLogos, 'logo'), async (req, res) => {
  const { id, depId } = parseParams(courseDependencyParamsSchema, req);
  if (!req.file) throw badRequest('Archivo de logo requerido');
  const path = toPublicPath(STORAGE_DIRS.dependencyLogos, req.file.filename);
  res.json(await courses.setDependencyFile(id, depId, 'logo_path', path, currentUser(req)));
});

courseRoutes.delete('/:id/dependencies/:depId/logo', async (req, res) => {
  const { id, depId } = parseParams(courseDependencyParamsSchema, req);
  res.json(await courses.setDependencyFile(id, depId, 'logo_path', null, currentUser(req)));
});

courseRoutes.post(
  '/:id/dependencies/:depId/signature',
  imageUpload(STORAGE_DIRS.signatures, 'signature'),
  async (req, res) => {
    const { id, depId } = parseParams(courseDependencyParamsSchema, req);
    if (!req.file) throw badRequest('Archivo de firma requerido');
    const path = toPublicPath(STORAGE_DIRS.signatures, req.file.filename);
    res.json(await courses.setDependencyFile(id, depId, 'signature_path', path, currentUser(req)));
  },
);

courseRoutes.delete('/:id/dependencies/:depId/signature', async (req, res) => {
  const { id, depId } = parseParams(courseDependencyParamsSchema, req);
  res.json(await courses.setDependencyFile(id, depId, 'signature_path', null, currentUser(req)));
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

// ---------- Diseno del certificado (todo es por curso) ----------

courseRoutes.put('/:id/design', async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  res.json(await courses.updateDesign(id, parseBody(updateCourseDesignSchema, req), currentUser(req)));
});

// Copia una plantilla base al curso (reemplaza su HTML)
courseRoutes.post('/:id/design/apply-template', async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  const { template_id } = parseBody(applyTemplateSchema, req);
  res.json(await courses.applyTemplate(id, template_id, currentUser(req)));
});

courseRoutes.post('/:id/logo', imageUpload(STORAGE_DIRS.courseLogos, 'logo'), async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  if (!req.file) throw badRequest('Archivo de logo requerido');
  res.json(await courses.setLogo(id, toPublicPath(STORAGE_DIRS.courseLogos, req.file.filename), currentUser(req)));
});

courseRoutes.delete('/:id/logo', async (req, res) => {
  res.json(await courses.setLogo(parseParams(idParamSchema, req).id, null, currentUser(req)));
});

// Vista previa con los datos del curso; los campos de diseño enviados (borrador del editor) se usan
// en lugar de los guardados
courseRoutes.post('/:id/certificate-preview', async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  const preview = await coursePreview(id, parseBody(coursePreviewSchema, req), currentUser(req));
  if (preview.format === 'pdf') {
    sendPdf(res, preview.pdf, `preview_curso_${id}.pdf`, 'inline');
    return;
  }
  const { format: _format, ...body } = preview;
  res.json(body);
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
