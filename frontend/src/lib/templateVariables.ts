// Variables que el backend sustituye en el HTML de los certificados
// (fuente: backend/src/rendering/certificate-html.ts). Se muestran como ayuda en los editores.
export const TEMPLATE_VARIABLES = [
  'participant_name',
  'course_name',
  'course_type',
  'course_duration',
  'instructor',
  'certificate_noun',
  'course_label',
  'issue_date',
  'certificate_uuid',
  'verification_url',
  'qr_code_base64',
  'institutional_logo_base64',
  'organization_name',
  'primary_color',
  'secondary_color',
  'font_family',
  'dependency_logos_html',
  'dependency_signatures_html',
  'dependency_names',
  'instructor_signature_html',
] as const;
