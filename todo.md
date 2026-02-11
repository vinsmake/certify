# TODO - Lista de Tareas del Proyecto

Cada tarea es una unidad de trabajo que amerita un commit individual. Se deben completar en orden de arriba hacia abajo, respetando las dependencias.

---

## Bloque 1: Infraestructura y Configuracion Inicial

- [ ] 1.01 - Crear archivo .env.example con todas las variables de entorno necesarias (DB, JWT, URLs, Vite)
- [ ] 1.02 - Crear archivo .gitignore (node_modules, .env, dist, storage/certificates, pgdata)
- [ ] 1.03 - Crear docker-compose.yml con los 3 servicios (frontend, backend, database) y volumenes persistentes
- [ ] 1.04 - Crear Dockerfile del frontend (node:20-alpine, instalar dependencias, exponer puerto 5173)
- [ ] 1.05 - Crear Dockerfile del backend (node:20-alpine, instalar dependencias incluyendo puppeteer, exponer puerto 3000)
- [ ] 1.06 - Inicializar proyecto frontend con Vite + React (npm create vite@latest)
- [ ] 1.07 - Instalar dependencias del frontend (react-router-dom, axios)
- [ ] 1.08 - Crear vite.config.js configurado para hot reload dentro de Docker (host: true)
- [ ] 1.09 - Inicializar proyecto backend con npm init y crear package.json
- [ ] 1.10 - Instalar dependencias del backend (express, pg, knex, cors, helmet, dotenv, jsonwebtoken, bcrypt, express-validator, puppeteer, qrcode, multer, uuid, morgan, nodemon)
- [ ] 1.11 - Crear archivo backend/src/index.js con inicializacion basica de Express
- [ ] 1.12 - Crear archivo backend/src/app.js con configuracion de middlewares globales (cors, helmet, json parser, morgan)
- [ ] 1.13 - Crear archivo backend/src/config/environment.js para carga de variables de entorno con dotenv
- [ ] 1.14 - Crear archivo backend/src/config/database.js con conexion a PostgreSQL usando pg Pool
- [ ] 1.15 - Verificar que docker compose up levanta los 3 servicios sin errores
- [ ] 1.16 - Verificar que el hot reload funciona en frontend (modificar un archivo y ver el cambio reflejado)
- [ ] 1.17 - Verificar que nodemon reinicia el backend al modificar archivos
- [ ] 1.18 - Verificar que PostgreSQL acepta conexiones desde el backend

## Bloque 2: Base de Datos - Esquema Inicial

- [ ] 2.01 - Crear archivo database/init/01_schema.sql con extension uuid-ossp
- [ ] 2.02 - Crear tabla users en 01_schema.sql (id, email, password_hash, full_name, role, is_active, timestamps)
- [ ] 2.03 - Crear tabla courses en 01_schema.sql (id, name, description, type, duration_hours, instructor, start_date, end_date, created_by, timestamps)
- [ ] 2.04 - Crear tabla participants en 01_schema.sql (id, document_id, full_name, email, organization, position, timestamps)
- [ ] 2.05 - Crear tabla branding_versions en 01_schema.sql (id, version_label, logo_path, primary_color, secondary_color, font_family, organization_name, is_active, created_at, created_by)
- [ ] 2.06 - Crear tabla certificates en 01_schema.sql (id, uuid, participant_id, course_id, issued_by, issue_date, branding_version_id, pdf_path, status, revocation_reason, revoked_at, revoked_by, created_at)
- [ ] 2.07 - Crear tabla revocation_log en 01_schema.sql (id, certificate_id, revoked_by, reason, revoked_at)
- [ ] 2.08 - Crear tabla course_participants en 01_schema.sql (id, course_id, participant_id, enrollment_date, attendance_status, unique constraint)
- [ ] 2.09 - Agregar indices a columnas frecuentemente consultadas (certificates.uuid, participants.document_id, certificates.status)
- [ ] 2.10 - Insertar usuario administrador por defecto en 01_schema.sql (admin@admin.com / password hasheado)
- [ ] 2.11 - Insertar version de branding inicial por defecto (colores genericos, fuente Roboto)
- [ ] 2.12 - Verificar que las tablas se crean correctamente al levantar el contenedor de PostgreSQL

