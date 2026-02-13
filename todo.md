# TODO - Lista de Tareas del Proyecto

Cada tarea es una unidad de trabajo que amerita un commit individual. Se deben completar en orden de arriba hacia abajo, respetando las dependencias.

---

## Bloque 1: Infraestructura y Configuracion Inicial

- [x] 1.01 - Crear archivo .env.example con todas las variables de entorno necesarias (DB, JWT, URLs, Vite)
- [x] 1.02 - Crear archivo .gitignore (node_modules, .env, dist, database/data, storage/certificates, storage/logos)
- [x] 1.03 - Crear docker-compose.yml con los 3 servicios (frontend, backend, database) y bind mounts locales para persistencia
- [x] 1.04 - Crear Dockerfile del frontend (node:20-alpine, instalar dependencias, exponer puerto 5173)
- [x] 1.05 - Crear Dockerfile del backend (node:20-alpine, instalar dependencias incluyendo puppeteer, exponer puerto 3000)
- [x] 1.06 - Inicializar proyecto frontend con Vite + React (npm create vite@latest)
- [x] 1.07 - Instalar dependencias del frontend (react-router-dom, axios)
- [x] 1.08 - Crear vite.config.js configurado para hot reload dentro de Docker (host: true)
- [x] 1.09 - Inicializar proyecto backend con npm init y crear package.json
- [x] 1.10 - Instalar dependencias del backend (express, pg, knex, cors, helmet, dotenv, jsonwebtoken, bcrypt, express-validator, puppeteer, qrcode, multer, uuid, morgan, nodemon)
- [x] 1.11 - Crear archivo backend/src/index.js con inicializacion basica de Express
- [x] 1.12 - Crear archivo backend/src/app.js con configuracion de middlewares globales (cors, helmet, json parser, morgan)
- [x] 1.13 - Crear archivo backend/src/config/environment.js para carga de variables de entorno con dotenv
- [x] 1.14 - Crear archivo backend/src/config/database.js con conexion a PostgreSQL usando pg Pool
- [x] 1.15 - Verificar que docker compose up levanta los 3 servicios sin errores
- [x] 1.16 - Verificar que el hot reload funciona en frontend (modificar un archivo y ver el cambio reflejado)
- [x] 1.17 - Verificar que nodemon reinicia el backend al modificar archivos
- [x] 1.18 - Verificar que PostgreSQL acepta conexiones desde el backend

## Bloque 2: Base de Datos - Esquema Inicial

- [x] 2.01 - Crear archivo database/init/01_schema.sql con extension uuid-ossp
- [x] 2.02 - Crear tabla dependencies en 01_schema.sql (id, name, abbreviation, logo_path, is_active, created_at, updated_at)
- [x] 2.03 - Crear tabla users en 01_schema.sql (id, email, password_hash, full_name, role VARCHAR(50) CHECK(role IN ('admin','emisor')), dependency_id REFERENCES dependencies, is_active, timestamps)
- [x] 2.04 - Crear tabla certificate_templates en 01_schema.sql (id, name, slug UNIQUE, description, html_content TEXT, orientation, page_size, thumbnail_path, is_default, is_active, created_at, created_by REFERENCES users)
- [x] 2.05 - Crear tabla courses en 01_schema.sql (id, name, description, type, duration_hours, instructor, start_date, end_date, dependency_id REFERENCES dependencies, created_by REFERENCES users, timestamps)
- [x] 2.06 - Crear tabla course_dependencies en 01_schema.sql (id, course_id REFERENCES courses, dependency_id REFERENCES dependencies, display_order, UNIQUE course_id+dependency_id). Para cursos con multiples dependencias colaboradoras
- [x] 2.07 - Crear tabla participants en 01_schema.sql (id, document_id UNIQUE, full_name, email, organization, position, timestamps)
- [x] 2.08 - Crear tabla branding_versions en 01_schema.sql (id, version_label, logo_path, primary_color, secondary_color, font_family, organization_name, is_active, created_at, created_by REFERENCES users)
- [x] 2.09 - Crear tabla certificates en 01_schema.sql (id, uuid, participant_id, course_id, issued_by, issue_date, branding_version_id, template_id REFERENCES certificate_templates, pdf_path, status, revocation_reason, revoked_at, revoked_by, created_at)
- [x] 2.10 - Crear tabla revocation_log en 01_schema.sql (id, certificate_id, revoked_by, reason, revoked_at)
- [x] 2.11 - Crear tabla course_participants en 01_schema.sql (id, course_id, participant_id, enrollment_date, attendance_status, UNIQUE course_id+participant_id)
- [x] 2.12 - Agregar indices a columnas frecuentemente consultadas (certificates.uuid, participants.document_id, certificates.status, courses.dependency_id, users.dependency_id)
- [x] 2.13 - Insertar dependencia por defecto en 01_schema.sql (Dependencia General)
- [x] 2.14 - Insertar usuario administrador por defecto en 01_schema.sql (admin@admin.com / password hasheado, role=admin, dependency_id=null)
- [x] 2.15 - Insertar version de branding inicial por defecto (colores genericos, fuente Roboto)
- [x] 2.16 - Insertar plantilla de certificado por defecto (HTML/CSS basico horizontal, tamano carta, is_default=true)
- [x] 2.17 - Verificar que las tablas se crean correctamente al levantar el contenedor de PostgreSQL

## Bloque 3: Backend - Utilidades y Middlewares

