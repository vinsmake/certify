-- Diseño del certificado por curso (decision #11 en memories/decisiones.md).
-- Orden: 1) columnas nuevas, 2) copiar datos existentes, 3) borrar lo que queda obsoleto.

-- ---------- 1. Columnas nuevas ----------

ALTER TABLE "courses"
  ADD COLUMN "certificate_html"  TEXT,
  ADD COLUMN "orientation"       "Orientation" NOT NULL DEFAULT 'landscape',
  ADD COLUMN "page_size"         "PageSize"    NOT NULL DEFAULT 'letter',
  ADD COLUMN "logo_path"         VARCHAR(500),
  ADD COLUMN "organization_name" VARCHAR(255),
  ADD COLUMN "primary_color"     VARCHAR(7)   NOT NULL DEFAULT '#61859D',
  ADD COLUMN "secondary_color"   VARCHAR(7)   NOT NULL DEFAULT '#EA8215',
  ADD COLUMN "font_family"       VARCHAR(100) NOT NULL DEFAULT 'Roboto';

ALTER TABLE "course_dependencies"
  ADD COLUMN "logo_path"      VARCHAR(500),
  ADD COLUMN "signature_path" VARCHAR(500),
  ADD COLUMN "signer_name"    VARCHAR(255);

-- ---------- 2. Copiar datos existentes ----------

-- HTML y formato: la plantilla del curso; si no tenia (o esta inactiva), la default; si no, la primera activa
UPDATE "courses" c
SET "certificate_html" = t."html_content",
    "orientation"      = t."orientation",
    "page_size"        = t."page_size"
FROM "certificate_templates" t
WHERE t."id" = COALESCE(
  (SELECT ct."id" FROM "certificate_templates" ct WHERE ct."id" = c."template_id" AND ct."is_active"),
  (SELECT ct."id" FROM "certificate_templates" ct WHERE ct."is_default" AND ct."is_active" ORDER BY ct."id" LIMIT 1),
  (SELECT ct."id" FROM "certificate_templates" ct WHERE ct."is_active" ORDER BY ct."id" LIMIT 1)
);

-- Sin plantillas disponibles: HTML minimo para no dejar el curso sin diseño
UPDATE "courses"
SET "certificate_html" = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head><body style="font-family:{{font_family}};text-align:center;padding:60px"><h1>{{certificate_noun}}</h1><p>Se otorga a</p><h2>{{participant_name}}</h2><p>por completar {{course_label}} {{course_name}}</p><p>{{issue_date}}</p><img src="{{qr_code_base64}}" width="120"></body></html>'
WHERE "certificate_html" IS NULL;

-- Branding activo -> diseño de cada curso. El logo por defecto del seed nunca existio en disco: se omite.
UPDATE "courses" c
SET "logo_path"         = NULLIF(b."logo_path", '/storage/logos/branding/default_logo.png'),
    "organization_name" = b."organization_name",
    "primary_color"     = b."primary_color",
    "secondary_color"   = b."secondary_color",
    "font_family"       = b."font_family"
FROM "branding_versions" b
WHERE b."is_active";

-- Logo, firma y encargado de cada dependencia -> su colaboracion en cada curso
UPDATE "course_dependencies" cd
SET "logo_path"      = d."logo_path",
    "signature_path" = d."signature_path",
    "signer_name"    = d."manager_name"
FROM "dependencies" d
WHERE d."id" = cd."dependency_id";

ALTER TABLE "courses" ALTER COLUMN "certificate_html" SET NOT NULL;

-- ---------- 3. Borrar lo obsoleto ----------

ALTER TABLE "branding_versions" DROP CONSTRAINT "branding_versions_created_by_fkey";
ALTER TABLE "certificates" DROP CONSTRAINT "certificates_branding_version_id_fkey";
ALTER TABLE "certificates" DROP CONSTRAINT "certificates_template_id_fkey";
ALTER TABLE "courses" DROP CONSTRAINT "courses_template_id_fkey";

ALTER TABLE "certificates" DROP COLUMN "branding_version_id", DROP COLUMN "template_id";
ALTER TABLE "courses" DROP COLUMN "template_id";
ALTER TABLE "dependencies" DROP COLUMN "logo_path", DROP COLUMN "manager_name", DROP COLUMN "signature_path";

DROP TABLE "branding_versions";
