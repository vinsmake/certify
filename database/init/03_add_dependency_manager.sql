-- ============================================================
-- Migración 03: Encargado y firma de dependencias
-- Agrega manager_name y signature_path a la tabla dependencies.
-- Actualiza la Plantilla Circuitos para usar {{dependency_signatures_html}}
-- en lugar del bloque estático con {{dependency_names}}.
-- ============================================================

-- 1. Nuevas columnas en dependencies
ALTER TABLE dependencies ADD COLUMN IF NOT EXISTS manager_name VARCHAR(255);
ALTER TABLE dependencies ADD COLUMN IF NOT EXISTS signature_path VARCHAR(500);

-- 2. Actualizar Plantilla Circuitos: reemplazar el bloque de firma de dependencia
--    (línea única de nombre) por la variable dinámica {{dependency_signatures_html}}
--    que genera un bloque por dependencia con imagen + línea + nombre del encargado.
UPDATE certificate_templates
SET html_content = regexp_replace(
    html_content,
    '\s*<div class="signature-block">\s*<div class="signature-line"></div>\s*<div class="signer-name">\{\{dependency_names\}\}</div>\s*<div class="signer-title">Dependencia</div>\s*</div>',
    E'\n      {{dependency_signatures_html}}',
    'g'
)
WHERE slug = 'circuits';