- [x] 3.01 - Crear backend/src/utils/hashUtils.js con funciones hashPassword y comparePassword (bcrypt)
- [x] 3.02 - Crear backend/src/utils/tokenUtils.js con funciones generateToken y verifyToken (JWT)
- [x] 3.03 - Crear backend/src/utils/fileUtils.js con funciones para manejo de rutas de archivos y lectura de archivos como base64
- [x] 3.04 - Crear backend/src/middlewares/errorHandler.js (middleware global de manejo de errores)
- [x] 3.05 - Crear backend/src/middlewares/authMiddleware.js (extraer y verificar JWT del header Authorization)
- [x] 3.06 - Crear backend/src/middlewares/roleMiddleware.js (verificar que el usuario tiene el rol requerido)
- [x] 3.07 - Crear backend/src/middlewares/dependencyMiddleware.js (filtrar datos segun la dependencia del usuario, admin ve todo, emisor solo su dependencia)
- [x] 3.08 - Crear backend/src/middlewares/validateRequest.js (middleware para validar body/params con express-validator)
- [x] 3.09 - Registrar el errorHandler como ultimo middleware en app.js

## Bloque 4: Backend - Modulo de Autenticacion

- [x] 4.01 - Crear backend/src/models/User.js con metodos: findByEmail, findById, create, update, findAll, findByDependency, deactivate
- [x] 4.02 - Crear backend/src/controllers/authController.js con metodo login (validar credenciales, generar JWT incluyendo dependency_id en el payload)
- [x] 4.03 - Crear backend/src/controllers/authController.js con metodo getMe (devolver datos del usuario autenticado incluyendo dependencia)
- [x] 4.04 - Crear backend/src/routes/authRoutes.js con POST /login y GET /me
- [x] 4.05 - Registrar authRoutes en app.js bajo /api/auth
- [x] 4.06 - Probar login con el usuario admin por defecto y verificar que devuelve JWT valido

## Bloque 5: Backend - Modulo de Usuarios

- [ ] 5.01 - Crear backend/src/controllers/userController.js con metodo listUsers (GET, admin ve todos, emisor ve solo los de su dependencia)
- [ ] 5.02 - Crear backend/src/controllers/userController.js con metodo createUser (POST, solo admin, hashear password, asignar dependency_id)
- [ ] 5.03 - Crear backend/src/controllers/userController.js con metodo updateUser (PUT, solo admin)
- [ ] 5.04 - Crear backend/src/controllers/userController.js con metodo deactivateUser (DELETE, solo admin)
- [ ] 5.05 - Crear backend/src/routes/userRoutes.js con GET /, POST /, PUT /:id, DELETE /:id
- [ ] 5.06 - Aplicar authMiddleware y roleMiddleware(admin) a todas las rutas de usuarios
- [ ] 5.07 - Registrar userRoutes en app.js bajo /api/users
- [ ] 5.08 - Agregar validaciones de entrada en las rutas de usuarios (email valido, password minimo 8 caracteres, rol valido solo admin/emisor, dependency_id requerido para emisor)

## Bloque 6: Backend - Modulo de Dependencias

- [ ] 6.01 - Crear backend/src/models/Dependency.js con metodos: findAll, findById, create, update, deactivate
- [ ] 6.02 - Crear backend/src/controllers/dependencyController.js con metodo listDependencies (GET, todos los usuarios autenticados)
- [ ] 6.03 - Crear backend/src/controllers/dependencyController.js con metodo getDependency (GET /:id)
- [ ] 6.04 - Crear backend/src/controllers/dependencyController.js con metodo createDependency (POST, solo admin)
- [ ] 6.05 - Crear backend/src/controllers/dependencyController.js con metodo updateDependency (PUT /:id, solo admin)
- [ ] 6.06 - Crear backend/src/controllers/dependencyController.js con metodo deactivateDependency (DELETE /:id, solo admin)
- [ ] 6.07 - Crear backend/src/controllers/dependencyController.js con metodo uploadLogo (POST /:id/logo, usando multer, solo admin)
- [ ] 6.08 - Crear backend/src/routes/dependencyRoutes.js con todas las rutas
- [ ] 6.09 - Aplicar authMiddleware a todas las rutas, roleMiddleware(admin) a POST/PUT/DELETE
- [ ] 6.10 - Registrar dependencyRoutes en app.js bajo /api/dependencies
- [ ] 6.11 - Configurar multer para guardar logos de dependencia en storage/logos/dependencies/ con nombre unico

## Bloque 7: Backend - Modulo de Plantillas de Certificado

- [ ] 7.01 - Crear backend/src/models/CertificateTemplate.js con metodos: findAll, findById, findBySlug, findDefault, create, update, deactivate
- [ ] 7.02 - Crear backend/src/templates/default.html con plantilla HTML/CSS por defecto (certificado horizontal, tamano carta, zonas para logos, datos, QR)
- [ ] 7.03 - Crear backend/src/templates/formal.html con plantilla formal (bordes decorativos, tipografia serif)
- [ ] 7.04 - Crear backend/src/templates/modern.html con plantilla moderna (minimalista, colores planos)
- [ ] 7.05 - Crear backend/src/controllers/templateController.js con metodo listTemplates (GET, usuarios autenticados)
- [ ] 7.06 - Crear backend/src/controllers/templateController.js con metodo getTemplate (GET /:id, incluye html_content)
- [ ] 7.07 - Crear backend/src/controllers/templateController.js con metodo createTemplate (POST, solo admin, recibe HTML/CSS)
- [ ] 7.08 - Crear backend/src/controllers/templateController.js con metodo updateTemplate (PUT /:id, solo admin)
- [ ] 7.09 - Crear backend/src/controllers/templateController.js con metodo deactivateTemplate (DELETE /:id, solo admin)
- [ ] 7.10 - Crear backend/src/controllers/templateController.js con metodo previewTemplate (POST /:id/preview, genera PDF con datos de ejemplo y lo devuelve)
- [ ] 7.11 - Crear backend/src/controllers/templateController.js con metodo setDefault (PUT /:id/default, solo admin)
- [ ] 7.12 - Crear backend/src/routes/templateRoutes.js con todas las rutas
- [ ] 7.13 - Aplicar authMiddleware a todas las rutas, roleMiddleware(admin) a POST/PUT/DELETE
- [ ] 7.14 - Registrar templateRoutes en app.js bajo /api/templates

