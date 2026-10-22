import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import type { CoursePreviewInput, EmitCertificatesInput, ListCertificatesQuery } from '@certify/shared';
import type { AuthUser } from '../../lib/auth';
import { conflict, forbidden, notFound, orNotFound } from '../../lib/http-error';
import { logger } from '../../lib/logger';
import { prisma, type Prisma } from '../../lib/prisma';
import { toAbsolutePath } from '../../lib/storage';
import { buildCertificateVariables, formatIssueDate, renderTemplate } from '../../rendering/certificate-html';
import { renderPdf, savePdf } from '../../rendering/pdf';
import { generateQr } from '../../rendering/qr';
import { canAccessCourse, coursesVisibleTo, getAccessibleCourse } from '../courses/course-access';
import { courseDependencies } from '../courses/courses.service';

const NOT_FOUND = 'Certificado no encontrado';

// ---------- Consultas ----------

const listInclude = {
  participant: { select: { full_name: true } },
  course: { select: { name: true, type: true, dependency_id: true, dependency: { select: { name: true } } } },
  issuer: { select: { full_name: true } },
} satisfies Prisma.CertificateInclude;

const toListItem = (c: Prisma.CertificateGetPayload<{ include: typeof listInclude }>) => ({
  id: c.id,
  uuid: c.uuid,
  issue_date: c.issue_date,
  status: c.status,
  pdf_path: c.pdf_path,
  revocation_reason: c.revocation_reason,
  revoked_at: c.revoked_at,
  reprint_count: c.reprint_count,
  last_reprinted_at: c.last_reprinted_at,
  created_at: c.created_at,
  participant_id: c.participant_id,
  participant_name: c.participant.full_name,
  course_id: c.course_id,
  course_name: c.course.name,
  course_type: c.course.type,
  dependency_id: c.course.dependency_id,
  dependency_name: c.course.dependency?.name ?? null,
  issued_by_name: c.issuer?.full_name ?? null,
});