## Bloque 3: Backend - Utilidades y Middlewares

- [ ] 3.01 - Crear backend/src/utils/hashUtils.js con funciones hashPassword y comparePassword (bcrypt)
- [ ] 3.02 - Crear backend/src/utils/tokenUtils.js con funciones generateToken y verifyToken (JWT)
- [ ] 3.03 - Crear backend/src/utils/fileUtils.js con funciones para manejo de rutas de archivos y lectura de archivos como base64
- [ ] 3.04 - Crear backend/src/middlewares/errorHandler.js (middleware global de manejo de errores)
- [ ] 3.05 - Crear backend/src/middlewares/authMiddleware.js (extraer y verificar JWT del header Authorization)
- [ ] 3.06 - Crear backend/src/middlewares/roleMiddleware.js (verificar que el usuario tiene el rol requerido)
- [ ] 3.07 - Crear backend/src/middlewares/validateRequest.js (middleware para validar body/params con express-validator)
- [ ] 3.08 - Registrar el errorHandler como ultimo middleware en app.js

## Bloque 4: Backend - Modulo de Autenticacion

- [ ] 4.01 - Crear backend/src/models/User.js con metodos: findByEmail, findById, create, update, findAll, deactivate
- [ ] 4.02 - Crear backend/src/controllers/authController.js con metodo login (validar credenciales, generar JWT)
- [ ] 4.03 - Crear backend/src/controllers/authController.js con metodo getMe (devolver datos del usuario autenticado)
- [ ] 4.04 - Crear backend/src/routes/authRoutes.js con POST /login y GET /me
- [ ] 4.05 - Registrar authRoutes en app.js bajo /api/auth
- [ ] 4.06 - Probar login con el usuario admin por defecto y verificar que devuelve JWT valido

## Bloque 5: Backend - Modulo de Usuarios

- [ ] 5.01 - Crear backend/src/controllers/userController.js con metodo listUsers (GET, solo admin)
- [ ] 5.02 - Crear backend/src/controllers/userController.js con metodo createUser (POST, solo admin, hashear password)
- [ ] 5.03 - Crear backend/src/controllers/userController.js con metodo updateUser (PUT, solo admin)
- [ ] 5.04 - Crear backend/src/controllers/userController.js con metodo deactivateUser (DELETE, solo admin)
- [ ] 5.05 - Crear backend/src/routes/userRoutes.js con GET /, POST /, PUT /:id, DELETE /:id
- [ ] 5.06 - Aplicar authMiddleware y roleMiddleware(admin) a todas las rutas de usuarios
- [ ] 5.07 - Registrar userRoutes en app.js bajo /api/users
- [ ] 5.08 - Agregar validaciones de entrada en las rutas de usuarios (email valido, password minimo 8 caracteres, rol valido)

## Bloque 6: Backend - Modulo de Cursos

- [ ] 6.01 - Crear backend/src/models/Course.js con metodos: findAll (con paginacion), findById, create, update, delete
- [ ] 6.02 - Crear backend/src/controllers/courseController.js con metodo listCourses (GET, con paginacion y filtros por tipo/nombre)
- [ ] 6.03 - Crear backend/src/controllers/courseController.js con metodo getCourse (GET /:id)
- [ ] 6.04 - Crear backend/src/controllers/courseController.js con metodo createCourse (POST)
- [ ] 6.05 - Crear backend/src/controllers/courseController.js con metodo updateCourse (PUT /:id)
- [ ] 6.06 - Crear backend/src/controllers/courseController.js con metodo deleteCourse (DELETE /:id)
- [ ] 6.07 - Crear backend/src/routes/courseRoutes.js con todas las rutas CRUD
- [ ] 6.08 - Aplicar authMiddleware a todas las rutas de cursos
- [ ] 6.09 - Aplicar roleMiddleware para que consultor solo pueda hacer GET
- [ ] 6.10 - Registrar courseRoutes en app.js bajo /api/courses
- [ ] 6.11 - Agregar validaciones de entrada (nombre requerido, tipo valido, fechas validas)

