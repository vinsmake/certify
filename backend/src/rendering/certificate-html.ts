// Construye el HTML final de un certificado inyectando variables {{...}} en la plantilla.
//
// Variables disponibles en las plantillas:
//   participant_name, course_name, course_type, course_duration, instructor,
//   certificate_noun, certificate_noun_lower, course_label,
//   issue_date, certificate_uuid, verification_url, qr_code_base64,
//   institutional_logo_base64, dependency_logos_html, dependency_signatures_html,
//   instructor_signature_html, dependency_names,
//   primary_color, secondary_color, font_family, organization_name
import path from 'node:path';
import type { CourseType } from '@certify/shared';
import { env } from '../config/env';
import { publicFileAsDataUrl, readAsDataUrl } from '../lib/storage';
import { verificationUrl } from './qr';

export type TemplateVariables = Record<string, string>;

export interface RenderDependency {
  name: string;
  manager_name: string | null;
  logo_path: string | null;
  signature_path: string | null;
  display_order: number;
}

export interface RenderBranding {
  logo_path: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  organization_name: string;
}

export interface CertificateRenderData {
  participant: { full_name: string };
  course: {
    name: string;
    type: CourseType;
    duration_hours: number | null;
    instructor: string | null;
    signature_path: string | null;
  };
  branding: RenderBranding | null;
  dependencies: RenderDependency[];
  issueDate: string;
  uuid: string;
  qrCodeBase64: string;
}

const COURSE_LABELS: Record<CourseType, string> = {
  diploma: 'el programa',
  charla: 'la charla',
  taller: 'el taller',
  seminario: 'el seminario',
  curso: 'el curso',
};

/** Fecha en formato largo en español: "15 de febrero de 2026". */
export const formatIssueDate = (date: Date) =>
  date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

export const renderTemplate = (html: string, variables: TemplateVariables) =>
  // Se usa funcion como reemplazo para que '$' dentro de base64 no se interprete como patron
  html.replace(/\{\{(\w+)\}\}/g, (match, key: string) => (key in variables ? (variables[key] ?? '') : match));

const signatureImg = (dataUrl: string, className?: string) =>
  `<div style="text-align:center;"><img src="${dataUrl}" alt="Firma"${className ? ` class="${className}"` : ''} style="max-height:80px;max-width:220px;object-fit:contain;display:block;margin:0 auto 5px auto;" /></div>`;

export const instructorSignatureHtml = (dataUrl: string) =>
  dataUrl ? signatureImg(dataUrl, 'instructor-signature') : '';

export const dependencySignatureBlock = (signerName: string, signatureDataUrl: string) =>
  `<div class="signature-block">${signatureDataUrl ? signatureImg(signatureDataUrl) : ''}<div class="signature-line"></div><div class="signer-name">${signerName}</div><div class="signer-title">Dependencia</div></div>`;

interface ResolvedDependency {
  name: string;
  signerName: string;
  logo: string;
  signature: string;
}

/** Logos de dependencias en columnas: logo arriba, nombre abajo. */
const dependencyLogosHtml = (deps: ResolvedDependency[]) => {
  if (deps.length === 0) return '';
  const items = deps.map((dep) => {
    const img = dep.logo
      ? `<img src="${dep.logo}" alt="${dep.name}" style="max-height:60px;max-width:120px;width:auto;height:auto;object-fit:contain;display:block;">`
      : '';
    const name = dep.name
      ? `<div style="font-size:10px;color:#666;margin-top:4px;white-space:nowrap;">${dep.name}</div>`
      : '';
    return `<div style="display:flex;flex-direction:column;align-items:center;text-align:center;min-width:80px;max-width:140px;">${img}${name}</div>`;
  });
  return `<div style="display:flex;align-items:flex-start;justify-content:center;flex-wrap:wrap;gap:20px;">${items.join('')}</div>`;
};

export const brandingVariables = (branding: RenderBranding | null): TemplateVariables => ({
  institutional_logo_base64: publicFileAsDataUrl(branding?.logo_path),
  primary_color: branding?.primary_color || '#61859D',
  secondary_color: branding?.secondary_color || '#EA8215',
  font_family: branding?.font_family || 'Roboto',
  organization_name: branding?.organization_name || '',
});

export const buildCertificateVariables = (data: CertificateRenderData): TemplateVariables => {
  const { participant, course, branding, issueDate, uuid, qrCodeBase64 } = data;

  const deps: ResolvedDependency[] = [...data.dependencies]
    .sort((a, b) => a.display_order - b.display_order)
    .map((d) => ({
      name: d.name,
      signerName: d.manager_name || d.name,
      logo: publicFileAsDataUrl(d.logo_path),
      signature: publicFileAsDataUrl(d.signature_path),
    }));

  return {
    participant_name: participant.full_name,

    course_name: course.name,
    course_type: course.type,
    course_duration: course.duration_hours ? String(course.duration_hours) : '',
    instructor: course.instructor ?? '',
    certificate_noun: course.type === 'diploma' ? 'Diploma' : 'Certificado',
    certificate_noun_lower: course.type === 'diploma' ? 'diploma' : 'certificado',
    course_label: COURSE_LABELS[course.type] ?? 'el curso',

    issue_date: issueDate,
    certificate_uuid: uuid,
    verification_url: verificationUrl(uuid),
    qr_code_base64: qrCodeBase64,

    dependency_logos_html: dependencyLogosHtml(deps),
    dependency_signatures_html: deps.map((d) => dependencySignatureBlock(d.signerName, d.signature)).join(''),
    dependency_names: deps.map((d) => d.signerName).join(', '),
    instructor_signature_html: instructorSignatureHtml(publicFileAsDataUrl(course.signature_path)),

    ...brandingVariables(branding),
  };
};

/** Firma de ejemplo incluida en el repo (para previews). */
export const sampleAssetDataUrl = (filename: 'sample-signature.png' | 'sample-dependency-signature.png') =>
  readAsDataUrl(path.join(env.ASSETS_DIR, filename));
