const { buildCertificateHtml } = require('../services/templateService');
const { generateAndSavePDF } = require('../services/pdfService');
const { generateQR } = require('../services/qrService');

const TEMPLATES = [
  { id: 1, name: 'default' },
  { id: 2, name: 'formal' },
  { id: 3, name: 'modern' },
];

const testData = {
  participant: {
    full_name: 'Juan Carlos Perez',
    document_id: '1234567890',
  },
  course: {
    name: 'Curso de Seguridad Informatica',
    type: 'curso',
    duration_hours: 40,
    instructor: 'Dr. Roberto Silva',
  },
  brandingVersion: {
    logo_path: '/storage/logos/branding/default_logo.png',
    primary_color: '#1a365d',
    secondary_color: '#2b6cb0',
    font_family: 'Roboto',
    organization_name: 'Universidad Nacional',
  },
  courseDependencies: [
    { dependency_name: 'Dep. Informatica', logo_path: null, display_order: 1 },
    { dependency_name: 'Dep. Seguridad',   logo_path: null, display_order: 2 },
  ],
  issueDate: '14 de febrero de 2026',
};

async function runTests() {
  for (const tmpl of TEMPLATES) {
    const uuid = `test-${tmpl.name}-0000-0000-000000000000`;
    console.log(`\n--- Generando PDF con plantilla "${tmpl.name}" (id=${tmpl.id}) ---`);

    try {
      const qrBase64 = await generateQR(uuid);
      console.log('  QR generado: OK');

      const { html, template } = await buildCertificateHtml(tmpl.id, {
        ...testData,
        uuid,
        qrCodeBase64: qrBase64,
      });
      console.log(`  HTML renderizado: OK (${html.length} chars, orientacion=${template.orientation})`);

      const { pdfPath, pdfBuffer } = await generateAndSavePDF(html, uuid, {
        orientation: template.orientation,
        page_size:   template.page_size,
      });
      console.log(`  PDF guardado: ${pdfPath} (${pdfBuffer.length} bytes)`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }
  console.log('\nTest completado.');
  process.exit(0);
}

runTests();