## Bloque 7: Backend - Modulo de Participantes

- [ ] 7.01 - Crear backend/src/models/Participant.js con metodos: findAll (con paginacion y busqueda), findById, findByDocumentId, create, update, delete
- [ ] 7.02 - Crear backend/src/controllers/participantController.js con metodo listParticipants (GET, con paginacion y busqueda por nombre/cedula)
- [ ] 7.03 - Crear backend/src/controllers/participantController.js con metodo getParticipant (GET /:id)
- [ ] 7.04 - Crear backend/src/controllers/participantController.js con metodo createParticipant (POST)
- [ ] 7.05 - Crear backend/src/controllers/participantController.js con metodo updateParticipant (PUT /:id)
- [ ] 7.06 - Crear backend/src/controllers/participantController.js con metodo deleteParticipant (DELETE /:id)
- [ ] 7.07 - Crear backend/src/controllers/participantController.js con metodo getParticipantCertificates (GET /:id/certificates)
- [ ] 7.08 - Crear backend/src/routes/participantRoutes.js con todas las rutas
- [ ] 7.09 - Aplicar authMiddleware y roleMiddleware a las rutas de participantes
- [ ] 7.10 - Registrar participantRoutes en app.js bajo /api/participants
- [ ] 7.11 - Agregar validaciones de entrada (document_id requerido y unico, nombre requerido)

## Bloque 8: Backend - Inscripcion de Participantes a Cursos

- [ ] 8.01 - Crear backend/src/models/CourseParticipant.js con metodos: findByCourse, enroll, updateStatus, remove
- [ ] 8.02 - Crear backend/src/controllers/courseController.js con metodo listCourseParticipants (GET /:id/participants)
- [ ] 8.03 - Crear backend/src/controllers/courseController.js con metodo enrollParticipants (POST /:id/participants, recibe array de participant_ids)
- [ ] 8.04 - Crear backend/src/controllers/courseController.js con metodo updateParticipantStatus (PUT /:id/participants/:participantId, cambiar attendance_status)
- [ ] 8.05 - Agregar las rutas de participantes de curso en courseRoutes.js
- [ ] 8.06 - Agregar validaciones (verificar que el curso existe, que el participante existe, que no esta ya inscrito)

## Bloque 9: Backend - Modulo de Branding

- [ ] 9.01 - Crear backend/src/models/BrandingVersion.js con metodos: findAll, findById, findActive, create, activate, deactivateAll
- [ ] 9.02 - Crear backend/src/config/branding.js para obtener la configuracion de branding activa
- [ ] 9.03 - Crear backend/src/services/brandingService.js con logica para crear version, activar version y subir logo
- [ ] 9.04 - Crear backend/src/controllers/brandingController.js con metodo getActive (GET /active)
- [ ] 9.05 - Crear backend/src/controllers/brandingController.js con metodo listVersions (GET /versions)
- [ ] 9.06 - Crear backend/src/controllers/brandingController.js con metodo createVersion (POST /versions)
- [ ] 9.07 - Crear backend/src/controllers/brandingController.js con metodo activateVersion (PUT /versions/:id/activate)
- [ ] 9.08 - Crear backend/src/controllers/brandingController.js con metodo uploadLogo (POST /versions/:id/logo, usando multer)
- [ ] 9.09 - Crear backend/src/routes/brandingRoutes.js con todas las rutas
- [ ] 9.10 - Aplicar authMiddleware y roleMiddleware(admin) a las rutas de branding (excepto GET /active que es publico)
- [ ] 9.11 - Registrar brandingRoutes en app.js bajo /api/branding
- [ ] 9.12 - Configurar multer para guardar logos en storage/logos/ con nombre unico

## Bloque 10: Backend - Generacion de QR

- [ ] 10.01 - Crear backend/src/services/qrService.js con funcion generateQR que recibe UUID y devuelve imagen QR en base64
- [ ] 10.02 - La URL del QR debe ser: VERIFICATION_BASE_URL + "/" + uuid
- [ ] 10.03 - Probar que el QR generado es escaneable y apunta a la URL correcta

