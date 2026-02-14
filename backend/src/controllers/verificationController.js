const Certificate = require('../models/Certificate');
const CourseDependency = require('../models/CourseDependency');

// 16.01 - GET /:uuid - verificacion publica de un certificado
const verifyCertificate = async (req, res, next) => {
  try {
    const { uuid } = req.params;

    // 16.05 - Buscar por UUID
    const cert = await Certificate.findByUuid(uuid);
    if (!cert) {
      return res.status(404).json({ error: 'CERTIFICADO NO ENCONTRADO' });
    }

    // 16.07 - Obtener logos de dependencias del curso
    const courseDependencies = await CourseDependency.findByCourse(cert.course_id);

    // 16.03 / 16.04 - Construir respuesta publica segun status
    // 16.06 - Incluir version de branding con la que fue emitido
    const response = {
      status: cert.status === 'valid' ? 'VALIDO' : 'REVOCADO',
      certificate: {
        uuid: cert.uuid,
        issue_date: cert.issue_date,
        ...(cert.status === 'revoked' && {
          revoked_at: cert.revoked_at,
          revocation_reason: cert.revocation_reason,
        }),
        participant: {
          full_name: cert.participant_name,
          document_id: cert.document_id,
          organization: cert.organization || null,
          position: cert.position || null,
        },
        course: {
          name: cert.course_name,
          type: cert.course_type,
          duration_hours: cert.duration_hours,
          instructor: cert.instructor,
          start_date: cert.start_date,
          end_date: cert.end_date,
        },
        branding: {
          version_label: cert.branding_label,
          logo_path: cert.branding_logo_path,
          organization_name: cert.organization_name,
          primary_color: cert.primary_color,
          secondary_color: cert.secondary_color,
          font_family: cert.font_family,
        },
        dependencies: courseDependencies.map((dep) => ({
          name: dep.dependency_name,
          abbreviation: dep.abbreviation,
          logo_path: dep.logo_path,
          display_order: dep.display_order,
        })),
      },
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
};

module.exports = { verifyCertificate };
