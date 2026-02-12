# Arquitectura del Sistema - Plataforma de Credenciales Digitales

## 1. Stack Tecnologico

- **Frontend:** React (Vite) + React Router + Axios
- **Backend:** Node.js + Express.js
- **Base de Datos:** PostgreSQL 16
- **Generacion de PDF:** Puppeteer (renderiza HTML/CSS a PDF con viewport fijo)
- **Generacion de QR:** qrcode (libreria npm)
- **Autenticacion:** JWT (jsonwebtoken + bcrypt)
- **Contenedores:** Docker + Docker Compose
- **Almacenamiento de archivos:** Sistema de archivos local montado en volumen Docker

## 2. Arquitectura General

El sistema sigue una arquitectura cliente-servidor de 3 capas:

```
[Navegador] --> [Frontend React :5173] --> [Backend Express :3000] --> [PostgreSQL :5432]
```

- El frontend es una SPA (Single Page Application) que se comunica con el backend via API REST.
- El backend expone endpoints REST, gestiona la logica de negocio, genera PDFs y QRs.
- PostgreSQL almacena todos los datos persistentes.
- Los PDFs generados se almacenan en un volumen Docker persistente.
- Los logos (institucionales y de dependencias) se almacenan versionados para no afectar certificados historicos.

## 3. Sistema de Generacion de Certificados PDF

Los certificados se generan mediante **plantillas HTML/CSS** que se renderizan a PDF con **Puppeteer**. Este metodo garantiza:

- **Consistencia:** Puppeteer usa un viewport fijo (ej: 1056x816px para carta horizontal), por lo que el zoom del navegador o el tamano de pantalla no afectan el resultado.
- **No son capturas de pantalla:** Puppeteer renderiza el HTML en un motor Chromium headless y produce un PDF vectorial nativo.
- **Plantillas intercambiables:** Se pueden crear multiples modelos/disenos de certificado. Cada plantilla es un archivo HTML/CSS completo almacenado en base de datos.
- **Multi-logo:** Cada certificado puede incluir el logo institucional (branding) mas los logos de todas las dependencias asociadas al curso.

### 3.1 Flujo de generacion

1. Se obtiene la plantilla HTML seleccionada (de la tabla `certificate_templates`).
2. Se obtiene el branding activo (logo institucional, colores, fuente).
3. Se obtienen los logos de las dependencias asociadas al curso (de `course_dependencies` + `dependencies`).
4. Se inyectan todas las variables en la plantilla (datos del participante, curso, logos en base64, QR, etc.).
5. Puppeteer renderiza el HTML a PDF con las dimensiones y orientacion definidas en la plantilla.
6. El PDF se guarda en el volumen persistente y se registra en la base de datos.

### 3.2 Ventajas del enfoque HTML → PDF

- Cualquier diseno posible con HTML/CSS se puede usar como certificado.
- Se pueden crear plantillas nuevas sin modificar codigo (solo HTML/CSS).
- Los logos se incrustan como base64, asi el PDF es autocontenido.
- El viewport fijo de Puppeteer garantiza que el resultado es identico sin importar donde se genere.

## 4. Sistema de Dependencias (Unidades Organizacionales)

Una **dependencia** es una unidad organizacional (ej: "Direccion de Capacitacion", "Direccion de Recursos Humanos"). El sistema de dependencias permite:

- Cada dependencia tiene su propio **logo** y nombre.
- Los **usuarios emisores** pertenecen a una dependencia y solo gestionan los cursos/certificados de la suya.
- Los **usuarios admin** no estan limitados a una dependencia y ven/gestionan todo.
- Un **curso puede tener multiples dependencias** asociadas (cuando dos o mas colaboran en un evento).
- Al emitir un certificado de un curso con multiples dependencias, el PDF incluye **todos los logos** de las dependencias asociadas, ademas del logo institucional.

### 4.1 Ejemplo: curso con dos dependencias

- Dependencia A (Capacitacion) y Dependencia B (Tecnologia) colaboran en un taller.
- Al crear el curso, se asocia la Dependencia A como principal (del creador) y se agrega la Dependencia B como colaboradora.
- Al emitir certificados, el PDF muestra: logo institucional + logo Dep. A + logo Dep. B.
- La pagina de verificacion publica tambien muestra ambos logos.

## 5. Docker Compose - Servicios