## Bloque 8: Backend - Modulo de Cursos

- [ ] 8.01 - Crear backend/src/models/Course.js con metodos: findAll (con paginacion y filtro por dependency_id), findById, create, update, delete
- [ ] 8.02 - Crear backend/src/models/CourseDependency.js con metodos: findByCourse, addDependency, removeDependency, updateOrder
- [ ] 8.03 - Crear backend/src/controllers/courseController.js con metodo listCourses (GET, admin ve todos, emisor solo los de su dependencia)
- [ ] 8.04 - Crear backend/src/controllers/courseController.js con metodo getCourse (GET /:id, incluye dependencias asociadas)
- [ ] 8.05 - Crear backend/src/controllers/courseController.js con metodo createCourse (POST, asigna dependency_id del usuario creador)
- [ ] 8.06 - Crear backend/src/controllers/courseController.js con metodo updateCourse (PUT /:id, verificar que el curso pertenece a la dependencia del usuario o es admin)
- [ ] 8.07 - Crear backend/src/controllers/courseController.js con metodo deleteCourse (DELETE /:id)
- [ ] 8.08 - Crear backend/src/controllers/courseController.js con metodo addCourseDependency (POST /:id/dependencies, agrega una dependencia colaboradora al curso)
- [ ] 8.09 - Crear backend/src/controllers/courseController.js con metodo removeCourseDependency (DELETE /:id/dependencies/:depId)
- [ ] 8.10 - Crear backend/src/routes/courseRoutes.js con todas las rutas CRUD y rutas de dependencias del curso
- [ ] 8.11 - Aplicar authMiddleware a todas las rutas de cursos
- [ ] 8.12 - Aplicar dependencyMiddleware para filtrar cursos segun dependencia del usuario (admin ve todo)
- [ ] 8.13 - Registrar courseRoutes en app.js bajo /api/courses
- [ ] 8.14 - Agregar validaciones de entrada (nombre requerido, tipo valido, fechas validas, dependency_id valido)

## Bloque 9: Backend - Modulo de Participantes

- [ ] 9.01 - Crear backend/src/models/Participant.js con metodos: findAll (con paginacion y busqueda), findById, findByDocumentId, create, update, delete
- [ ] 9.02 - Crear backend/src/controllers/participantController.js con metodo listParticipants (GET, con paginacion y busqueda por nombre/cedula)
- [ ] 9.03 - Crear backend/src/controllers/participantController.js con metodo getParticipant (GET /:id)
- [ ] 9.04 - Crear backend/src/controllers/participantController.js con metodo createParticipant (POST)
- [ ] 9.05 - Crear backend/src/controllers/participantController.js con metodo updateParticipant (PUT /:id)
- [ ] 9.06 - Crear backend/src/controllers/participantController.js con metodo deleteParticipant (DELETE /:id)
- [ ] 9.07 - Crear backend/src/controllers/participantController.js con metodo getParticipantCertificates (GET /:id/certificates)
- [ ] 9.08 - Crear backend/src/routes/participantRoutes.js con todas las rutas
- [ ] 9.09 - Aplicar authMiddleware y roleMiddleware a las rutas de participantes
- [ ] 9.10 - Registrar participantRoutes en app.js bajo /api/participants
- [ ] 9.11 - Agregar validaciones de entrada (document_id requerido y unico, nombre requerido)

## Bloque 10: Backend - Inscripcion de Participantes a Cursos

- [ ] 10.01 - Crear backend/src/models/CourseParticipant.js con metodos: findByCourse, enroll, updateStatus, remove
- [ ] 10.02 - Crear backend/src/controllers/courseController.js con metodo listCourseParticipants (GET /:id/participants)
- [ ] 10.03 - Crear backend/src/controllers/courseController.js con metodo enrollParticipants (POST /:id/participants, recibe array de participant_ids)
- [ ] 10.04 - Crear backend/src/controllers/courseController.js con metodo updateParticipantStatus (PUT /:id/participants/:participantId, cambiar attendance_status)
- [ ] 10.05 - Agregar las rutas de participantes de curso en courseRoutes.js
- [ ] 10.06 - Agregar validaciones (verificar que el curso existe, que el participante existe, que no esta ya inscrito)

## Bloque 11: Backend - Modulo de Branding

- [ ] 11.01 - Crear backend/src/models/BrandingVersion.js con metodos: findAll, findById, findActive, create, activate, deactivateAll
- [ ] 11.02 - Crear backend/src/config/branding.js para obtener la configuracion de branding activa
- [ ] 11.03 - Crear backend/src/services/brandingService.js con logica para crear version, activar version y subir logo institucional
- [ ] 11.04 - Crear backend/src/controllers/brandingController.js con metodo getActive (GET /active)
- [ ] 11.05 - Crear backend/src/controllers/brandingController.js con metodo listVersions (GET /versions)
- [ ] 11.06 - Crear backend/src/controllers/brandingController.js con metodo createVersion (POST /versions)
- [ ] 11.07 - Crear backend/src/controllers/brandingController.js con metodo activateVersion (PUT /versions/:id/activate)
- [ ] 11.08 - Crear backend/src/controllers/brandingController.js con metodo uploadLogo (POST /versions/:id/logo, usando multer)
- [ ] 11.09 - Crear backend/src/routes/brandingRoutes.js con todas las rutas
- [ ] 11.10 - Aplicar authMiddleware y roleMiddleware(admin) a las rutas de branding (excepto GET /active que es publico)
- [ ] 11.11 - Registrar brandingRoutes en app.js bajo /api/branding
- [ ] 11.12 - Configurar multer para guardar logos institucionales en storage/logos/branding/ con nombre unico

