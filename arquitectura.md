# Arquitectura del Sistema - Plataforma de Credenciales Digitales

## 1. Stack Tecnologico

- **Frontend:** React (Vite) + React Router + Axios
- **Backend:** Node.js + Express.js
- **Base de Datos:** PostgreSQL 16
- **Generacion de PDF:** Puppeteer (renderiza HTML/CSS a PDF)
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
- Los logos se almacenan versionados para no afectar certificados historicos.

## 3. Docker Compose - Servicios

### 3.1 Servicio: frontend
- Imagen base: node:20-alpine
- Puerto expuesto: 5173
- Volumen montado: ./frontend/src -> /app/src (live reload con Vite HMR)
- Comando: npm run dev

### 3.2 Servicio: backend
- Imagen base: node:20-alpine
- Puerto expuesto: 3000
- Volumen montado: ./backend/src -> /app/src (live reload con nodemon)
- Volumen montado: certificates_data -> /app/storage (persistente)
- Volumen montado: logos_data -> /app/storage/logos (persistente)
- Variables de entorno: desde archivo .env
- Comando: npx nodemon src/index.js
- Depende de: database

### 3.3 Servicio: database
- Imagen: postgres:16-alpine
- Puerto expuesto: 5432
- Volumen montado: pgdata -> /var/lib/postgresql/data (persistente)
- Volumen montado: ./database/init -> /docker-entrypoint-initdb.d (scripts iniciales)
- Variables de entorno: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB

### 3.4 Volumenes persistentes
- pgdata: datos de PostgreSQL
- certificates_data: PDFs de certificados generados
- logos_data: logos versionados

## 4. Estructura de Carpetas

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
│       │   └── theme.js              (colores, fuentes, configuracion visual)
│       ├── assets/
│       │   └── (imagenes estaticas del frontend)
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Header.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   └── Footer.jsx
│       │   ├── certificates/
│       │   │   ├── CertificateList.jsx
│       │   │   ├── CertificateForm.jsx
│       │   │   ├── CertificateDetail.jsx
│       │   │   └── CertificatePreview.jsx
│       │   ├── courses/
│       │   │   ├── CourseList.jsx
│       │   │   ├── CourseForm.jsx
│       │   │   └── CourseDetail.jsx
│       │   ├── participants/
│       │   │   ├── ParticipantList.jsx
│       │   │   ├── ParticipantForm.jsx
│       │   │   └── ParticipantDetail.jsx
│       │   ├── verification/
│       │   │   └── VerificationPage.jsx
│       │   ├── auth/
│       │   │   ├── LoginForm.jsx
│       │   │   └── ProtectedRoute.jsx
│       │   └── ui/
│       │       ├── Button.jsx
│       │       ├── Input.jsx
│       │       ├── Modal.jsx
│       │       ├── Table.jsx
│       │       ├── SearchBar.jsx
│       │       ├── Pagination.jsx
│       │       └── Alert.jsx
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── CoursesPage.jsx
│       │   ├── ParticipantsPage.jsx
│       │   ├── CertificatesPage.jsx
│       │   ├── EmitCertificatePage.jsx
│       │   ├── VerifyPage.jsx          (pagina publica de verificacion)
│       │   ├── SettingsPage.jsx
│       │   └── NotFoundPage.jsx
│       ├── services/
│       │   ├── api.js                  (instancia de Axios configurada)
│       │   ├── authService.js
│       │   ├── courseService.js
│       │   ├── participantService.js
│       │   └── certificateService.js
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
│       ├── index.js                    (punto de entrada, inicializa Express)
│       ├── app.js                      (configuracion de Express, middlewares, rutas)
│       ├── config/
│       │   ├── database.js             (conexion a PostgreSQL con pg/knex)
│       │   ├── environment.js          (carga de variables de entorno)
│       │   └── branding.js             (configuracion de marca: colores, fuentes, logo activo)
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── courseRoutes.js
│       │   ├── participantRoutes.js
│       │   ├── certificateRoutes.js
│       │   ├── verificationRoutes.js
│       │   └── brandingRoutes.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── courseController.js
│       │   ├── participantController.js
│       │   ├── certificateController.js
│       │   ├── verificationController.js
│       │   └── brandingController.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Course.js
│       │   ├── Participant.js
│       │   ├── Certificate.js
│       │   ├── BrandingVersion.js
│       │   └── RevocationLog.js
│       ├── services/
│       │   ├── pdfService.js           (genera PDF con Puppeteer)
│       │   ├── qrService.js            (genera codigo QR)
│       │   ├── certificateService.js   (logica de emision/revocacion)
│       │   └── brandingService.js      (gestion de logos versionados)
│       ├── middlewares/
│       │   ├── authMiddleware.js       (verificacion JWT)
│       │   ├── roleMiddleware.js       (control de roles)
│       │   ├── errorHandler.js
│       │   └── validateRequest.js
│       ├── templates/
│       │   └── certificate.html        (plantilla HTML del certificado para PDF)
│       ├── utils/
│       │   ├── hashUtils.js
│       │   ├── tokenUtils.js
│       │   └── fileUtils.js
│       └── storage/                    (montado como volumen Docker)
│           ├── certificates/           (PDFs generados)
│           └── logos/                   (logos versionados: logo_v1.png, logo_v2.png, etc.)
│
└── database/
    ├── init/
    │   └── 01_schema.sql              (esquema inicial de la base de datos)
    └── migrations/
        └── (migraciones incrementales)