### 5.1 Servicio: frontend
- Imagen base: node:20-alpine
- Puerto expuesto: 5173
- Volumen montado: ./frontend/src -> /app/src (live reload con Vite HMR)
- Comando: npm run dev

### 5.2 Servicio: backend
- Imagen base: node:20-alpine
- Puerto expuesto: 3000
- Volumen montado: ./backend/src -> /app/src (live reload con nodemon)
- Volumen montado: certificates_data -> /app/storage (persistente)
- Volumen montado: logos_data -> /app/storage/logos (persistente)
- Variables de entorno: desde archivo .env
- Comando: npx nodemon src/index.js
- Depende de: database

### 5.3 Servicio: database
- Imagen: postgres:16-alpine
- Puerto expuesto: 5432
- Volumen montado: pgdata -> /var/lib/postgresql/data (persistente)
- Volumen montado: ./database/init -> /docker-entrypoint-initdb.d (scripts iniciales)
- Variables de entorno: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB

### 5.4 Volumenes persistentes
- pgdata: datos de PostgreSQL
- certificates_data: PDFs de certificados generados
- logos_data: logos institucionales y de dependencias

## 6. Estructura de Carpetas

```
/
├── docker-compose.yml
├── .env
├── .env.example
├── arquitectura.md
├── todo.md
├── readme.md
├── instructions.md
├── config.md
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── config/
│       │   └── theme.js
│       ├── assets/
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Header.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   └── Footer.jsx
│       │   ├── certificates/
│       │   │   ├── CertificateList.jsx
│       │   │   └── CertificateDetail.jsx
│       │   ├── courses/
│       │   │   ├── CourseList.jsx
│       │   │   ├── CourseForm.jsx
│       │   │   └── CourseDetail.jsx
│       │   ├── participants/
│       │   │   ├── ParticipantList.jsx
│       │   │   ├── ParticipantForm.jsx
│       │   │   └── ParticipantDetail.jsx
│       │   ├── admin/
│       │   │   ├── DependencyList.jsx
│       │   │   ├── DependencyForm.jsx
│       │   │   ├── TemplateList.jsx
│       │   │   ├── TemplateForm.jsx
│       │   │   └── UserForm.jsx
│       │   ├── auth/
│       │   │   ├── LoginForm.jsx
│       │   │   ├── ProtectedRoute.jsx
│       │   │   └── AdminRoute.jsx
│       │   └── ui/
│       │       ├── Button.jsx
│       │       ├── Input.jsx
│       │       ├── Modal.jsx
│       │       ├── Table.jsx
│       │       ├── SearchBar.jsx
│       │       ├── Pagination.jsx
│       │       ├── Select.jsx
│       │       ├── Badge.jsx
│       │       └── Alert.jsx
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── CoursesPage.jsx
│       │   ├── ParticipantsPage.jsx
│       │   ├── CertificatesPage.jsx
│       │   ├── EmitCertificatePage.jsx
│       │   ├── VerifyPage.jsx
│       │   ├── SettingsPage.jsx
│       │   ├── NotFoundPage.jsx
│       │   ├── UnauthorizedPage.jsx
│       │   └── admin/
│       │       ├── DependenciesPage.jsx
│       │       ├── TemplatesPage.jsx
│       │       ├── UsersPage.jsx
│       │       ├── GlobalEventsPage.jsx
│       │       ├── GlobalCertificatesPage.jsx
│       │       └── ActivityLogPage.jsx
│       ├── services/
│       │   ├── api.js
│       │   ├── authService.js
│       │   ├── courseService.js
│       │   ├── participantService.js
│       │   ├── certificateService.js
│       │   ├── dependencyService.js
│       │   └── templateService.js
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── hooks/
│       │   ├── useAuth.js
│       │   └── useFetch.js
│       └── styles/
│           └── global.css
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── app.js
│       ├── config/
│       │   ├── database.js
│       │   ├── environment.js
│       │   └── branding.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── courseRoutes.js
│       │   ├── participantRoutes.js
│       │   ├── certificateRoutes.js
│       │   ├── verificationRoutes.js
│       │   ├── brandingRoutes.js
│       │   ├── dependencyRoutes.js
│       │   ├── templateRoutes.js
│       │   ├── statsRoutes.js
│       │   └── adminRoutes.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── courseController.js
│       │   ├── participantController.js
│       │   ├── certificateController.js
│       │   ├── verificationController.js
│       │   ├── brandingController.js
│       │   ├── dependencyController.js
│       │   ├── templateController.js
│       │   └── statsController.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Course.js
│       │   ├── CourseDependency.js
│       │   ├── Participant.js
│       │   ├── Certificate.js
│       │   ├── CertificateTemplate.js
│       │   ├── BrandingVersion.js
│       │   ├── Dependency.js
│       │   ├── CourseParticipant.js
│       │   └── RevocationLog.js
│       ├── services/
│       │   ├── pdfService.js
│       │   ├── qrService.js
│       │   ├── certificateService.js
│       │   ├── brandingService.js
│       │   └── templateService.js
│       ├── middlewares/
│       │   ├── authMiddleware.js
│       │   ├── roleMiddleware.js
│       │   ├── dependencyMiddleware.js
│       │   ├── errorHandler.js
│       │   └── validateRequest.js
│       ├── templates/
│       │   ├── default.html
│       │   ├── formal.html
│       │   └── modern.html
│       ├── utils/
│       │   ├── hashUtils.js
│       │   ├── tokenUtils.js
│       │   └── fileUtils.js
│       └── storage/
│           ├── certificates/
│           └── logos/
│               ├── branding/
│               └── dependencies/
│
└── database/
    ├── init/
    │   └── 01_schema.sql
    └── migrations/
```