## Bloque 11: Backend - Generacion de PDF

- [ ] 11.01 - Crear backend/src/templates/certificate.html con plantilla basica del certificado (estructura HTML)
- [ ] 11.02 - Agregar estilos CSS a la plantilla del certificado (layout, tipografia, colores via variables)
- [ ] 11.03 - Agregar zona del logo en la plantilla (imagen en base64)
- [ ] 11.04 - Agregar zona del QR en la plantilla (imagen en base64)
- [ ] 11.05 - Agregar zona de datos del participante (nombre, cedula)
- [ ] 11.06 - Agregar zona de datos del curso (nombre, tipo, duracion, instructor, fechas)
- [ ] 11.07 - Agregar zona de fecha de emision y UUID del certificado
- [ ] 11.08 - Agregar zona de aviso de validez ("Este certificado es verificable en: URL")
- [ ] 11.09 - Crear backend/src/services/pdfService.js con funcion generatePDF que recibe datos y devuelve el PDF como buffer
- [ ] 11.10 - Implementar la inyeccion de variables en la plantilla HTML (reemplazar {{variable}} por valores reales)
- [ ] 11.11 - Implementar la conversion de HTML a PDF con Puppeteer (tamano carta, orientacion horizontal)
- [ ] 11.12 - Implementar el guardado del PDF en el volumen persistente (storage/certificates/)
- [ ] 11.13 - Nombrar el archivo PDF con formato: certificate_{uuid}.pdf
- [ ] 11.14 - Probar generacion de PDF completo con datos de prueba y verificar que se renderiza correctamente

## Bloque 12: Backend - Modulo de Certificados (Emision)

- [ ] 12.01 - Crear backend/src/models/Certificate.js con metodos: findAll (con paginacion y filtros), findById, findByUuid, create, revoke
- [ ] 12.02 - Crear backend/src/services/certificateService.js con funcion emitCertificate (genera UUID, obtiene branding activo, genera QR, genera PDF, guarda en BD)
- [ ] 12.03 - Crear backend/src/services/certificateService.js con funcion emitBulkCertificates (emitir para multiples participantes de un curso)
- [ ] 12.04 - Crear backend/src/controllers/certificateController.js con metodo listCertificates (GET, con filtros por curso, participante, estado)
- [ ] 12.05 - Crear backend/src/controllers/certificateController.js con metodo getCertificate (GET /:id)
- [ ] 12.06 - Crear backend/src/controllers/certificateController.js con metodo emitCertificates (POST /emit, recibe course_id y array de participant_ids)
- [ ] 12.07 - Crear backend/src/controllers/certificateController.js con metodo downloadCertificate (GET /:id/download, envia el PDF)
- [ ] 12.08 - Validar que los participantes seleccionados tienen attendance_status = 'completed' antes de emitir
- [ ] 12.09 - Validar que no exista ya un certificado valido para el mismo participante y curso
- [ ] 12.10 - Crear backend/src/routes/certificateRoutes.js con las rutas de emision y consulta
- [ ] 12.11 - Aplicar authMiddleware y roleMiddleware a las rutas de certificados
- [ ] 12.12 - Registrar certificateRoutes en app.js bajo /api/certificates

## Bloque 13: Backend - Modulo de Certificados (Revocacion)

- [ ] 13.01 - Crear backend/src/models/RevocationLog.js con metodos: create, findByCertificate
- [ ] 13.02 - Crear backend/src/services/certificateService.js con funcion revokeCertificate (cambiar status, registrar en log)
- [ ] 13.03 - Crear backend/src/controllers/certificateController.js con metodo revokeCertificate (POST /:id/revoke, requiere reason)
- [ ] 13.04 - Agregar la ruta de revocacion en certificateRoutes.js
- [ ] 13.05 - Validar que solo se pueden revocar certificados con status 'valid'
- [ ] 13.06 - Validar que se proporciona una razon de revocacion

## Bloque 14: Backend - Modulo de Verificacion Publica

