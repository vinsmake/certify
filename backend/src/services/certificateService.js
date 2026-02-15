const { v4: uuidv4 } = require('uuid');
const Certificate = require('../models/Certificate');
const RevocationLog = require('../models/RevocationLog');
const BrandingVersion = require('../models/BrandingVersion');
const CourseDependency = require('../models/CourseDependency');
const CourseParticipant = require('../models/CourseParticipant');
const Participant = require('../models/Participant');
const { generateQR } = require('./qrService');
const { buildCertificateHtml } = require('./templateService');
const { generateAndSavePDF } = require('./pdfService');

/**
 * 14.02 - Emite un certificado para un participante de un curso.
 * Flujo completo: UUID → branding → dependencias → QR → HTML → PDF → BD
 */
const emitCertificate = async ({ courseId, participantId, templateId, issuedBy, course, participant }) => {
  // 1. Obtener branding activo al momento de emision
  const brandingVersion = await BrandingVersion.findActive();
  if (!brandingVersion) {
    throw new Error('No hay version de branding activa');
  }
  if (!brandingVersion.logo_path) {
    throw new Error('La version de branding activa no tiene logo. Sube un logo desde Configuracion antes de emitir.');
  }

  // 2. Obtener dependencias del curso (para logos en el certificado)
  const courseDependencies = await CourseDependency.findByCourse(courseId);

  // 3. Generar UUID del certificado
  const uuid = uuidv4();

  // 4. Generar QR
  const qrCodeBase64 = await generateQR(uuid);

  // 5. Construir HTML con plantilla y variables
  const issueDate = new Date().toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const { html, template } = await buildCertificateHtml(templateId, {
    participant,
    course,
    brandingVersion,
    courseDependencies,
    issueDate,
    uuid,
    qrCodeBase64,
  });

  // 6. Generar y guardar PDF
  const { pdfPath } = await generateAndSavePDF(html, uuid, {
    orientation: template.orientation,
    page_size:   template.page_size,
  });

  // 7. Guardar certificado en BD
  const certificate = await Certificate.create({
    uuid,
    participant_id:      participantId,
    course_id:           courseId,
    issued_by:           issuedBy,
    issue_date:          new Date().toISOString().split('T')[0],
    branding_version_id: brandingVersion.id,
    template_id:         templateId,
    pdf_path:            pdfPath,
  });

  return certificate;
};

/**
 * 14.03 - Emite certificados para multiples participantes de un curso.
 * Devuelve resultados por participante: emitido, ya_existe, error.
 */
const emitBulkCertificates = async ({ courseId, participantIds, templateId, issuedBy, course }) => {
  const results = { emitted: [], already_exists: [], errors: [] };

  for (const participantId of participantIds) {
    try {
      // 14.09 - Verificar que no exista ya un certificado valido
      const existing = await Certificate.findValidByCourseAndParticipant(courseId, participantId);
      if (existing) {
        results.already_exists.push(participantId);
        continue;
      }

      // 14.08 - Verificar attendance_status = 'completed'
      const enrollment = await CourseParticipant.findEnrollment(courseId, participantId);
      if (!enrollment || enrollment.attendance_status !== 'completed') {
        results.errors.push({
          participant_id: participantId,
          reason: 'El participante no tiene attendance_status = completed',
        });
        continue;
      }

      // Obtener datos del participante
      const participant = await Participant.findById(participantId);
      if (!participant) {
        results.errors.push({ participant_id: participantId, reason: 'Participante no encontrado' });
        continue;
      }

      const certificate = await emitCertificate({
        courseId,
        participantId,
        templateId,
        issuedBy,
        course,
        participant,
      });

      results.emitted.push({ participant_id: participantId, certificate_id: certificate.id, uuid: certificate.uuid });
    } catch (err) {
      results.errors.push({ participant_id: participantId, reason: err.message });
    }
  }

  return results;
};

/**
 * 15.02 - Revoca un certificado y registra el evento en el log de revocaciones.
 * El PDF nunca se elimina (inmutabilidad).
 *
 * @param {number} certificateId
 * @param {Object} opts - { revokedBy, reason }
 * @returns {Promise<Object>} certificado actualizado
 */
const revokeCertificate = async (certificateId, { revokedBy, reason }) => {
  // Actualizar status en la tabla certificates
  const revoked = await Certificate.revoke(certificateId, {
    revoked_by: revokedBy,
    revocation_reason: reason,
  });

  if (!revoked) return null;

  // Registrar en el log de revocaciones
  await RevocationLog.create({
    certificate_id: certificateId,
    revoked_by: revokedBy,
    reason,
  });

  return revoked;
};

module.exports = { emitCertificate, emitBulkCertificates, revokeCertificate };
