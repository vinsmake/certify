import type { CreateTemplateInput, UpdateTemplateInput } from '@certify/shared';
import { conflict, orNotFound } from '../../lib/http-error';
import { prisma } from '../../lib/prisma';
import {
  dependencySignatureBlock,
  EMPTY_IMAGE,
  instructorSignatureHtml,
  renderTemplate,
  sampleAssetDataUrl,
} from '../../rendering/certificate-html';
import { renderPdf } from '../../rendering/pdf';
import { generateQr, verificationUrl } from '../../rendering/qr';

const NOT_FOUND = 'Plantilla no encontrada';
export const SAMPLE_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export const findOrFail = async (id: number) =>
  orNotFound(await prisma.certificateTemplate.findUnique({ where: { id } }), NOT_FOUND);

/** Plantilla activa marcada como default (o la primera activa si ninguna lo esta). */
export const findDefault = async () =>
  (await prisma.certificateTemplate.findFirst({ where: { is_default: true, is_active: true } })) ??
  prisma.certificateTemplate.findFirst({ where: { is_active: true }, orderBy: { id: 'asc' } });

const assertSlugFree = async (slug: string, exceptId?: number) => {
  const other = await prisma.certificateTemplate.findUnique({ where: { slug } });
  if (other && other.id !== exceptId) {
    throw conflict(exceptId ? 'Ya existe otra plantilla con ese slug' : 'Ya existe una plantilla con ese slug');
  }
};

export const list = () =>
  prisma.certificateTemplate.findMany({
    where: { is_active: true },
    omit: { html_content: true },
    orderBy: [{ is_default: 'desc' }, { name: 'asc' }],
  });

export const create = async (input: CreateTemplateInput, createdBy: number) => {
  await assertSlugFree(input.slug);
  return prisma.certificateTemplate.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      html_content: input.html_content,
      orientation: input.orientation,
      page_size: input.page_size,
      created_by: createdBy,
    },
  });
};

export const update = async (id: number, input: UpdateTemplateInput) => {
  await findOrFail(id);
  if (input.slug) await assertSlugFree(input.slug, id);
  return prisma.certificateTemplate.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      html_content: input.html_content,
      orientation: input.orientation,
      page_size: input.page_size,
    },
  });
};

export const deactivate = async (id: number) => {
  await findOrFail(id);
  await prisma.certificateTemplate.update({ where: { id }, data: { is_active: false } });
  return { message: 'Plantilla desactivada', id };
};

export const setDefault = async (id: number) => {
  await findOrFail(id);
  const [, updated] = await prisma.$transaction([
    prisma.certificateTemplate.updateMany({ where: { is_default: true }, data: { is_default: false } }),
    prisma.certificateTemplate.update({ where: { id }, data: { is_default: true } }),
  ]);
  return { message: 'Plantilla establecida como default', id: updated.id, name: updated.name };
};


/** Variables de ejemplo para previsualizar una plantilla sin curso ni participante reales. */
const sampleVariables = async () => ({
    participant_name: 'Enrique Emmanuel Plascencia Soltero',
    course_name: 'Diplomado en Gestion de Proyectos',
    course_type: 'Diplomado',
    course_duration: '120',
    instructor: 'Dra. Amanda Isbosseth',
    certificate_noun: 'Diploma',
    certificate_noun_lower: 'diploma',
    course_label: 'el programa',
    issue_date: '15 de febrero de 2026',
    certificate_uuid: SAMPLE_UUID,
    verification_url: verificationUrl(SAMPLE_UUID),
    qr_code_base64: await generateQr(SAMPLE_UUID),
    institutional_logo_base64: EMPTY_IMAGE,
    dependency_logos_html: '',
    dependency_names: 'Dependencia General',
    instructor_signature_html: instructorSignatureHtml(sampleAssetDataUrl('sample-signature.png')),
    dependency_signatures_html: dependencySignatureBlock(
      'Lic. Dependencia General',
      sampleAssetDataUrl('sample-dependency-signature.png'),
    ),
    primary_color: '#1e3a5f',
    secondary_color: '#c9a84c',
    font_family: 'Georgia',
    organization_name: 'Vinsmake University',
});

/** HTML de la plantilla con datos de ejemplo (preview en vivo del editor). */
export const renderSampleHtml = async (htmlContent: string) => ({
  html: renderTemplate(htmlContent, await sampleVariables()),
});

export const previewPdf = async (id: number) => {
  const template = await findOrFail(id);
  const html = renderTemplate(template.html_content, await sampleVariables());
  const pdf = await renderPdf(html, { orientation: template.orientation, page_size: template.page_size });
  return { pdf, filename: `preview_${template.slug}.pdf` };
};