- [ ] 14.01 - Crear backend/src/controllers/verificationController.js con metodo verifyCertificate (GET /:uuid)
- [ ] 14.02 - El endpoint debe ser publico (sin authMiddleware)
- [ ] 14.03 - Si el certificado existe y es valido: devolver datos publicos (nombre participante, curso, fecha, estado "VALIDO")
- [ ] 14.04 - Si el certificado esta revocado: devolver estado "REVOCADO" con fecha de revocacion
- [ ] 14.05 - Si el UUID no existe: devolver 404 con mensaje "CERTIFICADO NO ENCONTRADO"
- [ ] 14.06 - Incluir la version de branding con la que fue emitido (para mostrar logo correcto)
- [ ] 14.07 - Crear backend/src/routes/verificationRoutes.js con GET /:uuid
- [ ] 14.08 - Registrar verificationRoutes en app.js bajo /api/verify

## Bloque 15: Frontend - Configuracion Base

- [ ] 15.01 - Crear frontend/src/config/theme.js con colores, fuentes y titulo de la aplicacion
- [ ] 15.02 - Crear frontend/src/styles/global.css con reset CSS y estilos base (tipografia, colores desde theme)
- [ ] 15.03 - Importar global.css en main.jsx
- [ ] 15.04 - Crear frontend/src/services/api.js con instancia de Axios configurada (baseURL desde env, interceptores para JWT)
- [ ] 15.05 - Configurar interceptor de Axios para agregar token JWT en header Authorization
- [ ] 15.06 - Configurar interceptor de Axios para redirigir a login si recibe 401

## Bloque 16: Frontend - Autenticacion

- [ ] 16.01 - Crear frontend/src/context/AuthContext.jsx con estado de usuario, token y funciones login/logout
- [ ] 16.02 - Crear frontend/src/hooks/useAuth.js para acceder al contexto de autenticacion
- [ ] 16.03 - Crear frontend/src/services/authService.js con funciones login(email, password) y getMe()
- [ ] 16.04 - Almacenar el JWT en localStorage al hacer login
- [ ] 16.05 - Al cargar la app, verificar si hay token en localStorage y validarlo con GET /api/auth/me
- [ ] 16.06 - Crear frontend/src/components/auth/LoginForm.jsx (formulario con email y password)
- [ ] 16.07 - Crear frontend/src/pages/LoginPage.jsx (pagina completa de login con el formulario centrado)
- [ ] 16.08 - Implementar manejo de errores en login (credenciales incorrectas, error de servidor)
- [ ] 16.09 - Crear frontend/src/components/auth/ProtectedRoute.jsx (componente que redirige a login si no hay usuario autenticado)

## Bloque 17: Frontend - Layout y Navegacion

- [ ] 17.01 - Crear frontend/src/components/layout/Header.jsx (barra superior con titulo de la app, nombre del usuario, boton de logout)
- [ ] 17.02 - Crear frontend/src/components/layout/Sidebar.jsx (menu lateral con enlaces: Dashboard, Cursos, Participantes, Certificados, Configuracion)
- [ ] 17.03 - Mostrar opciones de menu segun el rol del usuario (admin ve todo, emisor no ve usuarios ni branding, consultor solo ve lectura)
- [ ] 17.04 - Crear frontend/src/components/layout/Footer.jsx (pie de pagina simple)
- [ ] 17.05 - Crear layout principal que combine Header + Sidebar + contenido principal + Footer
- [ ] 17.06 - Configurar React Router en App.jsx con todas las rutas protegidas y publicas
- [ ] 17.07 - Ruta publica: /verificar/:uuid (pagina de verificacion)
- [ ] 17.08 - Ruta publica: /login (pagina de login)
- [ ] 17.09 - Rutas protegidas: /dashboard, /cursos, /participantes, /certificados, /configuracion
- [ ] 17.10 - Implementar navegacion activa en el sidebar (resaltar la opcion actual)

## Bloque 18: Frontend - Componentes UI Reutilizables

