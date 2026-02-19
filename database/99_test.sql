-- ============================================================
-- Datos de prueba: 3 dependencias, 5 participantes, 2 cursos
-- ============================================================


-- ============================================================
-- DEPENDENCIAS
-- ============================================================

INSERT INTO dependencies (name, abbreviation, is_active)
VALUES
  ('Dirección de Recursos Humanos',          'DDRRHH', true),
  ('Dirección de Tecnologías de Información', 'DTI',    true),
  ('Coordinación de Capacitación',            'CC',     true);


-- ============================================================
-- PARTICIPANTES
-- ============================================================

INSERT INTO participants (document_id, full_name, email, organization, position)
VALUES
  ('1234567890', 'Ana Sofía Torres Medina',     'ana.torres@ejemplo.com',    'Universidad del Estado',   'Coordinadora de Proyectos'),
  ('0987654321', 'Luis Ernesto Vega Campos',    'luis.vega@ejemplo.com',     'Instituto Tecnológico',    'Técnico en Sistemas'),
  ('1122334455', 'Patricia Gómez Ríos',         'patricia.gomez@ejemplo.com', 'Secretaría de Educación', 'Jefa de Departamento'),
  ('5544332211', 'Miguel Ángel Herrera Soto',   'miguel.herrera@ejemplo.com', 'Gobierno Municipal',      'Analista Administrativo'),
  ('6677889900', 'Valeria Montes de Oca Díaz',  'valeria.montes@ejemplo.com', 'Empresa Privada S.A.',    'Gerente de Recursos Humanos');


-- ============================================================
-- CURSOS
-- created_by = 1 (admin principal por defecto)
-- ============================================================

INSERT INTO courses (name, description, type, duration_hours, instructor, start_date, end_date, dependency_id, created_by)
VALUES
  (
    'Liderazgo y Gestión de Equipos de Alto Desempeño',
    'Curso orientado al desarrollo de habilidades de liderazgo, comunicación efectiva y gestión de equipos en entornos organizacionales.',
    'Curso',
    40,
    'Lic. María González',
    '2026-01-13',
    '2026-01-31',
    (SELECT id FROM dependencies WHERE abbreviation = 'DDRRHH' LIMIT 1),
    1
  ),
  (
    'Seguridad Informática y Protección de Datos',
    'Formación en buenas prácticas de ciberseguridad, gestión de riesgos digitales y cumplimiento normativo en materia de protección de datos.',
    'Taller',
    24,
    'Ing. Carlos Ramírez',
    '2026-02-03',
    '2026-02-14',
    (SELECT id FROM dependencies WHERE abbreviation = 'DTI' LIMIT 1),
    1
  );


-- ============================================================
-- DEPENDENCIAS INVITADAS EN CURSOS (course_dependencies)
-- Curso 1 (Liderazgo): invitada DTI y CC
-- Curso 2 (Seguridad): invitada DDRRHH y CC
-- ============================================================

INSERT INTO course_dependencies (course_id, dependency_id, display_order)
VALUES
  -- Curso 1 - Liderazgo
  (
    (SELECT id FROM courses WHERE name LIKE 'Liderazgo%' LIMIT 1),
    (SELECT id FROM dependencies WHERE abbreviation = 'DTI'    LIMIT 1),
    1
  ),
  (
    (SELECT id FROM courses WHERE name LIKE 'Liderazgo%' LIMIT 1),
    (SELECT id FROM dependencies WHERE abbreviation = 'CC'     LIMIT 1),
    2
  ),
  -- Curso 2 - Seguridad
  (
    (SELECT id FROM courses WHERE name LIKE 'Seguridad%' LIMIT 1),
    (SELECT id FROM dependencies WHERE abbreviation = 'DDRRHH' LIMIT 1),
    1
  ),
  (
    (SELECT id FROM courses WHERE name LIKE 'Seguridad%' LIMIT 1),
    (SELECT id FROM dependencies WHERE abbreviation = 'CC'     LIMIT 1),
    2
  );