## Bloque 12: Backend - Generacion de QR

- [ ] 12.01 - Crear backend/src/services/qrService.js con funcion generateQR que recibe UUID y devuelve imagen QR en base64
- [ ] 12.02 - La URL del QR debe ser: VERIFICATION_BASE_URL + "/" + uuid
- [ ] 12.03 - Probar que el QR generado es escaneable y apunta a la URL correcta

## Bloque 13: Backend - Generacion de PDF con Plantillas

- [ ] 13.01 - Crear backend/src/services/templateService.js con funcion loadTemplate(templateId) que obtiene el html_content de la plantilla desde BD
- [ ] 13.02 - Crear backend/src/services/templateService.js con funcion resolveLogos(brandingVersion, courseDependencies) que recopila logo institucional + logos de dependencias y los convierte a base64
- [ ] 13.03 - Implementar la inyeccion de variables en la plantilla HTML: datos del participante, curso, fecha, QR, logos, branding
- [ ] 13.04 - Las variables de plantilla incluyen: {{participant_name}}, {{document_id}}, {{course_name}}, {{course_type}}, {{course_duration}}, {{instructor}}, {{issue_date}}, {{certificate_uuid}}, {{qr_code_base64}}, {{institutional_logo_base64}}, {{dependency_logos_html}}, {{primary_color}}, {{secondary_color}}, {{font_family}}, {{organization_name}}, {{dependency_names}}, {{verification_url}}
- [ ] 13.05 - Implementar {{dependency_logos_html}} como bloque HTML con imgs de todos los logos de dependencias del curso, en orden de display_order
- [ ] 13.06 - Crear backend/src/services/pdfService.js con funcion generatePDF que recibe html renderizado y opciones (orientacion, tamano pagina) y devuelve PDF como buffer
- [ ] 13.07 - Implementar la conversion de HTML a PDF con Puppeteer (tamano y orientacion segun la plantilla seleccionada)
- [ ] 13.08 - Puppeteer debe usar viewport fijo (ej: 1056x816 para carta horizontal) para garantizar renderizado consistente independiente de zoom
- [ ] 13.09 - Implementar el guardado del PDF en el volumen persistente (storage/certificates/)
- [ ] 13.10 - Nombrar el archivo PDF con formato: certificate_{uuid}.pdf
- [ ] 13.11 - Probar generacion de PDF completo con datos de prueba, verificar que logos multiples se renderizan correctamente
- [ ] 13.12 - Probar generacion con cada plantilla por defecto (default, formal, modern)

## Bloque 14: Backend - Modulo de Certificados (Emision)

- [ ] 14.01 - Crear backend/src/models/Certificate.js con metodos: findAll (con paginacion, filtros por curso/participante/estado/dependencia), findById, findByUuid, create, revoke
- [ ] 14.02 - Crear backend/src/services/certificateService.js con funcion emitCertificate (genera UUID, obtiene branding activo, obtiene logos de dependencias del curso, obtiene plantilla, genera QR, genera PDF, guarda en BD)
- [ ] 14.03 - Crear backend/src/services/certificateService.js con funcion emitBulkCertificates (emitir para multiples participantes de un curso con la misma plantilla)
- [ ] 14.04 - Crear backend/src/controllers/certificateController.js con metodo listCertificates (GET, admin ve todos, emisor solo los de su dependencia)
- [ ] 14.05 - Crear backend/src/controllers/certificateController.js con metodo getCertificate (GET /:id)
- [ ] 14.06 - Crear backend/src/controllers/certificateController.js con metodo emitCertificates (POST /emit, recibe course_id, participant_ids y template_id)
- [ ] 14.07 - Crear backend/src/controllers/certificateController.js con metodo downloadCertificate (GET /:id/download, envia el PDF)
- [ ] 14.08 - Validar que los participantes seleccionados tienen attendance_status = 'completed' antes de emitir
- [ ] 14.09 - Validar que no exista ya un certificado valido para el mismo participante y curso
- [ ] 14.10 - Validar que el usuario emisor tiene acceso al curso (es de su dependencia o es admin)
- [ ] 14.11 - Crear backend/src/routes/certificateRoutes.js con las rutas de emision y consulta
- [ ] 14.12 - Aplicar authMiddleware, roleMiddleware y dependencyMiddleware a las rutas de certificados
- [ ] 14.13 - Registrar certificateRoutes en app.js bajo /api/certificates

## Bloque 15: Backend - Modulo de Certificados (Revocacion)

- [ ] 15.01 - Crear backend/src/models/RevocationLog.js con metodos: create, findByCertificate
- [ ] 15.02 - Crear backend/src/services/certificateService.js con funcion revokeCertificate (cambiar status, registrar en log)
- [ ] 15.03 - Crear backend/src/controllers/certificateController.js con metodo revokeCertificate (POST /:id/revoke, requiere reason)
- [ ] 15.04 - Agregar la ruta de revocacion en certificateRoutes.js
- [ ] 15.05 - Validar que solo se pueden revocar certificados con status 'valid'
- [ ] 15.06 - Validar que se proporciona una razon de revocacion
- [ ] 15.07 - Validar que el usuario tiene permiso para revocar (admin o emisor de la misma dependencia)