- [ ] 18.01 - Crear frontend/src/components/ui/Button.jsx (botones con variantes: primary, secondary, danger, ghost)
- [ ] 18.02 - Crear frontend/src/components/ui/Input.jsx (input con label, placeholder, validacion visual de error)
- [ ] 18.03 - Crear frontend/src/components/ui/Modal.jsx (modal generico con overlay, titulo, contenido y botones)
- [ ] 18.04 - Crear frontend/src/components/ui/Table.jsx (tabla generica con headers, filas y soporte para acciones)
- [ ] 18.05 - Crear frontend/src/components/ui/SearchBar.jsx (barra de busqueda con icono y debounce)
- [ ] 18.06 - Crear frontend/src/components/ui/Pagination.jsx (controles de paginacion: anterior, paginas, siguiente)
- [ ] 18.07 - Crear frontend/src/components/ui/Alert.jsx (mensajes de exito, error, advertencia e informacion)
- [ ] 18.08 - Crear frontend/src/hooks/useFetch.js (hook generico para peticiones con estado de loading, data, error)

## Bloque 19: Frontend - Pagina de Dashboard

- [ ] 19.01 - Crear frontend/src/pages/DashboardPage.jsx con estructura basica
- [ ] 19.02 - Mostrar tarjetas de resumen: total de cursos, total de participantes, total de certificados emitidos, total de certificados revocados
- [ ] 19.03 - Crear endpoint GET /api/stats en el backend que devuelva los conteos para el dashboard
- [ ] 19.04 - Conectar DashboardPage con el endpoint de stats

## Bloque 20: Frontend - Modulo de Cursos

- [ ] 20.01 - Crear frontend/src/services/courseService.js con funciones: getCourses, getCourse, createCourse, updateCourse, deleteCourse, getCourseParticipants, enrollParticipants, updateParticipantStatus
- [ ] 20.02 - Crear frontend/src/pages/CoursesPage.jsx con lista de cursos, busqueda y paginacion
- [ ] 20.03 - Crear frontend/src/components/courses/CourseList.jsx (tabla de cursos con columnas: nombre, tipo, duracion, instructor, fechas, acciones)
- [ ] 20.04 - Agregar boton "Nuevo Curso" que abre formulario de creacion
- [ ] 20.05 - Crear frontend/src/components/courses/CourseForm.jsx (formulario para crear/editar curso con campos: nombre, descripcion, tipo, duracion, instructor, fecha inicio, fecha fin)
- [ ] 20.06 - Implementar validacion del formulario de curso (campos requeridos, fechas coherentes)
- [ ] 20.07 - Implementar creacion de curso (enviar POST y actualizar lista)
- [ ] 20.08 - Implementar edicion de curso (cargar datos existentes, enviar PUT y actualizar lista)
- [ ] 20.09 - Implementar eliminacion de curso con modal de confirmacion
- [ ] 20.10 - Crear frontend/src/components/courses/CourseDetail.jsx (vista detallada de un curso con sus participantes)
- [ ] 20.11 - Mostrar lista de participantes inscritos en el detalle del curso con su estado de asistencia
- [ ] 20.12 - Agregar funcionalidad para inscribir participantes existentes al curso (buscar y seleccionar)
- [ ] 20.13 - Agregar funcionalidad para cambiar el estado de asistencia de un participante (enrolled -> completed / absent)
- [ ] 20.14 - Agregar filtros en la lista de cursos (por tipo, por rango de fechas)

## Bloque 21: Frontend - Modulo de Participantes

- [ ] 21.01 - Crear frontend/src/services/participantService.js con funciones: getParticipants, getParticipant, createParticipant, updateParticipant, deleteParticipant, getParticipantCertificates
- [ ] 21.02 - Crear frontend/src/pages/ParticipantsPage.jsx con lista de participantes, busqueda y paginacion
- [ ] 21.03 - Crear frontend/src/components/participants/ParticipantList.jsx (tabla con columnas: cedula, nombre, email, organizacion, cargo, acciones)
- [ ] 21.04 - Agregar boton "Nuevo Participante" que abre formulario de creacion
- [ ] 21.05 - Crear frontend/src/components/participants/ParticipantForm.jsx (formulario para crear/editar participante)
- [ ] 21.06 - Implementar validacion del formulario de participante (cedula requerida y unica, nombre requerido)
- [ ] 21.07 - Implementar creacion de participante
- [ ] 21.08 - Implementar edicion de participante
- [ ] 21.09 - Implementar eliminacion de participante con modal de confirmacion
- [ ] 21.10 - Crear frontend/src/components/participants/ParticipantDetail.jsx (vista detallada con historial de certificados)
- [ ] 21.11 - Mostrar lista de certificados del participante en la vista de detalle
- [ ] 21.12 - Agregar busqueda de participantes por nombre o cedula