## 7. Modelo de Datos (Tablas PostgreSQL)

### 7.1 dependencies
- id: SERIAL PRIMARY KEY
- name: VARCHAR(255) NOT NULL
- abbreviation: VARCHAR(50)
- logo_path: VARCHAR(500)
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()

### 7.2 users
- id: SERIAL PRIMARY KEY
- email: VARCHAR(255) UNIQUE NOT NULL
- password_hash: VARCHAR(255) NOT NULL
- full_name: VARCHAR(255) NOT NULL
- role: VARCHAR(50) NOT NULL CHECK(role IN ('admin', 'emisor'))
- dependency_id: INTEGER REFERENCES dependencies(id) (nullable para admin, requerido para emisor)
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()

### 7.3 certificate_templates
- id: SERIAL PRIMARY KEY
- name: VARCHAR(255) NOT NULL
- slug: VARCHAR(100) UNIQUE NOT NULL
- description: TEXT
- html_content: TEXT NOT NULL (plantilla HTML/CSS completa)
- orientation: VARCHAR(20) DEFAULT 'landscape' (landscape, portrait)
- page_size: VARCHAR(20) DEFAULT 'letter' (letter, A4)
- thumbnail_path: VARCHAR(500)
- is_default: BOOLEAN DEFAULT false
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP DEFAULT NOW()
- created_by: INTEGER REFERENCES users(id)

### 7.4 courses
- id: SERIAL PRIMARY KEY
- name: VARCHAR(500) NOT NULL
- description: TEXT
- type: VARCHAR(50) NOT NULL (curso, charla, taller)
- duration_hours: INTEGER
- instructor: VARCHAR(255)
- start_date: DATE
- end_date: DATE
- dependency_id: INTEGER REFERENCES dependencies(id) (dependencia principal del creador)
- created_by: INTEGER REFERENCES users(id)
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()

### 7.5 course_dependencies
- id: SERIAL PRIMARY KEY
- course_id: INTEGER REFERENCES courses(id)
- dependency_id: INTEGER REFERENCES dependencies(id)
- display_order: INTEGER DEFAULT 1 (orden en que se muestran los logos)
- UNIQUE(course_id, dependency_id)

### 7.6 participants
- id: SERIAL PRIMARY KEY
- document_id: VARCHAR(50) UNIQUE NOT NULL (cedula/identificacion)
- full_name: VARCHAR(255) NOT NULL
- email: VARCHAR(255)
- organization: VARCHAR(255)
- position: VARCHAR(255)
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()

### 7.7 branding_versions
- id: SERIAL PRIMARY KEY
- version_label: VARCHAR(50) NOT NULL (ej: "v1", "v2")
- logo_path: VARCHAR(500) NOT NULL (logo institucional)
- primary_color: VARCHAR(7) NOT NULL (hex)
- secondary_color: VARCHAR(7) NOT NULL (hex)
- font_family: VARCHAR(100) NOT NULL
- organization_name: VARCHAR(255) NOT NULL
- is_active: BOOLEAN DEFAULT false (solo una version activa a la vez)
- created_at: TIMESTAMP DEFAULT NOW()
- created_by: INTEGER REFERENCES users(id)

