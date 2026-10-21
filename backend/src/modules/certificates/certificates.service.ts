import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import type { CoursePreviewInput, EmitCertificatesInput, ListCertificatesQuery } from '@certify/shared';
import type { AuthUser } from '../../lib/auth';
import { badRequest, conflict, forbidden, notFound, orNotFound } from '../../lib/http-error';
import { logger } from '../../lib/logger';
import { prisma, type Prisma } from '../../lib/prisma';
import { toAbsolutePath } from '../../lib/storage';
import { buildCertificateVariables, formatIssueDate, renderTemplate } from '../../rendering/certificate-html';
import { renderPdf, savePdf } from '../../rendering/pdf';
import { generateQr } from '../../rendering/qr';
import { canAccessCourse, coursesVisibleTo, getAccessibleCourse } from '../courses/course-access';
import { courseDependencies } from '../courses/courses.service';
import { findDefault as findDefaultTemplate } from '../templates/templates.service';

const NOT_FOUND = 'Certificado no encontrado';

// ---------- Consultas ----------

const listInclude = {
  participant: { select: { full_name: true } },
  course: { select: { name: true, type: true, dependency_id: true, dependency: { select: { name: true } } } },
  template: { select: { name: true } },
  branding_version: { select: { version_label: true } },
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
  template_id: c.template_id,
  template_name: c.template?.name ?? null,
  branding_label: c.branding_version?.version_label ?? null,
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
  template: { select: { name: true, orientation: true, page_size: true } },
  branding_version: true,
  issuer: { select: { full_name: true } },
} satisfies Prisma.CertificateInclude;

export type CertificateDetail = Prisma.CertificateGetPayload<{ include: typeof detailInclude }>;

/** Forma plana heredada del detalle (certificado + participante + curso + plantilla + branding). */
export const toDetail = (c: CertificateDetail) => {
  const { participant, course, template, branding_version: bv, issuer, ...cert } = c;
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
    template_name: template?.name ?? null,
    orientation: template?.orientation ?? null,
    page_size: template?.page_size ?? null,
    branding_label: bv?.version_label ?? null,
    primary_color: bv?.primary_color ?? null,
    secondary_color: bv?.secondary_color ?? null,
    font_family: bv?.font_family ?? null,
    organization_name: bv?.organization_name ?? null,
    branding_logo_path: bv?.logo_path ?? null,
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

/** Plantilla a usar: la indicada, la del curso o la default. */
const resolveTemplate = async (...candidates: (number | null | undefined)[]) => {
  for (const id of candidates) {
    if (!id) continue;
    const template = await prisma.certificateTemplate.findUnique({ where: { id } });
    if (template?.is_active) return template;
  }
  const fallback = await findDefaultTemplate();
  if (!fallback) throw badRequest('No hay plantillas de certificado activas');
  return fallback;
};

/** Fecha de hoy como DATE (medianoche UTC). */
const today = () => new Date(new Date().toISOString().slice(0, 10));

type Course = NonNullable<Awaited<ReturnType<typeof prisma.course.findUnique>>>;
type Template = Awaited<ReturnType<typeof resolveTemplate>>;
type Branding = NonNullable<Awaited<ReturnType<typeof prisma.brandingVersion.findUnique>>>;

const renderCertificateHtml = async (args: {
  uuid: string;
  participantName: string;
  course: Course;
  template: Template;
  branding: Branding | null;
  issueDate: Date;
}) => {
  const deps = await courseDependencies(args.course.id);
  const variables = buildCertificateVariables({
    participant: { full_name: args.participantName },
    course: args.course,
    branding: args.branding,
    dependencies: deps.map((d) => ({
      name: d.dependency_name,
      manager_name: d.manager_name,
      logo_path: d.logo_path,
      signature_path: d.signature_path,
      display_order: d.display_order,
    })),
    issueDate: formatIssueDate(args.issueDate),
    uuid: args.uuid,
    qrCodeBase64: await generateQr(args.uuid),
  });
  return renderTemplate(args.template.html_content, variables);
};

const renderCertificatePdf = async (args: Parameters<typeof renderCertificateHtml>[0]) =>
  renderPdf(await renderCertificateHtml(args), args.template);

// ---------- Vista previa del curso ----------

const PREVIEW_UUID = '00000000-0000-4000-8000-000000000000';

/**
 * Certificado del curso con sus datos reales (dependencias, firmas, branding activo) y un participante
 * de ejemplo. Sirve para revisar el diseno antes de emitir. No guarda nada.
 */
export const coursePreview = async (courseId: number, input: CoursePreviewInput, user: AuthUser) => {
  const course = await getAccessibleCourse(courseId, user, 'ver');
  const template = await resolveTemplate(input.template_id, course.template_id);
  const branding = await prisma.brandingVersion.findFirst({ where: { is_active: true } });
  const args = { uuid: PREVIEW_UUID, participantName: 'Nombre del Participante', course, template, branding, issueDate: today() };
  const meta = { template_id: template.id, template_name: template.name, orientation: template.orientation, page_size: template.page_size };
  if (input.format === 'pdf') return { ...meta, format: 'pdf' as const, pdf: await renderCertificatePdf(args) };
  return { ...meta, format: 'html' as const, html: await renderCertificateHtml(args) };
};

// ---------- Emision ----------

export const emit = async (input: EmitCertificatesInput, user: AuthUser) => {
  const course = await getAccessibleCourse(input.course_id, user, 'emitir certificados de');
  const template = await resolveTemplate(input.template_id, course.template_id);
  const branding = await prisma.brandingVersion.findFirst({ where: { is_active: true } });
  if (!branding) throw badRequest('No hay version de branding activa');

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
        template,
        branding,
        issueDate,
      });
      const certificate = await prisma.certificate.create({
        data: {
          uuid,
          participant_id: participantId,
          course_id: course.id,
          issued_by: user.userId,
          issue_date: issueDate,
          branding_version_id: branding.id,
          template_id: template.id,
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
 * Regenera el PDF conservando uuid (mismo QR), fecha de emision y version de branding original.
 * Usa los datos actuales del participante y del curso, y la plantilla actual del curso.
 * El PDF anterior se conserva en disco.
 */
export const reprint = async (id: number, user: AuthUser) => {
  const cert = await getAccessible(id, user, 'reimprimir');
  if (cert.status !== 'valid') throw conflict('Solo se pueden reimprimir certificados validos');

  const template = await resolveTemplate(cert.course.template_id, cert.template_id);
  const branding = cert.branding_version ?? (await prisma.brandingVersion.findFirst({ where: { is_active: true } }));
  const pdf = await renderCertificatePdf({
    uuid: cert.uuid,
    participantName: cert.participant.full_name,
    course: cert.course,
    template,
    branding,
    issueDate: cert.issue_date,
  });

  const reprintNumber = cert.reprint_count + 1;
  const updated = await prisma.certificate.update({
    where: { id },
    data: {
      pdf_path: savePdf(pdf, `certificate_${cert.uuid}_r${reprintNumber}.pdf`),
      template_id: template.id,
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
