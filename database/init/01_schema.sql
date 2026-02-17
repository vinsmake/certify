-- =============================================
-- Schema inicial - Plataforma de Credenciales Digitales
-- =============================================

-- 2.01 - Extension uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLAS
-- =============================================

-- 2.02 - Tabla dependencies (unidades organizacionales)
CREATE TABLE dependencies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(50),
    logo_path VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2.03 - Tabla users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'emisor')),
    dependency_id INTEGER REFERENCES dependencies(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2.04 - Tabla certificate_templates
CREATE TABLE certificate_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    html_content TEXT NOT NULL,
    orientation VARCHAR(20) DEFAULT 'landscape',
    page_size VARCHAR(20) DEFAULT 'letter',
    thumbnail_path VARCHAR(500),
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id)
);

-- 2.05 - Tabla courses
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    duration_hours INTEGER,
    instructor VARCHAR(255),
    signature_path VARCHAR(500),
    start_date DATE,
    end_date DATE,
    dependency_id INTEGER REFERENCES dependencies(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2.06 - Tabla course_dependencies (cursos con multiples dependencias colaboradoras)
CREATE TABLE course_dependencies (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    dependency_id INTEGER REFERENCES dependencies(id),
    display_order INTEGER DEFAULT 1,
    UNIQUE (course_id, dependency_id)
);

-- 2.07 - Tabla participants
CREATE TABLE participants (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    organization VARCHAR(255),
    position VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2.08 - Tabla branding_versions
CREATE TABLE branding_versions (
    id SERIAL PRIMARY KEY,
    version_label VARCHAR(50) NOT NULL,
    logo_path VARCHAR(500) NOT NULL,
    primary_color VARCHAR(7) NOT NULL,
    secondary_color VARCHAR(7) NOT NULL,
    font_family VARCHAR(100) NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id)
);

-- 2.09 - Tabla certificates
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    participant_id INTEGER REFERENCES participants(id),
    course_id INTEGER REFERENCES courses(id),
    issued_by INTEGER REFERENCES users(id),
    issue_date DATE NOT NULL,
    branding_version_id INTEGER REFERENCES branding_versions(id),
    template_id INTEGER REFERENCES certificate_templates(id),
    pdf_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'valid',
    revocation_reason TEXT,
    revoked_at TIMESTAMP,
    revoked_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2.10 - Tabla revocation_log
CREATE TABLE revocation_log (
    id SERIAL PRIMARY KEY,
    certificate_id INTEGER REFERENCES certificates(id),
    revoked_by INTEGER REFERENCES users(id),
    reason TEXT NOT NULL,
    revoked_at TIMESTAMP DEFAULT NOW()
);

-- 2.11 - Tabla course_participants (inscripciones)
CREATE TABLE course_participants (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    participant_id INTEGER REFERENCES participants(id),
    enrollment_date DATE DEFAULT NOW(),
    attendance_status VARCHAR(50) DEFAULT 'enrolled',
    UNIQUE (course_id, participant_id)
);

-- =============================================
-- 2.12 - INDICES
-- =============================================

CREATE INDEX idx_certificates_uuid ON certificates(uuid);
CREATE INDEX idx_participants_document_id ON participants(document_id);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_courses_dependency_id ON courses(dependency_id);
CREATE INDEX idx_users_dependency_id ON users(dependency_id);

-- =============================================
-- DATOS INICIALES (SEED)
-- =============================================

-- 2.13 - Dependencia por defecto
INSERT INTO dependencies (name, abbreviation, is_active)
VALUES ('Dependencia General', 'DG', true);

-- 2.14 - Usuario administrador por defecto
INSERT INTO users (email, password_hash, full_name, role, dependency_id, is_active)
VALUES (
    'vinsmakedev@gmail.com',
    '$2b$12$0RxGVnMPWZcMYC8RjJYr/OgMjgpy13v9rOT40vcxtrmuo6y88RzTO',
    'Administrador',
    'admin',
    NULL,
    true
);

-- 2.15 - Version de branding inicial
INSERT INTO branding_versions (version_label, logo_path, primary_color, secondary_color, font_family, organization_name, is_active, created_by)
VALUES (
    'v1',
    '/storage/logos/branding/default_logo.png',
    '#1a365d',
    '#2b6cb0',
    'Roboto',
    'Organizacion',
    true,
    1
);

-- 2.16 - Plantilla de certificado por defecto
INSERT INTO certificate_templates (name, slug, description, html_content, orientation, page_size, is_default, is_active, created_by)
VALUES (
    'Plantilla Por Defecto',
    'default',
    'Plantilla basica horizontal en tamano carta con zonas para logos, datos del participante y QR',
    '<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @import url(''https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap'');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1056px;
    height: 816px;
    font-family: ''{{font_family}}'', ''Roboto'', sans-serif;
    background: #ffffff;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .certificate {
    width: 1006px;
    height: 766px;
    border: 3px solid {{primary_color}};
    padding: 40px 50px;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }

  .certificate::before {
    content: '''';
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    bottom: 8px;
    border: 1px solid {{secondary_color}};
    pointer-events: none;
  }

  .header {
    text-align: center;
    width: 100%;
  }

  .logos {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 30px;
    margin-bottom: 15px;
  }

  .logos img {
    max-height: 100px;
    max-width: 200px;
    object-fit: contain;
  }

  .org-name {
    font-size: 14px;
    color: {{primary_color}};
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 5px;
  }

  .title {
    font-size: 32px;
    font-weight: 700;
    color: {{primary_color}};
    text-transform: uppercase;
    letter-spacing: 4px;
    margin-top: 10px;
  }

  .subtitle {
    font-size: 14px;
    color: #666;
    margin-top: 5px;
  }

  .body {
    text-align: center;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
  }

  .certify-text {
    font-size: 14px;
    color: #555;
    margin-bottom: 10px;
  }

  .participant-name {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
    border-bottom: 2px solid {{secondary_color}};
    display: inline-block;
    padding-bottom: 5px;
    margin-bottom: 15px;
  }

  .document {
    font-size: 12px;
    color: #888;
    margin-bottom: 15px;
  }

  .description {
    font-size: 14px;
    color: #333;
    line-height: 1.6;
    max-width: 700px;
    margin: 0 auto;
  }

  .course-name {
    font-weight: 700;
    color: {{primary_color}};
  }

  .footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
  }

  .footer-left {
    text-align: center;
  }

  .footer-center {
    text-align: center;
  }

  .footer-right {
    text-align: center;
  }

  .qr-code img {
    width: 80px;
    height: 80px;
  }

  .qr-label {
    font-size: 8px;
    color: #999;
    margin-top: 3px;
  }

  .issue-date {
    font-size: 12px;
    color: #666;
  }

  .instructor-signature {
    max-height: 80px;
    max-width: 220px;
    object-fit: contain;
    margin-bottom: 5px;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }

  .instructor-name {
    font-size: 14px;
    font-weight: 700;
    color: #333;
    border-top: 1px solid #999;
    padding-top: 5px;
    min-width: 200px;
  }

  .instructor-label {
    font-size: 10px;
    color: #888;
  }

  .dependency-logos {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 8px;
  }

  .dependency-logos img {
    max-height: 40px;
    max-width: 80px;
    object-fit: contain;
  }

  .uuid {
    font-size: 8px;
    color: #ccc;
    position: absolute;
    bottom: 12px;
    right: 15px;
  }
</style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logos">
        <img src="{{institutional_logo_base64}}" alt="Logo Institucional" />
      </div>
      <div class="org-name">{{organization_name}}</div>
      <div class="title">Certificado</div>
      <div class="subtitle">{{course_type}}</div>
    </div>

    <div class="body">
      <div class="certify-text">Se certifica que</div>
      <div class="participant-name">{{participant_name}}</div>
      <div class="document">C.I. {{document_id}}</div>
      <div class="description">
        Ha completado satisfactoriamente el <span class="course-name">{{course_name}}</span>,
        con una duracion de <strong>{{course_duration}} horas</strong>.
      </div>
      <div class="dependency-logos">
        {{dependency_logos_html}}
      </div>
    </div>

    <div class="footer">
      <div class="footer-left">
        <div class="qr-code">
          <img src="{{qr_code_base64}}" alt="QR Verificacion" />
        </div>
        <div class="qr-label">Escanea para verificar</div>
      </div>

      <div class="footer-center">
        <div class="issue-date">Fecha de emision: {{issue_date}}</div>
        <br/>
        {{instructor_signature_html}}
        <div class="instructor-name">{{instructor}}</div>
        <div class="instructor-label">Instructor</div>
      </div>

      <div class="footer-right">
      </div>
    </div>

    <div class="uuid">{{certificate_uuid}}</div>
  </div>
</body>
</html>',
    'landscape',
    'letter',
    true,
    true,
    1
);

-- 2.17 - Plantilla formal
INSERT INTO certificate_templates (name, slug, description, html_content, orientation, page_size, is_default, is_active, created_by)
VALUES (
    'Plantilla Formal',
    'formal',
    'Diseno formal con bordes decorativos y tipografia serif',
    '<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @import url(''https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lora:wght@400;700&display=swap'');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1056px;
    height: 816px;
    font-family: ''{{font_family}}'', ''Lora'', serif;
    background: #fffef9;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .certificate {
    width: 1016px;
    height: 776px;
    padding: 30px 40px;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }

  .certificate::before {
    content: '''';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border: 4px double {{primary_color}};
    pointer-events: none;
  }

  .certificate::after {
    content: '''';
    position: absolute;
    top: 12px; left: 12px; right: 12px; bottom: 12px;
    border: 1px solid {{secondary_color}};
    pointer-events: none;
  }

  .corner { position: absolute; width: 40px; height: 40px; }
  .corner::before, .corner::after {
    content: '''';
    position: absolute;
    background: {{primary_color}};
  }
  .corner-tl { top: 20px; left: 20px; }
  .corner-tl::before { width: 20px; height: 2px; top: 0; left: 0; }
  .corner-tl::after { width: 2px; height: 20px; top: 0; left: 0; }
  .corner-tr { top: 20px; right: 20px; }
  .corner-tr::before { width: 20px; height: 2px; top: 0; right: 0; }
  .corner-tr::after { width: 2px; height: 20px; top: 0; right: 0; }
  .corner-bl { bottom: 20px; left: 20px; }
  .corner-bl::before { width: 20px; height: 2px; bottom: 0; left: 0; }
  .corner-bl::after { width: 2px; height: 20px; bottom: 0; left: 0; }
  .corner-br { bottom: 20px; right: 20px; }
  .corner-br::before { width: 20px; height: 2px; bottom: 0; right: 0; }
  .corner-br::after { width: 2px; height: 20px; bottom: 0; right: 0; }

  .header { text-align: center; width: 100%; z-index: 1; }

  .logos {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 30px;
    margin-bottom: 10px;
  }
  .logos img { max-height: 100px; max-width: 200px; object-fit: contain; }

  .org-name {
    font-size: 13px;
    color: {{primary_color}};
    text-transform: uppercase;
    letter-spacing: 3px;
    font-weight: 400;
  }

  .divider {
    width: 200px;
    height: 1px;
    background: {{secondary_color}};
    margin: 10px auto;
  }

  .title {
    font-family: ''Playfair Display'', serif;
    font-size: 36px;
    font-weight: 700;
    color: {{primary_color}};
    letter-spacing: 6px;
    text-transform: uppercase;
  }

  .subtitle {
    font-size: 13px;
    color: #888;
    margin-top: 5px;
    font-style: italic;
  }

  .body {
    text-align: center;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    z-index: 1;
  }

  .certify-text {
    font-size: 13px;
    color: #777;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }

  .participant-name {
    font-family: ''Playfair Display'', serif;
    font-size: 30px;
    font-weight: 700;
    color: #1a1a1a;
    border-bottom: 1px solid {{primary_color}};
    display: inline-block;
    padding-bottom: 5px;
    margin-bottom: 12px;
  }

  .document { font-size: 11px; color: #999; margin-bottom: 12px; }

  .description {
    font-size: 14px;
    color: #444;
    line-height: 1.7;
    max-width: 650px;
    margin: 0 auto;
  }

  .course-name { font-weight: 700; color: {{primary_color}}; }

  .dependency-logos {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 10px;
  }
  .dependency-logos img { max-height: 35px; max-width: 75px; object-fit: contain; }

  .footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
    z-index: 1;
  }

  .footer-left, .footer-center, .footer-right { text-align: center; }

  .qr-code img { width: 70px; height: 70px; }
  .qr-label { font-size: 7px; color: #aaa; margin-top: 3px; }
  .issue-date { font-size: 11px; color: #777; }

  .instructor-signature {
    max-height: 80px;
    max-width: 220px;
    object-fit: contain;
    margin-bottom: 5px;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }

  .instructor-name {
    font-size: 14px;
    font-weight: 700;
    color: #333;
    border-top: 1px solid {{primary_color}};
    padding-top: 5px;
    min-width: 200px;
  }
  .instructor-label { font-size: 9px; color: #999; letter-spacing: 1px; }

  .uuid {
    font-size: 7px;
    color: #ddd;
    position: absolute;
    bottom: 16px;
    right: 20px;
    z-index: 1;
  }
</style>
</head>
<body>
  <div class="certificate">
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>

    <div class="header">
      <div class="logos">
        <img src="{{institutional_logo_base64}}" alt="Logo Institucional" />
      </div>
      <div class="org-name">{{organization_name}}</div>
      <div class="divider"></div>
      <div class="title">Certificado</div>
      <div class="subtitle">{{course_type}}</div>
    </div>

    <div class="body">
      <div class="certify-text">Otorga el presente certificado a</div>
      <div class="participant-name">{{participant_name}}</div>
      <div class="document">C.I. {{document_id}}</div>
      <div class="description">
        Por haber completado satisfactoriamente el <span class="course-name">{{course_name}}</span>,
        con una duracion de <strong>{{course_duration}} horas</strong>.
      </div>
      <div class="dependency-logos">{{dependency_logos_html}}</div>
    </div>

    <div class="footer">
      <div class="footer-left">
        <div class="qr-code"><img src="{{qr_code_base64}}" alt="QR" /></div>
        <div class="qr-label">Verificacion digital</div>
      </div>
      <div class="footer-center">
        <div class="issue-date">{{issue_date}}</div>
        <br/>
        {{instructor_signature_html}}
        <div class="instructor-name">{{instructor}}</div>
        <div class="instructor-label">Instructor</div>
      </div>
      <div class="footer-right">
      </div>
    </div>

    <div class="uuid">{{certificate_uuid}}</div>
  </div>
</body>
</html>',
    'landscape',
    'letter',
    false,
    true,
    1
);

-- 2.18 - Plantilla moderna
INSERT INTO certificate_templates (name, slug, description, html_content, orientation, page_size, is_default, is_active, created_by)
VALUES (
    'Plantilla Moderna',
    'modern',
    'Diseno moderno minimalista con colores planos',
    '<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @import url(''https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap'');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1056px;
    height: 816px;
    font-family: ''{{font_family}}'', ''Inter'', sans-serif;
    background: #ffffff;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .certificate {
    width: 1056px;
    height: 816px;
    display: flex;
    overflow: hidden;
  }

  .sidebar {
    width: 60px;
    background: {{primary_color}};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 20px 0;
  }

  .main {
    flex: 1;
    padding: 45px 55px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
  }

  .accent {
    position: absolute;
    top: 0;
    right: 0;
    width: 200px;
    height: 200px;
    background: {{secondary_color}};
    opacity: 0.08;
    border-radius: 0 0 0 100%;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
  }

  .header-left { display: flex; align-items: center; gap: 15px; }
  .header-left img { height: 70px; width: auto; object-fit: contain; }

  .org-name {
    font-size: 11px;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-weight: 300;
  }

  .header-right { text-align: right; }
  .tag {
    display: inline-block;
    background: {{primary_color}};
    color: #fff;
    font-size: 10px;
    padding: 4px 12px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
  }

  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 1;
  }

  .title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 4px;
    color: {{secondary_color}};
    font-weight: 600;
    margin-bottom: 8px;
  }

  .main-title {
    font-size: 38px;
    font-weight: 700;
    color: {{primary_color}};
    margin-bottom: 25px;
    line-height: 1.1;
  }

  .participant-name {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 6px;
  }

  .document {
    font-size: 12px;
    color: #aaa;
    font-weight: 300;
    margin-bottom: 20px;
  }

  .description {
    font-size: 14px;
    color: #555;
    line-height: 1.7;
    max-width: 600px;
    font-weight: 300;
  }
  .course-name { font-weight: 600; color: #1a1a1a; }

  .dependency-logos {
    display: flex;
    gap: 12px;
    margin-top: 15px;
  }
  .dependency-logos img { max-height: 35px; max-width: 70px; object-fit: contain; }

  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    z-index: 1;
    border-top: 1px solid #eee;
    padding-top: 15px;
  }

  .footer-left { text-align: left; }
  .instructor-signature {
    max-height: 80px;
    max-width: 220px;
    object-fit: contain;
    margin-bottom: 5px;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }
  .instructor-name {
    margin-top: 30px;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    border-top: 2px solid {{primary_color}};
    padding-top: 5px;
    min-width: 180px;
  }
  .instructor-label {
    font-size: 9px;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .footer-center { text-align: center; }
  .date-label { font-size: 8px; color: #bbb; text-transform: uppercase; letter-spacing: 1px; }
  .date-value { font-size: 13px; color: #444; font-weight: 600; }

  .footer-right { display: flex; align-items: center; gap: 10px; }
  .qr-code img { width: 60px; height: 60px; }
  .qr-info { text-align: right; }
  .qr-info .label { font-size: 8px; color: #bbb; text-transform: uppercase; letter-spacing: 1px; }
  .qr-info .value { font-size: 10px; color: #666; margin-top: 2px; }

  .uuid {
    font-size: 7px;
    color: #ddd;
    position: absolute;
    bottom: 15px;
    right: 20px;
  }
</style>
</head>
<body>
  <div class="certificate">
    <div class="sidebar">
    </div>

    <div class="main">
      <div class="accent"></div>

      <div class="header">
        <div class="header-left">
          <img src="{{institutional_logo_base64}}" alt="Logo" />
          <div class="org-name">{{organization_name}}</div>
        </div>
        <div class="header-right">
          <div class="tag">{{course_type}}</div>
        </div>
      </div>

      <div class="body">
        <div class="title">Certificado de completitud</div>
        <div class="main-title">Certificado</div>
        <div class="participant-name">{{participant_name}}</div>
        <div class="document">C.I. {{document_id}}</div>
        <div class="description">
          Ha completado satisfactoriamente el <span class="course-name">{{course_name}}</span>,
          con una duracion de <strong>{{course_duration}} horas</strong>.
        </div>
        <div class="dependency-logos">{{dependency_logos_html}}</div>
      </div>

      <div class="footer">
        <div class="footer-left">
          {{instructor_signature_html}}
          <div class="instructor-name">{{instructor}}</div>
          <div class="instructor-label">Instructor</div>
        </div>
        <div class="footer-center">
          <div class="date-label">Fecha de emision</div>
          <div class="date-value">{{issue_date}}</div>
        </div>
        <div class="footer-right">
          <div class="qr-info">
            <div class="label">Verificacion</div>
            <div class="value">{{certificate_uuid}}</div>
          </div>
          <div class="qr-code"><img src="{{qr_code_base64}}" alt="QR" /></div>
        </div>
      </div>

      <div class="uuid">{{certificate_uuid}}</div>
    </div>
  </div>
</body>
</html>',
    'landscape',
    'letter',
    false,
    true,
    1
);