### 7.8 certificates
- id: SERIAL PRIMARY KEY
- uuid: UUID UNIQUE NOT NULL (identificador publico para verificacion)
- participant_id: INTEGER REFERENCES participants(id)
- course_id: INTEGER REFERENCES courses(id)
- issued_by: INTEGER REFERENCES users(id)
- issue_date: DATE NOT NULL
- branding_version_id: INTEGER REFERENCES branding_versions(id)
- template_id: INTEGER REFERENCES certificate_templates(id)
- pdf_path: VARCHAR(500)
- status: VARCHAR(50) DEFAULT 'valid' (valid, revoked)
- revocation_reason: TEXT
- revoked_at: TIMESTAMP
- revoked_by: INTEGER REFERENCES users(id)
- created_at: TIMESTAMP DEFAULT NOW()

### 7.9 revocation_log
- id: SERIAL PRIMARY KEY
- certificate_id: INTEGER REFERENCES certificates(id)
- revoked_by: INTEGER REFERENCES users(id)
- reason: TEXT NOT NULL
- revoked_at: TIMESTAMP DEFAULT NOW()

### 7.10 course_participants (tabla intermedia para inscripciones)
- id: SERIAL PRIMARY KEY
- course_id: INTEGER REFERENCES courses(id)
- participant_id: INTEGER REFERENCES participants(id)
- enrollment_date: DATE DEFAULT NOW()
- attendance_status: VARCHAR(50) DEFAULT 'enrolled' (enrolled, completed, absent)
- UNIQUE(course_id, participant_id)

## 8. API REST - Endpoints

### 8.1 Autenticacion
- POST /api/auth/login - Iniciar sesion (devuelve JWT con role y dependency_id)
- GET /api/auth/me - Obtener usuario actual (incluye dependencia)

### 8.2 Usuarios (solo admin)
- GET /api/users - Listar usuarios
- POST /api/users - Crear usuario (asignando rol y dependencia)
- PUT /api/users/:id - Actualizar usuario
- DELETE /api/users/:id - Desactivar usuario

### 8.3 Dependencias
- GET /api/dependencies - Listar dependencias (todos los autenticados)
- GET /api/dependencies/:id - Detalle de dependencia
- POST /api/dependencies - Crear dependencia (solo admin)
- PUT /api/dependencies/:id - Actualizar dependencia (solo admin)
- DELETE /api/dependencies/:id - Desactivar dependencia (solo admin)
- POST /api/dependencies/:id/logo - Subir logo de dependencia (solo admin)

### 8.4 Plantillas de Certificado
- GET /api/templates - Listar plantillas activas (todos los autenticados)
- GET /api/templates/:id - Detalle de plantilla (incluye html_content)
- POST /api/templates - Crear plantilla (solo admin)
- PUT /api/templates/:id - Actualizar plantilla (solo admin)
- DELETE /api/templates/:id - Desactivar plantilla (solo admin)
- POST /api/templates/:id/preview - Generar preview PDF con datos de ejemplo
- PUT /api/templates/:id/default - Establecer como plantilla por defecto (solo admin)

### 8.5 Cursos
- GET /api/courses - Listar cursos (admin ve todos, emisor solo su dependencia)
- GET /api/courses/:id - Detalle de curso (incluye dependencias asociadas)
- POST /api/courses - Crear curso
- PUT /api/courses/:id - Actualizar curso
- DELETE /api/courses/:id - Eliminar curso
- POST /api/courses/:id/dependencies - Agregar dependencia colaboradora
- DELETE /api/courses/:id/dependencies/:depId - Quitar dependencia colaboradora
- GET /api/courses/:id/participants - Listar participantes de un curso
- POST /api/courses/:id/participants - Inscribir participantes a un curso
- PUT /api/courses/:id/participants/:participantId - Actualizar estado de participante

### 8.6 Participantes
- GET /api/participants - Listar participantes (con paginacion y busqueda)
- GET /api/participants/:id - Detalle de participante
- POST /api/participants - Crear participante
- PUT /api/participants/:id - Actualizar participante
- DELETE /api/participants/:id - Eliminar participante
- GET /api/participants/:id/certificates - Certificados de un participante

### 8.7 Certificados
- GET /api/certificates - Listar certificados (admin ve todos, emisor solo su dependencia)
- GET /api/certificates/:id - Detalle de certificado
- POST /api/certificates/emit - Emitir certificado(s) (recibe course_id, participant_ids, template_id)
- POST /api/certificates/:id/revoke - Revocar certificado
- GET /api/certificates/:id/download - Descargar PDF del certificado

