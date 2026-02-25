const fs = require('fs');
const path = require('path');
const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const CourseDependency = require('../models/CourseDependency');
const { emitBulkCertificates, revokeCertificate } = require('../services/certificateService');

const STORAGE_ROOT = '/app/storage';

// 14.04 - GET / - listar certificados (admin: todos, emisor: de su dependencia)
const listCertificates = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Filtros opcionales por query
    const course_id      = req.query.course_id      ? parseInt(req.query.course_id)      : undefined;
    const participant_id = req.query.participant_id  ? parseInt(req.query.participant_id)  : undefined;
    const status         = req.query.status          || undefined;

    // 14.12 - dependencyFilter viene del dependencyMiddleware (admin = undefined, emisor = su dep)
    const dependency_id = req.dependencyFilter;

    const result = await Certificate.findAll({ page, limit, course_id, participant_id, status, dependency_id });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// 14.05 - GET /:id - detalle de un certificado
const getCertificate = async (req, res, next) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }

    // Emisor solo puede ver certificados de su dependencia
    if (req.user.role === 'dependencia' && cert.dependency_id !== req.user.dependency_id) {
      return res.status(403).json({ error: 'No tienes permisos para ver este certificado' });
    }

    res.json(cert);
  } catch (err) {
    next(err);
  }
};

// 14.06 - POST /emit - emitir certificados
const emitCertificates = async (req, res, next) => {
  try {
    const { course_id, participant_ids, template_id } = req.body;

    // 14.10 - Verificar que el curso existe y el emisor tiene acceso
    const course = await Course.findById(course_id);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    if (req.user.role === 'dependencia') {
      const hasAccess = await CourseDependency.hasAccess(course.id, req.user.dependency_id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'No tienes permisos para emitir certificados de este curso' });
      }
    }

    const results = await emitBulkCertificates({
      courseId:       course_id,
      participantIds: participant_ids,
      templateId:     template_id,
      issuedBy:       req.user.userId,
      course,
    });

    const statusCode = results.emitted.length > 0 ? 201 : 200;
    res.status(statusCode).json(results);
  } catch (err) {
    next(err);
  }
};

// 14.07 - GET /:id/download - descargar el PDF del certificado
const downloadCertificate = async (req, res, next) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }

    if (req.user.role === 'dependencia' && cert.dependency_id !== req.user.dependency_id) {
      return res.status(403).json({ error: 'No tienes permisos para descargar este certificado' });
    }

    if (!cert.pdf_path) {
      return res.status(404).json({ error: 'El PDF de este certificado no esta disponible' });
    }

    const absolutePath = path.join(STORAGE_ROOT, cert.pdf_path.replace('/storage/', ''));

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'Archivo PDF no encontrado en el servidor' });
    }

    const filename = `certificate_${cert.uuid}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(absolutePath).pipe(res);
  } catch (err) {
    next(err);
  }
};

// 15.03 - POST /:id/revoke - revocar un certificado
const revokeCertificateHandler = async (req, res, next) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }

    // 15.05 - Solo se pueden revocar certificados con status 'valid'
    if (cert.status !== 'valid') {
      return res.status(409).json({ error: 'Solo se pueden revocar certificados con status valid' });
    }

    // 15.07 - Solo admin o emisor de la misma dependencia
    if (req.user.role === 'dependencia' && cert.dependency_id !== req.user.dependency_id) {
      return res.status(403).json({ error: 'No tienes permisos para revocar este certificado' });
    }

    const { reason } = req.body;
    const revoked = await revokeCertificate(cert.id, {
      revokedBy: req.user.userId,
      reason,
    });

    res.json({ message: 'Certificado revocado', certificate: revoked });
  } catch (err) {
    next(err);
  }
};

module.exports = { listCertificates, getCertificate, emitCertificates, downloadCertificate, revokeCertificateHandler };
