import { Router } from 'express';
import { uuidParamSchema } from '@certify/shared';
import { notFound } from '../../lib/http-error';
import { parseParams } from '../../middlewares/validate';
import { findDetail } from '../certificates/certificates.service';
import { courseDependencies } from '../courses/courses.service';

export const verificationRoutes = Router();

// Publica (sin autenticacion): la abre quien escanea el QR del certificado
verificationRoutes.get('/:uuid', async (req, res) => {
  const { uuid } = parseParams(uuidParamSchema, req);
  const cert = await findDetail({ uuid });
  if (!cert) throw notFound('CERTIFICADO NO ENCONTRADO');

  const deps = await courseDependencies(cert.course_id);

  res.json({
    status: cert.status === 'valid' ? 'VALIDO' : 'REVOCADO',
    certificate: {
      uuid: cert.uuid,
      issue_date: cert.issue_date,
      ...(cert.status === 'revoked' && {
        revoked_at: cert.revoked_at,
        revocation_reason: cert.revocation_reason,
      }),
      participant: { full_name: cert.participant.full_name, organization: null, position: null },
      course: {
        name: cert.course.name,
        type: cert.course.type,
        duration_hours: cert.course.duration_hours,
        instructor: cert.course.instructor,
        start_date: cert.course.start_date,
        end_date: cert.course.end_date,
      },
      // Organizacion emisora segun el diseño del curso
      organization: { name: cert.course.organization_name, logo_path: cert.course.logo_path },
      dependencies: deps.map((d) => ({
        name: d.dependency_name,
        abbreviation: d.abbreviation,
        logo_path: d.logo_path,
        display_order: d.display_order,
      })),
    },
  });
});