## Bloque 16: Backend - Modulo de Verificacion Publica

- [ ] 16.01 - Crear backend/src/controllers/verificationController.js con metodo verifyCertificate (GET /:uuid)
- [ ] 16.02 - El endpoint debe ser publico (sin authMiddleware)
- [ ] 16.03 - Si el certificado existe y es valido: devolver datos publicos (nombre participante, curso, fecha, estado "VALIDO", logos de dependencias)
- [ ] 16.04 - Si el certificado esta revocado: devolver estado "REVOCADO" con fecha de revocacion
- [ ] 16.05 - Si el UUID no existe: devolver 404 con mensaje "CERTIFICADO NO ENCONTRADO"
- [ ] 16.06 - Incluir la version de branding con la que fue emitido (para mostrar logo institucional correcto)
- [ ] 16.07 - Incluir los logos de las dependencias del curso (de la tabla course_dependencies)
- [ ] 16.08 - Crear backend/src/routes/verificationRoutes.js con GET /:uuid
- [ ] 16.09 - Registrar verificationRoutes en app.js bajo /api/verify

## Bloque 17: Backend - Estadisticas y Panel Admin

- [ ] 17.01 - Crear backend/src/controllers/statsController.js con metodo getGlobalStats (GET /api/stats, solo admin: totales globales de cursos, participantes, certificados emitidos, certificados revocados, total por dependencia)
- [ ] 17.02 - Crear backend/src/controllers/statsController.js con metodo getDependencyStats (GET /api/stats/dependency/:id, estadisticas de una dependencia especifica)
- [ ] 17.03 - Crear backend/src/controllers/statsController.js con metodo getMyStats (GET /api/stats/me, estadisticas de la dependencia del usuario actual)
- [ ] 17.04 - Crear endpoint GET /api/admin/events (solo admin, lista global de todos los cursos/eventos con filtros por dependencia, fecha, tipo)
- [ ] 17.05 - Crear endpoint GET /api/admin/certificates (solo admin, lista global de todos los certificados con filtros por dependencia, estado, fecha, curso)
- [ ] 17.06 - Crear endpoint GET /api/admin/activity (solo admin, registro de actividad reciente: emisiones, revocaciones, creacion de cursos, cambios de branding)
- [ ] 17.07 - Crear backend/src/routes/statsRoutes.js y backend/src/routes/adminRoutes.js
- [ ] 17.08 - Registrar statsRoutes en app.js bajo /api/stats y adminRoutes bajo /api/admin

## Bloque 18: Frontend - Configuracion Base

- [ ] 18.01 - Crear frontend/src/config/theme.js con colores, fuentes y titulo de la aplicacion
- [ ] 18.02 - Crear frontend/src/styles/global.css con reset CSS y estilos base (tipografia, colores desde theme)
- [ ] 18.03 - Importar global.css en main.jsx
- [ ] 18.04 - Crear frontend/src/services/api.js con instancia de Axios configurada (baseURL desde env, interceptores para JWT)
- [ ] 18.05 - Configurar interceptor de Axios para agregar token JWT en header Authorization
- [ ] 18.06 - Configurar interceptor de Axios para redirigir a login si recibe 401

## Bloque 19: Frontend - Autenticacion

- [ ] 19.01 - Crear frontend/src/context/AuthContext.jsx con estado de usuario (incluyendo dependency_id y role), token y funciones login/logout
- [ ] 19.02 - Crear frontend/src/hooks/useAuth.js para acceder al contexto de autenticacion
- [ ] 19.03 - Crear frontend/src/services/authService.js con funciones login(email, password) y getMe()
- [ ] 19.04 - Almacenar el JWT en localStorage al hacer login
- [ ] 19.05 - Al cargar la app, verificar si hay token en localStorage y validarlo con GET /api/auth/me
- [ ] 19.06 - Crear frontend/src/components/auth/LoginForm.jsx (formulario con email y password)
- [ ] 19.07 - Crear frontend/src/pages/LoginPage.jsx (pagina completa de login con el formulario centrado)
- [ ] 19.08 - Implementar manejo de errores en login (credenciales incorrectas, error de servidor)
- [ ] 19.09 - Crear frontend/src/components/auth/ProtectedRoute.jsx (componente que redirige a login si no hay usuario autenticado)
- [ ] 19.10 - Crear frontend/src/components/auth/AdminRoute.jsx (componente que verifica que el usuario es admin y redirige si no lo es)

## Bloque 20: Frontend - Layout y Navegacion

- [ ] 20.01 - Crear frontend/src/components/layout/Header.jsx (barra superior con titulo de la app, nombre del usuario, nombre de la dependencia, boton de logout)
- [ ] 20.02 - Crear frontend/src/components/layout/Sidebar.jsx (menu lateral con enlaces segun rol)
- [ ] 20.03 - Menu admin: Dashboard Global, Dependencias, Plantillas, Usuarios, Cursos, Participantes, Certificados, Emitir, Configuracion
- [ ] 20.04 - Menu emisor: Dashboard, Cursos (de su dependencia), Participantes, Certificados (de su dependencia), Emitir
- [ ] 20.06 - Crear frontend/src/components/layout/Footer.jsx (pie de pagina simple)
- [ ] 20.07 - Crear layout principal que combine Header + Sidebar + contenido principal + Footer
- [ ] 20.08 - Configurar React Router en App.jsx con todas las rutas protegidas y publicas
- [ ] 20.09 - Ruta publica: /verificar/:uuid (pagina de verificacion)
- [ ] 20.10 - Ruta publica: /login (pagina de login)
- [ ] 20.11 - Rutas protegidas generales: /dashboard, /cursos, /participantes, /certificados, /emitir
- [ ] 20.12 - Rutas solo admin: /admin/dependencias, /admin/plantillas, /admin/usuarios, /admin/eventos, /admin/certificados-global, /admin/actividad, /configuracion
- [ ] 20.13 - Implementar navegacion activa en el sidebar (resaltar la opcion actual)