## Bloque 22: Frontend - Modulo de Certificados

- [ ] 22.01 - Crear frontend/src/services/certificateService.js con funciones: getCertificates, getCertificate, emitCertificates, revokeCertificate, downloadCertificate
- [ ] 22.02 - Crear frontend/src/pages/CertificatesPage.jsx con lista de certificados, filtros y paginacion
- [ ] 22.03 - Crear frontend/src/components/certificates/CertificateList.jsx (tabla con columnas: UUID, participante, curso, fecha emision, estado, acciones)
- [ ] 22.04 - Agregar filtros en la lista de certificados (por estado: valido/revocado, por curso, por participante)
- [ ] 22.05 - Crear frontend/src/components/certificates/CertificateDetail.jsx (vista detallada de un certificado)
- [ ] 22.06 - Mostrar informacion completa del certificado en la vista de detalle (participante, curso, fecha, estado, version de branding usada)
- [ ] 22.07 - Agregar boton "Descargar PDF" en la vista de detalle del certificado
- [ ] 22.08 - Implementar descarga de PDF (abrir en nueva pestana o descargar archivo)
- [ ] 22.09 - Agregar boton "Revocar" en la vista de detalle (solo si estado es valido)
- [ ] 22.10 - Implementar modal de revocacion con campo para escribir la razon
- [ ] 22.11 - Implementar la revocacion y actualizar la vista

## Bloque 23: Frontend - Pagina de Emision de Certificados

- [ ] 23.01 - Crear frontend/src/pages/EmitCertificatePage.jsx con estructura basica
- [ ] 23.02 - Paso 1: Selector de curso (dropdown o busqueda de cursos existentes)
- [ ] 23.03 - Paso 2: Al seleccionar curso, mostrar participantes con attendance_status = 'completed' que NO tengan ya certificado para ese curso
- [ ] 23.04 - Paso 3: Checkboxes para seleccionar participantes a certificar (opcion de seleccionar todos)
- [ ] 23.05 - Paso 4: Boton "Emitir Certificados" con modal de confirmacion que muestre resumen (curso + cantidad de participantes)
- [ ] 23.06 - Implementar llamada al endpoint POST /api/certificates/emit con course_id y participant_ids
- [ ] 23.07 - Mostrar estado de progreso durante la emision (loading)
- [ ] 23.08 - Mostrar resultado de la emision (exito con cantidad emitida o errores)
- [ ] 23.09 - Agregar enlace a EmitCertificatePage desde el sidebar y desde el detalle de un curso

## Bloque 24: Frontend - Pagina de Verificacion Publica

- [ ] 24.01 - Crear frontend/src/pages/VerifyPage.jsx con estructura basica (sin layout de admin, pagina publica independiente)
- [ ] 24.02 - Extraer el UUID de la URL (/verificar/:uuid)
- [ ] 24.03 - Llamar al endpoint GET /api/verify/:uuid al cargar la pagina
- [ ] 24.04 - Si el certificado es valido: mostrar datos del certificado con sello visual "CERTIFICADO VALIDO" en verde
- [ ] 24.05 - Si el certificado esta revocado: mostrar aviso "CERTIFICADO REVOCADO" en rojo con fecha de revocacion
- [ ] 24.06 - Si no se encuentra: mostrar "CERTIFICADO NO ENCONTRADO"
- [ ] 24.07 - Mostrar el logo de la version de branding con la que fue emitido el certificado
- [ ] 24.08 - Mostrar datos: nombre del participante, curso, tipo de curso, duracion, instructor, fecha de emision
- [ ] 24.09 - Disenar la pagina con aspecto profesional y confiable (sin necesidad de login)
- [ ] 24.10 - Asegurar que la pagina es responsive (se ve bien en movil, ya que el QR se escanea con celular)

