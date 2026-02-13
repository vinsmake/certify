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
-- Password: Admin123! (bcrypt 12 rounds)
INSERT INTO users (email, password_hash, full_name, role, dependency_id, is_active)
VALUES (
    'admin@admin.com',
    '$2b$12$4yca6glTs1ZzPgErXu4ij.K670FgPX8INt86pFO9vZQRCfeSy98FS',
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
    max-height: 70px;
    max-width: 150px;
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
        <div class="instructor-name">{{instructor}}</div>
        <div class="instructor-label">Instructor</div>
      </div>

      <div class="footer-right">
        <div class="issue-date">{{dependency_names}}</div>
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