### 8.8 Verificacion (publico, sin autenticacion)
- GET /api/verify/:uuid - Verificar autenticidad de certificado (devuelve datos publicos, logos institucional y de dependencias, estado)

### 8.9 Branding (solo admin, excepto GET /active)
- GET /api/branding/active - Obtener configuracion de marca activa (publico)
- GET /api/branding/versions - Listar versiones de marca
- POST /api/branding/versions - Crear nueva version de marca
- PUT /api/branding/versions/:id/activate - Activar una version de marca
- POST /api/branding/versions/:id/logo - Subir logo institucional

### 8.10 Estadisticas
- GET /api/stats - Estadisticas globales (admin: totales y desglose por dependencia)
- GET /api/stats/dependency/:id - Estadisticas de una dependencia
- GET /api/stats/me - Estadisticas de la dependencia del usuario actual

### 8.11 Administracion Global (solo admin)
- GET /api/admin/events - Lista global de todos los cursos/eventos con filtros
- GET /api/admin/certificates - Lista global de todos los certificados con filtros
- GET /api/admin/activity - Registro de actividad reciente del sistema

## 9. Flujo de Emision de Certificado

1. El emisor selecciona un curso (ve solo los de su dependencia; admin ve todos).
2. El sistema muestra los participantes inscritos con estado "completed" que no tengan ya certificado para ese curso.
3. El emisor selecciona una **plantilla de certificado** (o se usa la por defecto).
4. El emisor selecciona los participantes a certificar.
5. (Opcional) El emisor puede generar una **vista previa** con datos del primer participante.
6. Por cada participante seleccionado:
   a. Se genera un UUID unico para el certificado.
   b. Se obtiene la version de branding activa actual (logo institucional, colores, fuente).
   c. Se obtienen los logos de las **dependencias asociadas al curso** (de `course_dependencies`).
   d. Se genera el QR con la URL: {BASE_URL}/verificar/{uuid}
   e. Se carga la **plantilla HTML** seleccionada (de `certificate_templates`).
   f. Se inyectan todas las variables en la plantilla: datos del participante, curso, logos (institucional + dependencias en base64), QR, colores, fuente.
   g. Se convierte el HTML a PDF con Puppeteer (viewport fijo, tamano y orientacion segun la plantilla).
   h. Se almacena el PDF en el volumen persistente.
   i. Se registra el certificado en la base de datos con referencia a la version de branding, la plantilla y el curso.
7. Se confirma la emision al emisor con el total emitido.

## 10. Flujo de Verificacion

1. Un tercero escanea el QR del certificado o ingresa la URL.
2. El frontend carga la pagina publica de verificacion.
3. Se hace GET /api/verify/{uuid}.
4. El backend busca el certificado por UUID.
5. Si existe y esta valido: muestra datos del certificado, nombre del participante, curso, fecha, dependencias participantes con logos, y un sello de "CERTIFICADO VALIDO".
6. Si esta revocado: muestra aviso de "CERTIFICADO REVOCADO".
7. Si no existe: muestra "CERTIFICADO NO ENCONTRADO".

## 11. Sistema de Roles

- **admin:** Gestion completa del sistema. Acceso a todas las dependencias, plantillas, usuarios, cursos, certificados. Ve panel global con listas de eventos y certificados de todo el sistema. Gestiona branding institucional y dependencias. No esta vinculado a una dependencia especifica.
- **emisor:** Vinculado a una dependencia. Puede crear cursos (se asignan automaticamente a su dependencia), gestionar participantes, emitir y revocar certificados de su dependencia. Ve dashboard con estadisticas de su dependencia. No puede acceder a datos de otras dependencias ni a configuracion global.

## 12. Seguridad

- Contrasenas hasheadas con bcrypt (salt rounds: 12).
- JWT con expiracion configurable (default: 8 horas). Payload incluye: userId, role, dependency_id.
- Middleware de autenticacion en todas las rutas protegidas.
- Middleware de roles para control de acceso (admin vs emisor).
- Middleware de dependencia para filtrado automatico de datos (emisor solo ve su dependencia).
- Validacion de entrada en todos los endpoints (express-validator).
- CORS configurado para permitir solo el origen del frontend.
- Helmet para headers de seguridad HTTP.
- Rate limiting en endpoint de login.
- UUID v4 para identificadores publicos de certificados (no expone IDs internos).
