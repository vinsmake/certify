const fs = require('fs');
const pool = require('../config/database');

async function seedTemplates() {
  const formal = fs.readFileSync('/app/src/templates/formal.html', 'utf8');
  const modern = fs.readFileSync('/app/src/templates/modern.html', 'utf8');

  const result = await pool.query(
    `INSERT INTO certificate_templates (name, slug, description, html_content, orientation, page_size, is_default, is_active, created_by)
     VALUES
       ($1, 'formal', 'Diseño formal con bordes decorativos y tipografia serif', $2, 'landscape', 'letter', false, true, 1),
       ($3, 'modern', 'Diseño moderno minimalista con colores planos', $4, 'landscape', 'letter', false, true, 1)
     ON CONFLICT (slug) DO NOTHING
     RETURNING id, name, slug`,
    ['Plantilla Formal', formal, 'Plantilla Moderna', modern]
  );

  console.log('Insertadas:', JSON.stringify(result.rows));
  process.exit(0);
}

seedTemplates().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