## Bloque 21: Frontend - Componentes UI Reutilizables

- [ ] 21.01 - Crear frontend/src/components/ui/Button.jsx (botones con variantes: primary, secondary, danger, ghost)
- [ ] 21.02 - Crear frontend/src/components/ui/Input.jsx (input con label, placeholder, validacion visual de error)
- [ ] 21.03 - Crear frontend/src/components/ui/Modal.jsx (modal generico con overlay, titulo, contenido y botones)
- [ ] 21.04 - Crear frontend/src/components/ui/Table.jsx (tabla generica con headers, filas y soporte para acciones)
- [ ] 21.05 - Crear frontend/src/components/ui/SearchBar.jsx (barra de busqueda con icono y debounce)
- [ ] 21.06 - Crear frontend/src/components/ui/Pagination.jsx (controles de paginacion: anterior, paginas, siguiente)
- [ ] 21.07 - Crear frontend/src/components/ui/Alert.jsx (mensajes de exito, error, advertencia e informacion)
- [ ] 21.08 - Crear frontend/src/components/ui/Select.jsx (selector dropdown reutilizable)
- [ ] 21.09 - Crear frontend/src/components/ui/Badge.jsx (etiquetas de estado: activo, revocado, pendiente)
- [ ] 21.10 - Crear frontend/src/hooks/useFetch.js (hook generico para peticiones con estado de loading, data, error)

## Bloque 22: Frontend - Dashboard

- [ ] 22.01 - Crear frontend/src/pages/DashboardPage.jsx con estructura basica
- [ ] 22.02 - Dashboard admin: tarjetas de resumen global (total cursos, participantes, certificados emitidos, revocados), desglose por dependencia
- [ ] 22.03 - Dashboard emisor: tarjetas de resumen de su dependencia (cursos, participantes, certificados)
- [ ] 22.04 - Conectar DashboardPage con los endpoints de stats correspondientes segun rol

## Bloque 23: Frontend - Modulo de Cursos

- [ ] 23.01 - Crear frontend/src/services/courseService.js con funciones: getCourses, getCourse, createCourse, updateCourse, deleteCourse, getCourseParticipants, enrollParticipants, updateParticipantStatus, addCourseDependency, removeCourseDependency
- [ ] 23.02 - Crear frontend/src/pages/CoursesPage.jsx con lista de cursos, busqueda y paginacion (filtrada por dependencia segun rol)
- [ ] 23.03 - Crear frontend/src/components/courses/CourseList.jsx (tabla de cursos con columnas: nombre, tipo, dependencia, duracion, instructor, fechas, acciones)
- [ ] 23.04 - Agregar boton "Nuevo Curso" que abre formulario de creacion (solo emisor y admin)
- [ ] 23.05 - Crear frontend/src/components/courses/CourseForm.jsx (formulario con campos: nombre, descripcion, tipo, duracion, instructor, fecha inicio, fecha fin)
- [ ] 23.06 - Implementar validacion del formulario de curso (campos requeridos, fechas coherentes)
- [ ] 23.07 - Implementar creacion de curso (enviar POST y actualizar lista)
- [ ] 23.08 - Implementar edicion de curso (cargar datos existentes, enviar PUT y actualizar lista)
- [ ] 23.09 - Implementar eliminacion de curso con modal de confirmacion
- [ ] 23.10 - Crear frontend/src/components/courses/CourseDetail.jsx (vista detallada con participantes y dependencias asociadas)
- [ ] 23.11 - Mostrar lista de dependencias colaboradoras en el detalle del curso con sus logos
- [ ] 23.12 - Agregar funcionalidad para asociar/desasociar dependencias colaboradoras al curso (solo admin o emisor dueno)
- [ ] 23.13 - Mostrar lista de participantes inscritos con su estado de asistencia
- [ ] 23.14 - Agregar funcionalidad para inscribir participantes existentes al curso
- [ ] 23.15 - Agregar funcionalidad para cambiar el estado de asistencia de un participante
- [ ] 23.16 - Agregar filtros en la lista de cursos (por tipo, por dependencia, por rango de fechas)

## Bloque 24: Frontend - Modulo de Participantes

- [ ] 24.01 - Crear frontend/src/services/participantService.js con funciones: getParticipants, getParticipant, createParticipant, updateParticipant, deleteParticipant, getParticipantCertificates
- [ ] 24.02 - Crear frontend/src/pages/ParticipantsPage.jsx con lista de participantes, busqueda y paginacion
- [ ] 24.03 - Crear frontend/src/components/participants/ParticipantList.jsx (tabla con columnas: cedula, nombre, email, organizacion, cargo, acciones)
- [ ] 24.04 - Agregar boton "Nuevo Participante" que abre formulario de creacion
- [ ] 24.05 - Crear frontend/src/components/participants/ParticipantForm.jsx (formulario para crear/editar participante)
- [ ] 24.06 - Implementar validacion del formulario de participante (cedula requerida y unica, nombre requerido)
- [ ] 24.07 - Implementar creacion de participante
- [ ] 24.08 - Implementar edicion de participante
- [ ] 24.09 - Implementar eliminacion de participante con modal de confirmacion
- [ ] 24.10 - Crear frontend/src/components/participants/ParticipantDetail.jsx (vista detallada con historial de certificados)
- [ ] 24.11 - Mostrar lista de certificados del participante en la vista de detalle
- [ ] 24.12 - Agregar busqueda de participantes por nombre o cedula

