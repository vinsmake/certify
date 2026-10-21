import { describe, expect, it } from 'vitest';
import {
  buildCertificateVariables,
  formatIssueDate,
  renderTemplate,
} from '../src/rendering/certificate-html';

describe('renderTemplate', () => {
  it('reemplaza variables conocidas y deja intactas las desconocidas', () => {
    expect(renderTemplate('Hola {{name}} {{other}}', { name: 'Ana' })).toBe('Hola Ana {{other}}');
  });

  it('no interpreta $ como patron de reemplazo (base64)', () => {
    expect(renderTemplate('{{x}}', { x: 'a$&b$1' })).toBe('a$&b$1');
  });
});

describe('buildCertificateVariables', () => {
  const base = {
    participant: { full_name: 'Ana Torres' },
    course: { name: 'React', type: 'diploma' as const, duration_hours: 40, instructor: 'Dr. X', signature_path: null },
    branding: null,
    dependencies: [
      { name: 'DTI', manager_name: 'Lic. B', logo_path: null, signature_path: null, display_order: 2 },
      { name: 'RRHH', manager_name: null, logo_path: null, signature_path: null, display_order: 1 },
    ],
    issueDate: '1 de enero de 2026',
    uuid: '11111111-1111-1111-1111-111111111111',
    qrCodeBase64: 'data:image/png;base64,AAA',
  };

  it('arma las variables del curso, participante y QR', () => {
    const v = buildCertificateVariables(base);
    expect(v.participant_name).toBe('Ana Torres');
    expect(v.certificate_noun).toBe('Diploma');
    expect(v.course_label).toBe('el programa');
    expect(v.course_duration).toBe('40');
    expect(v.verification_url).toMatch(/\/11111111-1111-1111-1111-111111111111$/);
  });

  it('ordena dependencias por display_order y usa el encargado como firmante', () => {
    expect(buildCertificateVariables(base).dependency_names).toBe('RRHH, Lic. B');
  });

  it('usa colores por defecto si no hay branding', () => {
    expect(buildCertificateVariables(base).primary_color).toBe('#61859D');
  });
});

describe('formatIssueDate', () => {
  it('formatea en español sin desfase de zona horaria', () => {
    expect(formatIssueDate(new Date('2026-02-15'))).toBe('15 de febrero de 2026');
  });
});