```

## 5. Modelo de Datos (Tablas PostgreSQL)

### 5.1 users
- id: SERIAL PRIMARY KEY
- email: VARCHAR(255) UNIQUE NOT NULL
- password_hash: VARCHAR(255) NOT NULL
- full_name: VARCHAR(255) NOT NULL
- role: VARCHAR(50) NOT NULL (admin, emisor, consultor)
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()

### 5.2 courses
- id: SERIAL PRIMARY KEY
- name: VARCHAR(500) NOT NULL
- description: TEXT
- type: VARCHAR(50) NOT NULL (curso, charla, taller)
- duration_hours: INTEGER
- instructor: VARCHAR(255)
- start_date: DATE
- end_date: DATE
- created_by: INTEGER REFERENCES users(id)
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()

### 5.3 participants
- id: SERIAL PRIMARY KEY
- document_id: VARCHAR(50) UNIQUE NOT NULL (cedula/identificacion)
- full_name: VARCHAR(255) NOT NULL
- email: VARCHAR(255)
- organization: VARCHAR(255)
- position: VARCHAR(255)
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()

### 5.4 certificates
- id: SERIAL PRIMARY KEY
- uuid: UUID UNIQUE NOT NULL (identificador publico para verificacion)
- participant_id: INTEGER REFERENCES participants(id)
- course_id: INTEGER REFERENCES courses(id)
- issued_by: INTEGER REFERENCES users(id)
- issue_date: DATE NOT NULL
- branding_version_id: INTEGER REFERENCES branding_versions(id)
- pdf_path: VARCHAR(500)
- status: VARCHAR(50) DEFAULT 'valid' (valid, revoked)
- revocation_reason: TEXT
- revoked_at: TIMESTAMP
- revoked_by: INTEGER REFERENCES users(id)
- created_at: TIMESTAMP DEFAULT NOW()

### 5.5 branding_versions
- id: SERIAL PRIMARY KEY
- version_label: VARCHAR(50) NOT NULL (ej: "v1", "v2")
- logo_path: VARCHAR(500) NOT NULL
- primary_color: VARCHAR(7) NOT NULL (hex)
- secondary_color: VARCHAR(7) NOT NULL (hex)
- font_family: VARCHAR(100) NOT NULL
- organization_name: VARCHAR(255) NOT NULL
- is_active: BOOLEAN DEFAULT false (solo una version activa a la vez)
- created_at: TIMESTAMP DEFAULT NOW()
- created_by: INTEGER REFERENCES users(id)

### 5.6 revocation_log
- id: SERIAL PRIMARY KEY
- certificate_id: INTEGER REFERENCES certificates(id)
- revoked_by: INTEGER REFERENCES users(id)
- reason: TEXT NOT NULL
- revoked_at: TIMESTAMP DEFAULT NOW()

### 5.7 course_participants (tabla intermedia para inscripciones)
- id: SERIAL PRIMARY KEY
- course_id: INTEGER REFERENCES courses(id)
- participant_id: INTEGER REFERENCES participants(id)
- enrollment_date: DATE DEFAULT NOW()
- attendance_status: VARCHAR(50) DEFAULT 'enrolled' (enrolled, completed, absent)
- UNIQUE(course_id, participant_id)

## 6. API REST - Endpoints

### 6.1 Autenticacion
- POST /api/auth/login - Iniciar sesion (devuelve JWT)
- POST /api/auth/logout - Cerrar sesion
- GET /api/auth/me - Obtener usuario actual

### 6.2 Usuarios
- GET /api/users - Listar usuarios (admin)
- POST /api/users - Crear usuario (admin)
- PUT /api/users/:id - Actualizar usuario (admin)
- DELETE /api/users/:id - Desactivar usuario (admin)

### 6.3 Cursos
- GET /api/courses - Listar cursos (con paginacion y filtros)
- GET /api/courses/:id - Detalle de curso
- POST /api/courses - Crear curso
- PUT /api/courses/:id - Actualizar curso
- DELETE /api/courses/:id - Eliminar curso
- GET /api/courses/:id/participants - Listar participantes de un curso
- POST /api/courses/:id/participants - Inscribir participantes a un curso
- PUT /api/courses/:id/participants/:participantId - Actualizar estado de participante

### 6.4 Participantes
- GET /api/participants - Listar participantes (con paginacion y busqueda)
- GET /api/participants/:id - Detalle de participante
- POST /api/participants - Crear participante
- PUT /api/participants/:id - Actualizar participante
- DELETE /api/participants/:id - Eliminar participante
- GET /api/participants/:id/certificates - Certificados de un participante

### 6.5 Certificados
- GET /api/certificates - Listar certificados (con filtros)
- GET /api/certificates/:id - Detalle de certificado
- POST /api/certificates/emit - Emitir certificado(s) para participantes de un curso
- POST /api/certificates/:id/revoke - Revocar certificado
- GET /api/certificates/:id/download - Descargar PDF del certificado

### 6.6 Verificacion (publico, sin autenticacion)
- GET /api/verify/:uuid - Verificar autenticidad de certificado (devuelve datos publicos y estado)

### 6.7 Branding
- GET /api/branding/active - Obtener configuracion de marca activa
- GET /api/branding/versions - Listar versiones de marca
- POST /api/branding/versions - Crear nueva version de marca
- PUT /api/branding/versions/:id/activate - Activar una version de marca
- POST /api/branding/versions/:id/logo - Subir logo para una version

## 7. Flujo de Emision de Certificado

1. El emisor selecciona un curso.
2. El sistema muestra los participantes inscritos con estado "completed".
3. El emisor selecciona los participantes a certificar.
4. Por cada participante seleccionado:
   a. Se genera un UUID unico para el certificado.
   b. Se obtiene la version de branding activa actual.
   c. Se genera el QR con la URL: {BASE_URL}/verificar/{uuid}
   d. Se renderiza la plantilla HTML del certificado con los datos (participante, curso, fecha, QR, logo de la version activa).
   e. Se convierte el HTML a PDF con Puppeteer.
   f. Se almacena el PDF en el volumen persistente.
   g. Se registra el certificado en la base de datos con referencia a la version de branding usada.
5. Se confirma la emision al emisor.

## 8. Flujo de Verificacion

1. Un tercero escanea el QR del certificado o ingresa la URL.
2. El frontend carga la pagina publica de verificacion.
3. Se hace GET /api/verify/{uuid}.
4. El backend busca el certificado por UUID.
5. Si existe y esta valido: muestra datos del certificado, nombre del participante, curso, fecha, y un sello de "CERTIFICADO VALIDO".
6. Si esta revocado: muestra aviso de "CERTIFICADO REVOCADO".
7. Si no existe: muestra "CERTIFICADO NO ENCONTRADO".

## 9. Sistema de Roles

- **admin:** Gestion completa del sistema (usuarios, configuracion, branding).
- **emisor:** Puede crear cursos, gestionar participantes, emitir y revocar certificados.
- **consultor:** Solo lectura. Puede ver cursos, participantes y certificados, pero no modificar nada.

## 10. Seguridad

- Contrasenas hasheadas con bcrypt (salt rounds: 12).
- JWT con expiracion configurable (default: 8 horas).
- Middleware de autenticacion en todas las rutas protegidas.
- Middleware de roles para control de acceso.
- Validacion de entrada en todos los endpoints (express-validator).
- CORS configurado para permitir solo el origen del frontend.
- Helmet para headers de seguridad HTTP.
- Rate limiting en endpoint de login.
- UUID v4 para identificadores publicos de certificados (no expone IDs internos).