export const list = async (query: ListCertificatesQuery, dependencyId: number | null | undefined) => {
  const where: Prisma.CertificateWhereInput = {
    ...(dependencyId && { course: coursesVisibleTo(dependencyId) }),
    ...(query.course_id && { course_id: query.course_id }),
    ...(query.participant_id && { participant_id: query.participant_id }),
    ...(query.status && { status: query.status }),
  };
  const [rows, total] = await prisma.$transaction([
    prisma.certificate.findMany({
      where,
      include: listInclude,
      orderBy: { created_at: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.certificate.count({ where }),
  ]);
  return { data: rows.map(toListItem), total, page: query.page, limit: query.limit };
};

const detailInclude = {
  participant: { select: { full_name: true, email: true } },
  course: { include: { dependency: { select: { name: true } } } },
  issuer: { select: { full_name: true } },
} satisfies Prisma.CertificateInclude;

export type CertificateDetail = Prisma.CertificateGetPayload<{ include: typeof detailInclude }>;

/** Forma plana del detalle (certificado + participante + curso). */
export const toDetail = (c: CertificateDetail) => {
  const { participant, course, issuer, ...cert } = c;
  return {
    ...cert,
    participant_name: participant.full_name,
    participant_email: participant.email,
    course_name: course.name,
    course_type: course.type,
    duration_hours: course.duration_hours,
    instructor: course.instructor,
    start_date: course.start_date,
    end_date: course.end_date,
    dependency_id: course.dependency_id,
    dependency_name: course.dependency?.name ?? null,
    issued_by_name: issuer?.full_name ?? null,
  };
};

export const findDetail = (where: Prisma.CertificateWhereUniqueInput) =>
  prisma.certificate.findUnique({ where, include: detailInclude });

const getAccessible = async (id: number, user: AuthUser, action: string) => {
  const cert = orNotFound(await findDetail({ id }), NOT_FOUND);
  if (!(await canAccessCourse(cert.course_id, user))) throw forbidden(`No tienes permisos para ${action} este certificado`);
  return cert;
};

export const get = async (id: number, user: AuthUser) => toDetail(await getAccessible(id, user, 'ver'));

// ---------- Generacion del PDF ----------
// Todo el diseño sale del curso: HTML, formato, logo, colores, fuente y colaboradoras (decision #11).

/** Fecha de hoy como DATE (medianoche UTC). */
const today = () => new Date(new Date().toISOString().slice(0, 10));

type Course = NonNullable<Awaited<ReturnType<typeof prisma.course.findUnique>>>;

const renderCertificateHtml = async (args: { uuid: string; participantName: string; course: Course; issueDate: Date }) => {
  const { course } = args;
  const deps = await courseDependencies(course.id);
  const variables = buildCertificateVariables({
    participant: { full_name: args.participantName },
    course,
    design: course,
    dependencies: deps.map((d) => ({
      name: d.dependency_name,
      signer_name: d.signer_name,
      logo_path: d.logo_path,
      signature_path: d.signature_path,
      display_order: d.display_order,
    })),
    issueDate: formatIssueDate(args.issueDate),
    uuid: args.uuid,
    qrCodeBase64: await generateQr(args.uuid),
  });
  return renderTemplate(course.certificate_html, variables);
};

const renderCertificatePdf = async (args: Parameters<typeof renderCertificateHtml>[0]) =>
  renderPdf(await renderCertificateHtml(args), args.course);

// ---------- Vista previa del curso ----------

const PREVIEW_UUID = '00000000-0000-4000-8000-000000000000';

/**
 * Certificado del curso con sus datos reales y un participante de ejemplo. Los campos de diseño que
 * lleguen (borrador del editor) reemplazan a los guardados. No guarda nada.
 */
export const coursePreview = async (courseId: number, input: CoursePreviewInput, user: AuthUser) => {
  const saved = await getAccessibleCourse(courseId, user, 'ver');
  const { format, ...draft } = input;
  const course = { ...saved, ...draft };
  const args = { uuid: PREVIEW_UUID, participantName: 'Nombre del Participante', course, issueDate: today() };
  const meta = { orientation: course.orientation, page_size: course.page_size };
  if (format === 'pdf') return { ...meta, format: 'pdf' as const, pdf: await renderCertificatePdf(args) };
  return { ...meta, format: 'html' as const, html: await renderCertificateHtml(args) };
};

// ---------- Emision ----------

export const emit = async (input: EmitCertificatesInput, user: AuthUser) => {
  const course = await getAccessibleCourse(input.course_id, user, 'emitir certificados de');

  const results = {
    emitted: [] as { participant_id: number; certificate_id: number; uuid: string }[],
    already_exists: [] as number[],
    errors: [] as { participant_id: number; reason: string }[],
  };

  for (const participantId of [...new Set(input.participant_ids)]) {
    try {
      const existing = await prisma.certificate.findFirst({
        where: { course_id: course.id, participant_id: participantId, status: 'valid' },
      });
      if (existing) {
        results.already_exists.push(participantId);
        continue;
      }

      const enrollment = await prisma.courseParticipant.findUnique({
        where: { course_id_participant_id: { course_id: course.id, participant_id: participantId } },
        include: { participant: true },
      });
      if (!enrollment) {
        results.errors.push({ participant_id: participantId, reason: 'El participante no esta inscrito en el curso' });
        continue;
      }
      if (enrollment.attendance_status !== 'completed') {
        results.errors.push({ participant_id: participantId, reason: 'El participante no ha completado el curso' });
        continue;
      }

      const uuid = randomUUID();
      const issueDate = today();
      const pdf = await renderCertificatePdf({
        uuid,
        participantName: enrollment.participant.full_name,
        course,
        issueDate,
      });
      const certificate = await prisma.certificate.create({
        data: {
          uuid,
          participant_id: participantId,
          course_id: course.id,
          issued_by: user.userId,
          issue_date: issueDate,
          pdf_path: savePdf(pdf, `certificate_${uuid}.pdf`),
        },
      });
      results.emitted.push({ participant_id: participantId, certificate_id: certificate.id, uuid });
    } catch (err) {
      logger.error({ err, participantId, courseId: course.id }, 'Error al emitir certificado');
      results.errors.push({ participant_id: participantId, reason: (err as Error).message });
    }
  }

  return results;
};

// ---------- Reimpresion ----------

/**
 * Regenera el PDF conservando uuid (mismo QR) y fecha de emision.
 * Usa los datos y el diseño actuales del participante y del curso (decision #11).
 * El PDF anterior se conserva en disco.
 */
export const reprint = async (id: number, user: AuthUser) => {
  const cert = await getAccessible(id, user, 'reimprimir');
  if (cert.status !== 'valid') throw conflict('Solo se pueden reimprimir certificados validos');

  const pdf = await renderCertificatePdf({
    uuid: cert.uuid,
    participantName: cert.participant.full_name,
    course: cert.course,
    issueDate: cert.issue_date,
  });

  const reprintNumber = cert.reprint_count + 1;
  const updated = await prisma.certificate.update({
    where: { id },
    data: {
      pdf_path: savePdf(pdf, `certificate_${cert.uuid}_r${reprintNumber}.pdf`),
      reprint_count: reprintNumber,
      last_reprinted_at: new Date(),
    },
    include: detailInclude,
  });
  return { message: 'Certificado reimpreso', certificate: toDetail(updated) };
};

// ---------- Descarga y revocacion ----------

export const pdfFile = async (id: number, user: AuthUser) => {
  const cert = await getAccessible(id, user, 'descargar');
  if (!cert.pdf_path) throw notFound('El PDF de este certificado no esta disponible');
  const absolutePath = toAbsolutePath(cert.pdf_path);
  if (!fs.existsSync(absolutePath)) throw notFound('Archivo PDF no encontrado en el servidor');
  return { absolutePath, filename: `certificate_${cert.uuid}.pdf` };
};

/** Marca el certificado como revocado y lo registra en revocation_log. El PDF no se borra. */
export const revoke = async (id: number, reason: string, user: AuthUser) => {
  const cert = await getAccessible(id, user, 'revocar');
  if (cert.status !== 'valid') throw conflict('Solo se pueden revocar certificados con status valid');

  const [certificate] = await prisma.$transaction([
    prisma.certificate.update({
      where: { id },
      data: { status: 'revoked', revocation_reason: reason, revoked_at: new Date(), revoked_by: user.userId },
    }),
    prisma.revocationLog.create({ data: { certificate_id: id, revoked_by: user.userId, reason } }),
  ]);
  return { message: 'Certificado revocado', certificate };
};