## Bloque 25: Frontend - Modulo de Configuracion (Admin)

- [ ] 25.01 - Crear frontend/src/pages/SettingsPage.jsx con estructura basica (solo accesible por admin)
- [ ] 25.02 - Seccion de gestion de usuarios: lista de usuarios del sistema
- [ ] 25.03 - Formulario para crear nuevo usuario (email, nombre, password, rol)
- [ ] 25.04 - Opcion para editar usuario existente (nombre, rol, estado activo/inactivo)
- [ ] 25.05 - Seccion de gestion de branding: mostrar version activa actual (logo, colores, fuente)
- [ ] 25.06 - Formulario para crear nueva version de branding (subir logo, definir colores, fuente, nombre organizacion)
- [ ] 25.07 - Historial de versiones de branding con opcion de activar una version anterior
- [ ] 25.08 - Preview visual de como se vera el branding en un certificado

## Bloque 26: Frontend - Manejo de Errores y UX

- [ ] 26.01 - Crear frontend/src/pages/NotFoundPage.jsx (pagina 404 para rutas no encontradas)
- [ ] 26.02 - Implementar notificaciones toast para acciones exitosas (certificado emitido, curso creado, etc.)
- [ ] 26.03 - Implementar indicadores de carga (spinners/skeletons) durante peticiones al backend
- [ ] 26.04 - Implementar manejo de errores de red (mostrar mensaje cuando el backend no responde)
- [ ] 26.05 - Implementar confirmacion antes de acciones destructivas (eliminar, revocar)

## Bloque 27: Seguridad y Validaciones Finales

- [ ] 27.01 - Agregar rate limiting en el endpoint POST /api/auth/login (express-rate-limit)
- [ ] 27.02 - Verificar que todos los endpoints protegidos requieren autenticacion
- [ ] 27.03 - Verificar que las rutas de admin solo son accesibles por usuarios con rol admin
- [ ] 27.04 - Verificar que la pagina de verificacion es accesible sin autenticacion
- [ ] 27.05 - Verificar que no se exponen IDs internos en la API publica de verificacion
- [ ] 27.06 - Verificar que los PDFs no son accesibles directamente por URL (solo via endpoint autenticado)
- [ ] 27.07 - Verificar que CORS solo permite el origen del frontend

## Bloque 28: Pruebas de Integracion Manual

- [ ] 28.01 - Probar flujo completo: login como admin
- [ ] 28.02 - Probar flujo completo: crear un curso
- [ ] 28.03 - Probar flujo completo: crear participantes
- [ ] 28.04 - Probar flujo completo: inscribir participantes al curso
- [ ] 28.05 - Probar flujo completo: marcar participantes como 'completed'
- [ ] 28.06 - Probar flujo completo: emitir certificados
- [ ] 28.07 - Probar flujo completo: verificar que el PDF se genero correctamente con QR y logo
- [ ] 28.08 - Probar flujo completo: escanear el QR y verificar que la pagina de verificacion funciona
- [ ] 28.09 - Probar flujo completo: revocar un certificado y verificar que la pagina de verificacion muestra "REVOCADO"
- [ ] 28.10 - Probar flujo completo: cambiar version de branding y emitir nuevos certificados (verificar que los anteriores conservan el logo viejo)
- [ ] 28.11 - Probar flujo completo: crear usuarios con diferentes roles y verificar permisos
- [ ] 28.12 - Probar flujo completo: detener y reiniciar Docker y verificar que los datos persisten

## Bloque 29: Produccion

- [ ] 29.01 - Crear docker-compose.prod.yml con configuracion de produccion (sin hot reload, build optimizado)
- [ ] 29.02 - Crear Dockerfile de produccion del frontend (build con Vite + servir con nginx)
- [ ] 29.03 - Crear Dockerfile de produccion del backend (sin nodemon, con NODE_ENV=production)
- [ ] 29.04 - Configurar nginx como reverse proxy para servir frontend y proxear /api al backend
- [ ] 29.05 - Documentar el proceso de despliegue en produccion en el readme.md
- [ ] 29.06 - Documentar el proceso de respaldo y restauracion en el readme.md