## Bloque 25: Frontend - Modulo de Certificados

- [ ] 25.01 - Crear frontend/src/services/certificateService.js con funciones: getCertificates, getCertificate, emitCertificates, revokeCertificate, downloadCertificate
- [ ] 25.02 - Crear frontend/src/pages/CertificatesPage.jsx con lista de certificados, filtros y paginacion (filtrada por dependencia segun rol)
- [ ] 25.03 - Crear frontend/src/components/certificates/CertificateList.jsx (tabla con columnas: UUID, participante, curso, dependencia, fecha emision, plantilla usada, estado, acciones)
- [ ] 25.04 - Agregar filtros en la lista de certificados (por estado, por curso, por participante, por dependencia, por plantilla)
- [ ] 25.05 - Crear frontend/src/components/certificates/CertificateDetail.jsx (vista detallada de un certificado)
- [ ] 25.06 - Mostrar informacion completa: participante, curso, fecha, estado, plantilla usada, version de branding, dependencias con sus logos
- [ ] 25.07 - Agregar boton "Descargar PDF" en la vista de detalle del certificado
- [ ] 25.08 - Implementar descarga de PDF (abrir en nueva pestana o descargar archivo)
- [ ] 25.09 - Agregar boton "Revocar" en la vista de detalle (solo si estado es valido y usuario tiene permiso)
- [ ] 25.10 - Implementar modal de revocacion con campo para escribir la razon
- [ ] 25.11 - Implementar la revocacion y actualizar la vista

## Bloque 26: Frontend - Pagina de Emision de Certificados

- [ ] 26.01 - Crear frontend/src/pages/EmitCertificatePage.jsx con estructura basica
- [ ] 26.02 - Paso 1: Selector de curso (dropdown o busqueda, filtrado por dependencia del usuario o todos si es admin)
- [ ] 26.03 - Paso 2: Al seleccionar curso, mostrar participantes con attendance_status = 'completed' que NO tengan ya certificado para ese curso
- [ ] 26.04 - Paso 3: Selector de plantilla de certificado (dropdown con preview del thumbnail de cada plantilla)
- [ ] 26.05 - Paso 4: Checkboxes para seleccionar participantes a certificar (opcion de seleccionar todos)
- [ ] 26.06 - Paso 5: Vista previa opcional (boton para generar preview con datos del primer participante seleccionado)
- [ ] 26.07 - Paso 6: Boton "Emitir Certificados" con modal de confirmacion que muestre resumen (curso, plantilla, cantidad de participantes, dependencias)
- [ ] 26.08 - Implementar llamada al endpoint POST /api/certificates/emit con course_id, participant_ids y template_id
- [ ] 26.09 - Mostrar estado de progreso durante la emision (loading)
- [ ] 26.10 - Mostrar resultado de la emision (exito con cantidad emitida o errores)
- [ ] 26.11 - Agregar enlace a EmitCertificatePage desde el sidebar y desde el detalle de un curso

## Bloque 27: Frontend - Pagina de Verificacion Publica

- [ ] 27.01 - Crear frontend/src/pages/VerifyPage.jsx con estructura basica (sin layout de admin, pagina publica independiente)
- [ ] 27.02 - Extraer el UUID de la URL (/verificar/:uuid)
- [ ] 27.03 - Llamar al endpoint GET /api/verify/:uuid al cargar la pagina
- [ ] 27.04 - Si el certificado es valido: mostrar datos del certificado con sello visual "CERTIFICADO VALIDO" en verde
- [ ] 27.05 - Si el certificado esta revocado: mostrar aviso "CERTIFICADO REVOCADO" en rojo con fecha de revocacion
- [ ] 27.06 - Si no se encuentra: mostrar "CERTIFICADO NO ENCONTRADO"
- [ ] 27.07 - Mostrar el logo institucional de la version de branding con la que fue emitido el certificado
- [ ] 27.08 - Mostrar los logos de las dependencias del curso
- [ ] 27.09 - Mostrar datos: nombre del participante, curso, tipo de curso, duracion, instructor, fecha de emision, dependencias participantes
- [ ] 27.10 - Disenar la pagina con aspecto profesional y confiable (sin necesidad de login)
- [ ] 27.11 - Asegurar que la pagina es responsive (se ve bien en movil, ya que el QR se escanea con celular)

## Bloque 28: Frontend - Panel de Administracion Global (Solo Admin)

- [ ] 28.01 - Crear frontend/src/pages/admin/DependenciesPage.jsx con CRUD de dependencias (crear, editar, desactivar, subir logo)
- [ ] 28.02 - Crear frontend/src/components/admin/DependencyForm.jsx (formulario con nombre, abreviatura, logo)
- [ ] 28.03 - Crear frontend/src/components/admin/DependencyList.jsx (tabla con nombre, abreviatura, logo, estado, cantidad de usuarios, cantidad de cursos)
- [ ] 28.04 - Crear frontend/src/pages/admin/TemplatesPage.jsx con gestion de plantillas de certificado
- [ ] 28.05 - Crear frontend/src/components/admin/TemplateList.jsx (tabla con nombre, orientacion, tamano, preview thumbnail, estado, es_default)
- [ ] 28.06 - Crear frontend/src/components/admin/TemplateForm.jsx (formulario con nombre, slug, descripcion, editor HTML/CSS, orientacion, tamano)
- [ ] 28.07 - Agregar boton "Preview" en el formulario de plantilla que genera un PDF de ejemplo con datos ficticios
- [ ] 28.08 - Crear frontend/src/pages/admin/GlobalEventsPage.jsx (lista global de todos los cursos/eventos de todas las dependencias con filtros)
- [ ] 28.09 - Crear frontend/src/pages/admin/GlobalCertificatesPage.jsx (lista global de todos los certificados de todas las dependencias con filtros)
- [ ] 28.10 - Crear frontend/src/pages/admin/ActivityLogPage.jsx (registro de actividad reciente del sistema: emisiones, revocaciones, etc.)
- [ ] 28.11 - Crear frontend/src/pages/admin/UsersPage.jsx (gestion de usuarios: crear, editar, asignar dependencia, cambiar rol, desactivar)
- [ ] 28.12 - Crear frontend/src/components/admin/UserForm.jsx (formulario con email, nombre, password, rol, dependencia)

