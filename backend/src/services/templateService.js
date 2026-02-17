const fs = require('fs');
const path = require('path');
const CertificateTemplate = require('../models/CertificateTemplate');
const { readFileAsBase64 } = require('../utils/fileUtils');
const { VERIFICATION_BASE_URL } = require('../config/environment');

// Raiz del storage dentro del contenedor
const STORAGE_ROOT = '/app/storage';

/**
 * 13.01 - Obtiene la plantilla desde la BD por su ID.
 * @param {number} templateId
 * @returns {Promise<Object>} plantilla con html_content
 */
const loadTemplate = async (templateId) => {
  const template = await CertificateTemplate.findById(templateId);
  if (!template) {
    throw new Error(`Plantilla con ID ${templateId} no encontrada`);
  }
  return template;
};

/**
 * 13.02 - Resuelve y convierte a base64 el logo institucional y los logos
 * de las dependencias del curso.
 *
 * @param {Object} brandingVersion - objeto branding activo (tiene logo_path)
 * @param {Array}  courseDependencies - array de dependencias del curso (cada una tiene logo_path)
 * @returns {Object} { institutionalLogoBase64, dependencyLogos: [{name, logoBase64, display_order}] }
 */
const resolveLogos = (brandingVersion, courseDependencies) => {
  // --- Logo institucional ---
  let institutionalLogoBase64 = '';
  if (brandingVersion && brandingVersion.logo_path) {
    const absPath = path.join(STORAGE_ROOT, brandingVersion.logo_path.replace('/storage/', ''));
    if (fs.existsSync(absPath)) {
      institutionalLogoBase64 = readFileAsBase64(absPath);
    }
  }

  // --- Logos de dependencias del curso (en orden de display_order) ---
  const dependencyLogos = (courseDependencies || []).map((dep) => {
    let logoBase64 = '';
    if (dep.logo_path) {
      const absPath = path.join(STORAGE_ROOT, dep.logo_path.replace('/storage/', ''));
      if (fs.existsSync(absPath)) {
        logoBase64 = readFileAsBase64(absPath);
      }
    }
    return {
      name: dep.dependency_name || dep.name || '',
      logoBase64,
      display_order: dep.display_order || 1,
    };
  }).sort((a, b) => a.display_order - b.display_order);

  return { institutionalLogoBase64, dependencyLogos };
};

/**
 * 13.05 - Construye el bloque HTML de logos de dependencias.
 * Cada dependencia se muestra como una columna: logo arriba, nombre debajo.
 * Se inyecta como {{dependency_logos_html}} en la plantilla.
 */
const buildDependencyLogosHtml = (dependencyLogos) => {
  if (!dependencyLogos || dependencyLogos.length === 0) {
    return '';
  }

  const items = dependencyLogos.map((dep) => {
    const imgTag = dep.logoBase64
      ? `<img src="${dep.logoBase64}" alt="${dep.name}" style="object-fit:contain;">`
      : '';
    const nameTag = dep.name
      ? `<div style="font-size:10px;color:#666;margin-top:4px;white-space:nowrap;">${dep.name}</div>`
      : '';
    return `<div style="display:flex;flex-direction:column;align-items:center;text-align:center;min-width:80px;">${imgTag}${nameTag}</div>`;
  });

  return `<div style="display:flex;align-items:flex-start;justify-content:center;flex-wrap:wrap;gap:20px;">${items.join('')}</div>`;
};

/**
 * 13.03 / 13.04 - Inyecta todas las variables {{variable}} en el HTML de la plantilla.
 *
 * Variables soportadas:
 *   {{participant_name}}, {{document_id}}, {{course_name}}, {{course_type}},
 *   {{course_duration}}, {{instructor}}, {{issue_date}}, {{certificate_uuid}},
 *   {{qr_code_base64}}, {{institutional_logo_base64}}, {{dependency_logos_html}},
 *   {{primary_color}}, {{secondary_color}}, {{font_family}}, {{organization_name}},
 *   {{dependency_names}}, {{verification_url}}, {{instructor_signature_html}}
 */
const renderTemplate = (htmlContent, variables) => {
  let rendered = htmlContent;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    const replacement = value !== null && value !== undefined ? String(value) : '';
    // Usar funcion como segundo argumento para evitar que $ en base64 se interprete como patron especial
    rendered = rendered.replace(regex, () => replacement);
  }
  return rendered;
};

/**
 * Funcion principal: carga plantilla, resuelve logos e inyecta todas las variables.
 *
 * @param {number} templateId
 * @param {Object} data - datos del certificado, branding y dependencias
 * @returns {Promise<{html: string, template: Object}>}
 */
const buildCertificateHtml = async (templateId, data) => {
  const {
    participant,
    course,
    brandingVersion,
    courseDependencies,
    issueDate,
    uuid,
    qrCodeBase64,
  } = data;

  const template = await loadTemplate(templateId);
  const { institutionalLogoBase64, dependencyLogos } = resolveLogos(brandingVersion, courseDependencies);
  const dependencyLogosHtml = buildDependencyLogosHtml(dependencyLogos);
  const dependencyNames = (courseDependencies || []).map(d => d.dependency_name || d.name).join(', ');

  // Resolver firma del instructor
  let instructorSignatureHtml = '';
  if (course.signature_path) {
    const absPath = path.join(STORAGE_ROOT, course.signature_path.replace('/storage/', ''));
    console.log('[templateService] Firma del instructor - signature_path:', course.signature_path, '| absPath:', absPath, '| exists:', fs.existsSync(absPath));
    if (fs.existsSync(absPath)) {
      const signatureBase64 = readFileAsBase64(absPath);
      instructorSignatureHtml = `<img src="${signatureBase64}" alt="Firma" class="instructor-signature" />`;
    }
  } else {
    console.log('[templateService] Curso sin firma - signature_path:', course.signature_path);
  }

  const variables = {
    // Participante
    participant_name:         participant.full_name || '',
    document_id:              participant.document_id || '',

    // Curso
    course_name:              course.name || '',
    course_type:              course.type || '',
    course_duration:          course.duration_hours ? `${course.duration_hours}` : '',
    instructor:               course.instructor || '',

    // Certificado
    issue_date:               issueDate || new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
    certificate_uuid:         uuid || '',
    verification_url:         `${VERIFICATION_BASE_URL}/${uuid}`,

    // QR y logos
    qr_code_base64:           qrCodeBase64 || '',
    institutional_logo_base64: institutionalLogoBase64,
    dependency_logos_html:    dependencyLogosHtml,

    // Branding
    primary_color:            brandingVersion?.primary_color   || '#1a365d',
    secondary_color:          brandingVersion?.secondary_color || '#2b6cb0',
    font_family:              brandingVersion?.font_family     || 'Roboto',
    organization_name:        brandingVersion?.organization_name || '',

    // Firma del instructor
    instructor_signature_html: instructorSignatureHtml,

    // Extra
    dependency_names:         dependencyNames,
  };

  const html = renderTemplate(template.html_content, variables);
  return { html, template };
};

module.exports = { loadTemplate, resolveLogos, renderTemplate, buildCertificateHtml };