## Bloque 29: Frontend - Configuracion (Admin)

- [ ] 29.01 - Crear frontend/src/pages/SettingsPage.jsx con estructura basica (solo accesible por admin)
- [ ] 29.02 - Seccion de gestion de branding institucional: mostrar version activa actual (logo, colores, fuente, nombre organizacion)
- [ ] 29.03 - Formulario para crear nueva version de branding (subir logo institucional, definir colores, fuente, nombre organizacion)
- [ ] 29.04 - Historial de versiones de branding con opcion de activar una version anterior
- [ ] 29.05 - Preview visual de como se vera el branding institucional en un certificado

## Bloque 30: Frontend - Manejo de Errores y UX

- [ ] 30.01 - Crear frontend/src/pages/NotFoundPage.jsx (pagina 404 para rutas no encontradas)
- [ ] 30.02 - Crear frontend/src/pages/UnauthorizedPage.jsx (pagina 403 para acceso denegado por rol)
- [ ] 30.03 - Implementar notificaciones toast para acciones exitosas (certificado emitido, curso creado, etc.)
- [ ] 30.04 - Implementar indicadores de carga (spinners/skeletons) durante peticiones al backend
- [ ] 30.05 - Implementar manejo de errores de red (mostrar mensaje cuando el backend no responde)
- [ ] 30.06 - Implementar confirmacion antes de acciones destructivas (eliminar, revocar)

## Bloque 31: Seguridad y Validaciones Finales

- [ ] 31.01 - Agregar rate limiting en el endpoint POST /api/auth/login (express-rate-limit)
- [ ] 31.02 - Verificar que todos los endpoints protegidos requieren autenticacion
- [ ] 31.03 - Verificar que las rutas de admin solo son accesibles por usuarios con rol admin
- [ ] 31.04 - Verificar que emisor solo puede acceder a datos de su dependencia
- [ ] 31.06 - Verificar que la pagina de verificacion es accesible sin autenticacion
- [ ] 31.07 - Verificar que no se exponen IDs internos en la API publica de verificacion
- [ ] 31.08 - Verificar que los PDFs no son accesibles directamente por URL (solo via endpoint autenticado)
- [ ] 31.09 - Verificar que CORS solo permite el origen del frontend

## Bloque 32: Pruebas de Integracion Manual

- [ ] 32.01 - Probar flujo completo: login como admin
- [ ] 32.02 - Probar flujo completo: crear dependencias y asignar logos
- [ ] 32.03 - Probar flujo completo: crear usuarios con diferentes roles y asignar dependencias
- [ ] 32.04 - Probar flujo completo: crear un curso asociado a una dependencia
- [ ] 32.05 - Probar flujo completo: asociar una segunda dependencia colaboradora al curso
- [ ] 32.06 - Probar flujo completo: crear participantes
- [ ] 32.07 - Probar flujo completo: inscribir participantes al curso
- [ ] 32.08 - Probar flujo completo: marcar participantes como 'completed'
- [ ] 32.09 - Probar flujo completo: seleccionar plantilla y emitir certificados
- [ ] 32.10 - Probar flujo completo: verificar que el PDF se genero con los logos de ambas dependencias, logo institucional y QR
- [ ] 32.11 - Probar flujo completo: escanear el QR y verificar que la pagina de verificacion funciona y muestra todos los logos
- [ ] 32.12 - Probar flujo completo: revocar un certificado y verificar que la pagina de verificacion muestra "REVOCADO"
- [ ] 32.13 - Probar flujo completo: cambiar version de branding y emitir nuevos certificados (verificar que los anteriores conservan el branding viejo)
- [ ] 32.14 - Probar flujo completo: login como emisor y verificar que solo ve datos de su dependencia
- [ ] 32.15 - Probar flujo completo: verificar que emisor no puede acceder a datos de otra dependencia
- [ ] 32.16 - Probar flujo completo: admin ve panel global de eventos, certificados y actividad
- [ ] 32.17 - Probar flujo completo: emitir con plantilla "formal" y con plantilla "modern", comparar PDFs
- [ ] 32.18 - Probar flujo completo: detener y reiniciar Docker y verificar que los datos persisten

## Bloque 33: Produccion

- [ ] 33.01 - Crear docker-compose.prod.yml con configuracion de produccion (sin hot reload, build optimizado)
- [ ] 33.02 - Crear Dockerfile de produccion del frontend (build con Vite + servir con nginx)
- [ ] 33.03 - Crear Dockerfile de produccion del backend (sin nodemon, con NODE_ENV=production)
- [ ] 33.04 - Configurar nginx como reverse proxy para servir frontend y proxear /api al backend
- [ ] 33.05 - Documentar el proceso de despliegue en produccion en el readme.md
- [ ] 33.06 - Documentar el proceso de respaldo y restauracion en el readme.md
