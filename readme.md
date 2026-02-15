# Plataforma de Emision y Gestion de Credenciales Digitales

## Descripcion General

Plataforma de certificacion verificable que transforma el aprendizaje tecnico en activos digitales seguros. Permite la trazabilidad absoluta de las competencias adquiridas, garantizando que el conocimiento sea auditable y medible.

El sistema permite emitir, gestionar y revocar credenciales digitales que acreditan la participacion en cursos, charlas y talleres. Cada certificado emitido genera un PDF con un codigo QR que enlaza a una pagina publica de verificacion donde cualquier persona puede confirmar la autenticidad y vigencia del documento.

### Caracteristicas principales

- **Plantillas de certificado intercambiables:** Multiples modelos de certificado (formal, moderno, personalizado) seleccionables al emitir. Se crean con HTML/CSS sin modificar codigo.
- **Sistema de dependencias:** Cada unidad organizacional (dependencia) tiene su logo y sus usuarios emisores. Los cursos pueden involucrar multiples dependencias y el certificado mostrara todos los logos.
- **Multi-logo en certificados:** Los certificados incluyen el logo institucional (branding global) mas los logos de todas las dependencias que participaron en el evento.
- **Roles diferenciados:** Usuarios admin con acceso global, y usuarios emisores que solo gestionan los cursos y certificados de su dependencia.
- **Panel de administracion global:** Vista para administradores con lista de todos los eventos, certificados y actividad del sistema.
- **Branding versionado:** Los cambios de logo/colores institucionales no afectan certificados ya emitidos.
- **Verificacion publica:** Cualquier persona puede verificar un certificado escaneando su QR, sin necesidad de cuenta.

## Stack Tecnologico

| Componente | Tecnologia |
|---|---|
| Frontend | React (Vite) + React Router + Axios |
| Backend | Node.js + Express.js |
| Base de Datos | PostgreSQL 16 |
| Generacion PDF | Puppeteer (HTML/CSS a PDF con viewport fijo) |
| Generacion QR | qrcode (npm) |
| Autenticacion | JWT + bcrypt |
| Contenedores | Docker + Docker Compose |

## Requisitos Previos

- Docker Desktop instalado y en ejecucion
- Docker Compose v2+
- Git

## Instalacion Rapida

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd credenciales-digitales
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con los valores deseados
```

3. Levantar el sistema:
```bash
docker compose up --build
```

4. Acceder:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432

5. Login inicial:
- Email: admin@admin.com
- Password: (definido en el seed de la base de datos)

6. Configuracion inicial (desde panel admin):
- Crear dependencias y subir sus logos
- Crear branding institucional (logo, colores, fuente)
- Crear usuarios emisores y asignarlos a dependencias
- (Opcional) Crear nuevas plantillas de certificado

## Scripts NPM

El proyecto incluye un `package.json` en la raiz con scripts para gestionar Docker y datos.

### Docker

| Script | Descripcion |
|---|---|
| `npm run up` | Levantar contenedores |
| `npm run up:build` | Reconstruir imagenes y levantar |
| `npm run down` | Detener contenedores |
| `npm run logs` | Ver logs en tiempo real |
| `npm run ps` | Ver estado de servicios |

### Backup y Restore

| Script | Descripcion |
|---|---|
| `npm run backup` | Generar backup de BD y storage (backup.tar.gz) |
| `npm run backup:db` | Backup solo de base de datos |
| `npm run backup:storage` | Backup solo de PDFs y logos |
| `npm run restore` | Restaurar BD y storage desde backups |
| `npm run restore:db` | Restaurar solo base de datos |
| `npm run restore:storage` | Restaurar solo PDFs y logos |
| `npm run snapshot` | Generar snapshot de BD y storage (snapshot.tar.gz) |
| `npm run reset` | Snapshot + eliminar datos + reconstruir desde cero |
| `npm run pull:sync` | Detener, restaurar datos y reconstruir (usar despues de git pull) |

### Destruir y reconstruir contenedores

```bash
# Detener y eliminar contenedores y redes (los datos persisten)
npm run down

# Eliminar las imagenes construidas del proyecto
docker rmi certify-frontend certify-backend

# Reconstruir y levantar todo desde cero
npm run up:build
```

> **Nota:** Los datos se almacenan en carpetas locales del proyecto, no en volumenes de Docker. Ningun comando de Docker puede eliminarlos. Para reiniciar la base de datos desde cero, elimina manualmente la carpeta `database/data/`.

### Migrar datos entre maquinas

Los backups (`.tar.gz`) se incluyen en git, lo que permite migrar datos entre maquinas:

```bash
# Maquina origen: generar backups y subir
npm run backup
git add . && git commit -m "backup: actualizar datos" && git push

# Maquina destino: descargar y sincronizar
git pull
npm run pull:sync
```

## Estructura del Proyecto

Consultar [arquitectura.md](arquitectura.md) para la estructura completa de carpetas, modelo de datos y diagramas de flujo.

## Configuracion y Personalizacion

Consultar [config.md](config.md) para la guia completa de personalizacion (branding, logos, plantillas, dependencias).

## Flujo de Trabajo de Desarrollo

Consultar [instructions.md](instructions.md) para el proceso a seguir al implementar cada tarea.

## Progreso del Desarrollo

Consultar [todo.md](todo.md) para la lista detallada de tareas y su estado actual.

---

## Documentacion por Modulo

> Las siguientes secciones se completaran a medida que cada modulo sea implementado, siguiendo las instrucciones de [instructions.md](instructions.md).

---

### Modulo: Base de Datos

**Estado:** Pendiente

> Se documentara: esquema de tablas (dependencies, users, certificate_templates, courses, course_dependencies, participants, branding_versions, certificates, revocation_log, course_participants), relaciones, indices, migraciones, datos semilla.

---

### Modulo: Autenticacion y Usuarios

**Estado:** Pendiente

> Se documentara: endpoints de auth, sistema de roles (admin/emisor), gestion de usuarios, asignacion a dependencias, formato JWT (incluye role y dependency_id).

---

### Modulo: Dependencias

**Estado:** Pendiente

> Se documentara: CRUD de dependencias, subida de logos, asignacion de usuarios a dependencias, dependencias colaboradoras en cursos.

---

### Modulo: Plantillas de Certificado

**Estado:** Pendiente

> Se documentara: CRUD de plantillas, variables disponibles, preview de plantillas, plantilla por defecto, creacion de nuevos modelos con HTML/CSS.

---

### Modulo: Cursos

**Estado:** Implementado (CRUD + inscripcion de participantes)

Gestiona los cursos/eventos del sistema. Los cursos pertenecen a una dependencia y pueden tener dependencias colaboradoras. Admin ve todos los cursos; emisor solo los de su dependencia.

**Archivos:**
- `backend/src/models/Course.js` — CRUD de cursos
- `backend/src/models/CourseDependency.js` — Dependencias colaboradoras
- `backend/src/models/CourseParticipant.js` — Inscripciones de participantes
- `backend/src/controllers/courseController.js` — Logica de negocio
- `backend/src/routes/courseRoutes.js` — Definicion de rutas

**Endpoints CRUD:**

| Metodo | Ruta | Descripcion | Roles |
|---|---|---|---|
| GET | `/api/courses` | Lista paginada (filtrada por dependencia) | admin, emisor |
| GET | `/api/courses/:id` | Detalle con dependencias asociadas | admin, emisor |
| POST | `/api/courses` | Crear curso | admin, emisor |
| PUT | `/api/courses/:id` | Actualizar curso | admin, emisor (propio) |
| DELETE | `/api/courses/:id` | Eliminar curso | admin, emisor (propio) |

**Endpoints de dependencias colaboradoras:**

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/api/courses/:id/dependencies` | Agregar dependencia colaboradora |
| DELETE | `/api/courses/:id/dependencies/:depId` | Quitar dependencia colaboradora |

**Endpoints de inscripcion de participantes:**

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/courses/:id/participants` | Listar participantes inscritos con su estado |
| POST | `/api/courses/:id/participants` | Inscribir participantes (array de IDs) |
| PUT | `/api/courses/:id/participants/:participantId` | Cambiar estado de asistencia |

**Estados de asistencia (`attendance_status`):**
- `enrolled` — Inscrito (default)
- `attended` — Asistio
- `completed` — Completó (requerido para emitir certificado)
- `absent` — Ausente

**Comportamiento de inscripcion masiva:**
El endpoint POST `/:id/participants` recibe un array de `participant_ids` y devuelve un objeto con tres listas:
- `enrolled`: ids inscritos exitosamente
- `already_enrolled`: ids que ya estaban inscritos
- `not_found`: ids que no existen en el sistema

---

### Modulo: Participantes

**Estado:** Implementado

El modulo de participantes gestiona el registro de personas que asisten a cursos y reciben certificados. Los participantes son globales (no pertenecen a una dependencia especifica) y ambos roles (admin y emisor) pueden gestionarlos.

**Archivos:**
- `backend/src/models/Participant.js` - Modelo con acceso a BD
- `backend/src/controllers/participantController.js` - Logica de negocio
- `backend/src/routes/participantRoutes.js` - Definicion de rutas

**Endpoints:**

| Metodo | Ruta | Descripcion | Roles |
|---|---|---|---|
| GET | `/api/participants` | Lista paginada con busqueda | admin, emisor |
| GET | `/api/participants/:id` | Detalle de un participante | admin, emisor |
| POST | `/api/participants` | Crear participante | admin, emisor |
| PUT | `/api/participants/:id` | Actualizar participante | admin, emisor |
| DELETE | `/api/participants/:id` | Eliminar participante | admin, emisor |
| GET | `/api/participants/:id/certificates` | Historial de certificados | admin, emisor |

**Query params para GET /:**
- `search`: busca por nombre o cedula (ILIKE, parcial)
- `page`: pagina (default 1)
- `limit`: registros por pagina (default 20, max 100)

**Validaciones:**
- `document_id`: requerido en creacion, debe ser unico en todo el sistema
- `full_name`: requerido en creacion, no puede quedar vacio en actualizacion
- `email`: opcional, debe ser un email valido si se proporciona
- En PUT, si se cambia `document_id` se verifica que no exista en otro registro

**Ejemplo de uso:**

```bash
# Crear participante
POST /api/participants
Authorization: Bearer <token>
{
  "document_id": "1234567890",
  "full_name": "Juan Perez",
  "email": "juan@correo.com",
  "organization": "UNAM",
  "position": "Docente"
}

# Buscar por nombre o cedula
GET /api/participants?search=juan&page=1&limit=20
Authorization: Bearer <token>

# Ver historial de certificados
GET /api/participants/1/certificates
Authorization: Bearer <token>
```

---

### Modulo: Branding Versionado

**Estado:** Implementado

Sistema de versionado del branding institucional. Cada version registra el logo, colores y fuente vigentes al momento de emision. Los certificados ya emitidos nunca se ven afectados por cambios de branding posteriores.

**Reglas:**
- Solo puede haber una version activa a la vez
- Al activar una version, todas las demas se desactivan automaticamente
- Nunca se eliminan versiones anteriores (inmutabilidad historica)
- Los logos se guardan en `storage/logos/branding/` con nombre unico (UUID)

**Archivos:**
- `backend/src/models/BrandingVersion.js` — Modelo con acceso a BD
- `backend/src/config/branding.js` — Helper para obtener branding activo
- `backend/src/services/brandingService.js` — Logica de creacion, activacion y logo
- `backend/src/controllers/brandingController.js` — Controladores
- `backend/src/routes/brandingRoutes.js` — Rutas

**Endpoints:**

| Metodo | Ruta | Descripcion | Auth |
|---|---|---|---|
| GET | `/api/branding/active` | Obtener branding activo | Publico |
| GET | `/api/branding/versions` | Listar todas las versiones | admin |
| POST | `/api/branding/versions` | Crear nueva version | admin |
| PUT | `/api/branding/versions/:id/activate` | Activar una version | admin |
| POST | `/api/branding/versions/:id/logo` | Subir logo institucional | admin |

**Ejemplo de uso:**

```bash
# Ver branding activo (sin autenticacion)
GET /api/branding/active

# Crear nueva version de branding
POST /api/branding/versions
Authorization: Bearer <token>
{
  "version_label": "v2",
  "primary_color": "#2d3748",
  "secondary_color": "#4a5568",
  "font_family": "Open Sans",
  "organization_name": "Mi Institucion"
}

# Activar la nueva version
PUT /api/branding/versions/2/activate
Authorization: Bearer <token>

# Subir logo institucional (multipart/form-data)
POST /api/branding/versions/2/logo
Authorization: Bearer <token>
Form: logo=<archivo>
```

---

### Modulo: Generacion de QR y PDF

**Estado:** Implementado

Servicios internos (no exponen endpoints propios) utilizados durante la emision de certificados.

**Archivos:**
- `backend/src/services/qrService.js` — Genera QR como data URL base64
- `backend/src/services/templateService.js` — Carga plantillas, resuelve logos, inyecta variables
- `backend/src/services/pdfService.js` — Convierte HTML a PDF con Puppeteer, guarda en disco

**qrService:**
```js
const { generateQR } = require('./services/qrService');
const dataUrl = await generateQR(uuid);
// Retorna: "data:image/png;base64,..." listo para <img src="...">
// URL del QR: VERIFICATION_BASE_URL + "/" + uuid
```

**templateService:**
```js
const { buildCertificateHtml } = require('./services/templateService');
const { html, template } = await buildCertificateHtml(templateId, {
  participant, course, brandingVersion, courseDependencies,
  issueDate, uuid, qrCodeBase64
});
```

Variables soportadas en plantillas:
`{{participant_name}}`, `{{document_id}}`, `{{course_name}}`, `{{course_type}}`,
`{{course_duration}}`, `{{instructor}}`, `{{issue_date}}`, `{{certificate_uuid}}`,
`{{qr_code_base64}}`, `{{institutional_logo_base64}}`, `{{dependency_logos_html}}`,
`{{primary_color}}`, `{{secondary_color}}`, `{{font_family}}`, `{{organization_name}}`,
`{{dependency_names}}`, `{{verification_url}}`

**pdfService:**
```js
const { generateAndSavePDF } = require('./services/pdfService');
const { pdfPath, pdfBuffer } = await generateAndSavePDF(html, uuid, {
  orientation: 'landscape',   // o 'portrait'
  page_size: 'letter'         // o 'a4'
});
// Guarda: storage/certificates/certificate_{uuid}.pdf
```

Dimensiones de viewport fijo (Puppeteer):
- Letter landscape: 1056x816px
- Letter portrait: 816x1056px
- A4 landscape: 1123x794px
- A4 portrait: 794x1123px

---

### Modulo: Emision de Certificados

**Estado:** Implementado

Emision de certificados digitales con PDF generado desde plantillas HTML/CSS. Soporta emision masiva (multiples participantes a la vez) con validaciones de elegibilidad.

**Archivos:**
- `backend/src/models/Certificate.js` — Modelo con CRUD y filtros
- `backend/src/services/certificateService.js` — Logica de emision y revocacion
- `backend/src/controllers/certificateController.js` — Controladores
- `backend/src/routes/certificateRoutes.js` — Rutas

**Endpoints:**

| Metodo | Ruta | Descripcion | Roles |
|---|---|---|---|
| GET | `/api/certificates` | Lista paginada con filtros | admin, emisor |
| GET | `/api/certificates/:id` | Detalle de un certificado | admin, emisor |
| POST | `/api/certificates/emit` | Emitir certificados (masivo) | admin, emisor |
| GET | `/api/certificates/:id/download` | Descargar PDF del certificado | admin, emisor |
| POST | `/api/certificates/:id/revoke` | Revocar un certificado | admin, emisor |

**Flujo de emision (POST /emit):**
1. Verificar que el curso existe y el emisor tiene acceso
2. Por cada participante: verificar que no tiene certificado valido (14.09) y que tiene `attendance_status = 'completed'` (14.08)
3. Obtener branding activo, dependencias del curso, generar UUID, QR, renderizar HTML, generar PDF
4. Guardar PDF en `storage/certificates/` y registrar en BD con `status = 'valid'`
5. Devolver resultado por participante: `{emitted, already_exists, errors}`

**Filtros disponibles (GET /):**
- `course_id`, `participant_id`, `status` (`valid`/`revoked`)
- `page`, `limit`
- Filtrado automatico por dependencia segun rol (emisor solo ve los de su dependencia)

---

### Modulo: Revocacion de Certificados

**Estado:** Implementado

Revocacion de certificados con registro de auditoria en log. Los PDFs no se eliminan (inmutabilidad). Solo se pueden revocar certificados con `status = 'valid'`.

**Archivos:**
- `backend/src/models/RevocationLog.js` — Log de revocaciones
- `backend/src/services/certificateService.js` — Funcion `revokeCertificate`
- `backend/src/controllers/certificateController.js` — Handler de revocacion
- `backend/src/routes/certificateRoutes.js` — Ruta POST /:id/revoke

**Endpoint:**

| Metodo | Ruta | Descripcion | Roles |
|---|---|---|---|
| POST | `/api/certificates/:id/revoke` | Revocar certificado (requiere reason) | admin, emisor (propio) |

**Validaciones:**
- El certificado debe existir (404 si no)
- El certificado debe tener `status = 'valid'` (409 si ya esta revocado)
- Se debe proporcionar una razon (`reason` no vacio, 422 si falta)
- El emisor solo puede revocar certificados de su propia dependencia (403 si no)

**Flujo de revocacion:**
1. Actualizar `status = 'revoked'` en tabla `certificates` (con `revocation_reason`, `revoked_at`, `revoked_by`)
2. Insertar registro en tabla `revocation_log` (con `certificate_id`, `revoked_by`, `reason`)

**Ejemplo de uso:**

```bash
# Revocar un certificado
POST /api/certificates/5/revoke
Authorization: Bearer <token>
{
  "reason": "Emitido con error en datos del participante"
}

# Respuesta exitosa (200)
{
  "message": "Certificado revocado",
  "certificate": {
    "id": 5,
    "uuid": "...",
    "status": "revoked",
    "revocation_reason": "Emitido con error en datos del participante",
    "revoked_at": "2026-02-14T19:48:01.019Z",
    "revoked_by": 1
  }
}

# Error: certificado ya revocado (409)
{ "error": "Solo se pueden revocar certificados con status valid" }

# Error: sin razon (422)
{ "error": "Datos de entrada invalidos", "details": [...] }
```

---

### Modulo: Verificacion Publica

**Estado:** Implementado

Endpoint publico que permite verificar la autenticidad y vigencia de cualquier certificado a partir de su UUID (escaneando el QR). No requiere autenticacion.

**Archivos:**
- `backend/src/controllers/verificationController.js` — Controlador
- `backend/src/routes/verificationRoutes.js` — Ruta publica

**Endpoint:**

| Metodo | Ruta | Descripcion | Auth |
|---|---|---|---|
| GET | `/api/verify/:uuid` | Verificar certificado por UUID | Publico |

**Respuesta — Certificado VALIDO:**
```json
{
  "status": "VALIDO",
  "certificate": {
    "uuid": "...",
    "issue_date": "...",
    "participant": { "full_name": "...", "document_id": "...", "organization": "...", "position": "..." },
    "course": { "name": "...", "type": "...", "duration_hours": 40, "instructor": "...", "start_date": "...", "end_date": "..." },
    "branding": { "version_label": "...", "logo_path": "...", "organization_name": "...", "primary_color": "...", "secondary_color": "...", "font_family": "..." },
    "dependencies": [{ "name": "...", "abbreviation": "...", "logo_path": "...", "display_order": 1 }]
  }
}
```

**Respuesta — Certificado REVOCADO:**
```json
{
  "status": "REVOCADO",
  "certificate": {
    "uuid": "...",
    "issue_date": "...",
    "revoked_at": "...",
    "revocation_reason": "...",
    "participant": { ... },
    "course": { ... },
    "branding": { ... },
    "dependencies": [ ... ]
  }
}
```

**Errores:**
- `404` — `{ "error": "CERTIFICADO NO ENCONTRADO" }` si el UUID no existe
- `422` — Validacion fallida si el formato del UUID es invalido

---

### Modulo: Estadisticas y Panel Admin

**Estado:** Implementado

Endpoints de estadisticas y panel de administracion global. Las estadisticas agregadas permiten al admin monitorear el sistema completo; el emisor solo ve su propia dependencia.

**Archivos:**
- `backend/src/controllers/statsController.js` — Estadisticas globales y por dependencia
- `backend/src/controllers/adminController.js` — Listas globales y actividad
- `backend/src/routes/statsRoutes.js` — Rutas de estadisticas
- `backend/src/routes/adminRoutes.js` — Rutas del panel admin

**Endpoints de estadisticas:**

| Metodo | Ruta | Descripcion | Roles |
|---|---|---|---|
| GET | `/api/stats` | Totales globales + desglose por dependencia | admin |
| GET | `/api/stats/me` | Estadisticas de la dependencia del usuario actual | admin, emisor |
| GET | `/api/stats/dependency/:id` | Estadisticas de una dependencia especifica | admin |

**Endpoints del panel admin:**

| Metodo | Ruta | Descripcion | Roles |
|---|---|---|---|
| GET | `/api/admin/events` | Lista global de cursos con filtros | admin |
| GET | `/api/admin/certificates` | Lista global de certificados con filtros | admin |
| GET | `/api/admin/activity` | Registro de actividad reciente del sistema | admin |

**Filtros de `/api/admin/events`:** `dependency_id`, `type`, `date_from`, `date_to`, `page`, `limit`

**Filtros de `/api/admin/certificates`:** `dependency_id`, `status`, `course_id`, `date_from`, `date_to`, `page`, `limit`

**Tipos de eventos en `/api/admin/activity`:**
- `certificate_emission` — Emision de un certificado (usuario, participante, curso)
- `revocation` — Revocacion de un certificado (usuario, participante, curso)
- `course_creation` — Creacion de un curso (usuario, nombre del curso)
- `branding_change` — Nueva version de branding institucional (usuario, version_label)

Los eventos se devuelven ordenados por fecha descendente (mas recientes primero). El query param `limit` permite controlar cuantos registros devolver (default 50).

---

### Modulo: Frontend - Configuracion Base

**Estado:** Implementado

Configuracion base del frontend: tema visual, estilos globales e instancia de Axios.

**Archivos:**
- `frontend/src/config/theme.js` — Paleta de colores, fuentes, radios, sombras y transiciones
- `frontend/src/styles/global.css` — Reset CSS y variables CSS derivadas del tema
- `frontend/src/services/api.js` — Instancia Axios con interceptores JWT y manejo de 401

**Variables CSS disponibles** (desde `global.css`):
`--color-primary`, `--color-danger`, `--color-success`, `--color-background`, `--color-surface`, `--color-border`, `--color-text-primary`, `--color-sidebar-bg`, `--font-sans`, `--radius-md`, `--shadow-md`, etc.

**Instancia Axios (`api.js`):**
- `baseURL`: `VITE_API_URL` del .env (default `http://localhost:3000/api`)
- Request interceptor: agrega `Authorization: Bearer <token>` si hay token en `localStorage`
- Response interceptor: si recibe 401, limpia `localStorage` y redirige a `/login`

---

### Modulo: Frontend - Autenticacion

**Estado:** Implementado

Sistema completo de autenticacion en el frontend: contexto global, persistencia de sesion, login, rutas protegidas y control de acceso por rol.

**Archivos:**
- `frontend/src/services/authService.js` — Llamadas a `/api/auth/login` y `/api/auth/me`
- `frontend/src/context/AuthContext.jsx` — Contexto global con `user`, `token`, `loading`, `login`, `logout`
- `frontend/src/hooks/useAuth.js` — Hook `useAuth()` para acceder al contexto
- `frontend/src/components/auth/LoginForm.jsx` — Formulario de login con manejo de errores
- `frontend/src/pages/LoginPage.jsx` — Pagina de login centrada
- `frontend/src/components/auth/ProtectedRoute.jsx` — Redirige a `/login` si no hay sesion
- `frontend/src/components/auth/AdminRoute.jsx` — Redirige a `/dashboard` si el rol no es admin

**Flujo de sesion:**
1. Al cargar la app, se verifica si hay `token` en `localStorage`
2. Si existe, se llama a `GET /api/auth/me` para validarlo y recuperar el usuario
3. Si el token es invalido o expirado, se limpia `localStorage` y se redirige a `/login`
4. Al hacer login exitoso, el token y el objeto usuario se guardan en `localStorage`
5. Al hacer logout, se limpian ambos valores del `localStorage`

**Payload del usuario** (`user` en el contexto):
```json
{ "id": 1, "email": "...", "full_name": "...", "role": "admin|emisor", "dependency_id": null }
```

**Errores manejados en login:**
- 401 — "Email o contrasena incorrectos"
- 422 — campos invalidos
- Sin respuesta del servidor — error de conexion
- Otros — mensaje generico

---

### Modulo: Frontend - Layout y Navegacion

**Estado:** Implementado

Layout principal de la aplicacion con header fijo, sidebar lateral y area de contenido. La navegacion se adapta al rol del usuario.

**Archivos:**
- `frontend/src/components/layout/Header.jsx` — Barra superior fija con titulo, usuario, dependencia y logout
- `frontend/src/components/layout/Sidebar.jsx` — Menu lateral con items por rol y estado activo
- `frontend/src/components/layout/Footer.jsx` — Pie de pagina simple
- `frontend/src/components/layout/AppLayout.jsx` — Wrapper que combina Header + Sidebar + Outlet + Footer

**Estructura visual:**
```
+--------------------------------------------+
|  Header (fijo, 60px)                       |
+----------+---------------------------------+
| Sidebar  |  <main>                         |
| (220px,  |    Outlet (contenido de ruta)   |
|  fijo)   |                                 |
|          |  Footer                         |
+----------+---------------------------------+
```

**Sistema de rutas (App.jsx):**
- `/login` — Publica
- `/verificar/:uuid` — Publica (verificacion de certificados)
- Rutas protegidas (requieren login) con `AppLayout`:
  - `/dashboard`, `/cursos`, `/participantes`, `/certificados`, `/emitir`
- Rutas solo admin (requieren `role='admin'`):
  - `/admin/dependencias`, `/admin/plantillas`, `/admin/usuarios`, `/admin/eventos`
  - `/admin/certificados-global`, `/admin/actividad`, `/configuracion`

**Menu sidebar por rol:**
- Admin: todas las rutas comunes + seccion "Administracion" con las rutas de admin
- Emisor: solo rutas comunes (Dashboard, Cursos, Participantes, Certificados, Emitir)

La navegacion activa usa `NavLink` de react-router-dom: la ruta activa se resalta con borde izquierdo azul y fondo mas claro.

El header muestra `dependency_name` cuando el usuario tiene dependencia asignada, o "Administrador" para admins sin dependencia.

---

### Modulo: Frontend - Componentes UI Reutilizables

**Estado:** Implementado

Biblioteca de componentes UI usados en todos los modulos del frontend.

**Componentes (`frontend/src/components/ui/`):**

| Componente | Descripcion |
|---|---|
| `Button.jsx` | Variantes: `primary`, `secondary`, `danger`, `ghost`. Props: `size` (sm/md/lg), `loading`, `disabled` |
| `Input.jsx` | Campo de texto con `label`, `error`, `required`. Borde rojo cuando `error` esta presente |
| `Modal.jsx` | Overlay con cierre por Escape o click exterior. Props: `isOpen`, `onClose`, `title`, `footer`, `size` (sm/md/lg/xl). El tamano `xl` ocupa 95vw y se usa para formularios con preview en tiempo real |
| `Table.jsx` | `columns: [{key, label, render?, width?}]`, `data`, `loading`, `emptyText`, `onRowClick` |
| `SearchBar.jsx` | Input con debounce de 350ms. Prop `onSearch(value)`. Boton X para limpiar |
| `Pagination.jsx` | Anterior / paginas numeradas (ventana de 5) / Siguiente. Muestra "X-Y de Total" |
| `Alert.jsx` | Tipos: `success`, `error`, `warning`, `info`. Prop `dismissible` para mostrar boton de cierre |
| `Select.jsx` | Dropdown con `label`, `options: [{value, label}]`, `error`, `placeholder` |
| `Badge.jsx` | Estados pre-definidos: `valid`, `revoked`, `enrolled`, `attended`, `completed`, `absent`, `active`, `inactive`, `admin`, `emisor` |

**Hook (`frontend/src/hooks/`):**

| Hook | Descripcion |
|---|---|
| `useFetch(url, options)` | Retorna `{data, loading, error, refetch}`. Llama a la API automaticamente al montar. Soporta `params`, `method`, `body`, `skip` |

---

### Modulo: Frontend - Dashboard

**Estado:** Implementado

Pagina de inicio de la aplicacion. El contenido se adapta automaticamente al rol del usuario.

**Archivo:** `frontend/src/pages/DashboardPage.jsx`

**Vista admin** — llama a `GET /api/stats`:
- 5 tarjetas: Cursos, Participantes, Certificados, Validos, Revocados
- Tabla de desglose por dependencia (cursos, certificados, validos, revocados, usuarios)

**Vista emisor** — llama a `GET /api/stats/me`:
- 5 tarjetas con las estadisticas de su propia dependencia

**Componentes usados:** `useFetch`, `Alert`

---

### Modulo: Frontend - Gestion de Cursos

**Estado:** Implementado

CRUD completo de cursos con detalle interactivo para gestionar dependencias colaboradoras y participantes.

**Archivos:**
- `frontend/src/services/courseService.js` — 10 funciones de API (CRUD + participantes + dependencias)
- `frontend/src/pages/CoursesPage.jsx` — Pagina principal con lista, filtros, paginacion y modales
- `frontend/src/components/courses/CourseList.jsx` — Tabla con columnas: nombre, tipo, dependencia, horas, instructor, fechas, acciones
- `frontend/src/components/courses/CourseForm.jsx` — Formulario con validacion (nombre, tipo requeridos; fechas coherentes)
- `frontend/src/components/courses/CourseDetail.jsx` — Vista detallada en modal

**Funcionalidades:**
- Busqueda por nombre (debounce 350ms) y filtro por tipo
- Crear curso → modal con CourseForm
- Editar curso → modal con CourseForm pre-cargado
- Eliminar curso → modal de confirmacion
- Ver detalle → modal CourseDetail con:
  - Dependencias colaboradoras (chips con boton de quitar, selector para agregar)
  - Participantes inscritos con selector de estado de asistencia inline
  - Inscribir nuevos participantes desde dropdown

---

### Modulo: Frontend - Gestion de Participantes

**Estado:** Pendiente

> Se documentara: lista de participantes, formulario CRUD, detalle con historial, busqueda.

---

### Modulo: Frontend - Gestion de Certificados

**Estado:** Pendiente

> Se documentara: lista de certificados (filtrada por dependencia), detalle con logos de dependencias, descarga PDF, emision con seleccion de plantilla, revocacion.

---

### Modulo: Frontend - Verificacion Publica

**Estado:** Pendiente

> Se documentara: pagina de verificacion, estados visuales, logos institucional y de dependencias, diseno responsive.

---

### Modulo: Frontend - Panel Admin Global

**Estado:** Pendiente

> Se documentara: gestion de dependencias (CRUD + logos), gestion de usuarios (asignacion de roles y dependencias), lista global de eventos, lista global de certificados, registro de actividad.

#### Gestion de Plantillas con Preview en Tiempo Real

**Estado:** Implementado

El formulario de creacion/edicion de plantillas (`TemplateForm.jsx`) incluye un modulo de preview en tiempo real que permite visualizar los cambios al HTML/CSS mientras se editan.

**Archivos:**
- `frontend/src/components/admin/TemplateForm.jsx` — Formulario con layout split-pane (editor + preview)
- `frontend/src/components/admin/TemplatePreviewPanel.jsx` — Componente de preview con iframe aislado
- `frontend/src/pages/admin/TemplatesPage.jsx` — Pagina que usa modal xl para acomodar el editor

**Caracteristicas del preview en tiempo real:**
- **Split-pane:** El editor y el preview se muestran lado a lado en un grid 50/50
- **Iframe aislado:** El HTML se renderiza en un iframe con sandbox para seguridad
- **Reemplazo de placeholders:** Los placeholders `{{variable}}` se reemplazan con datos de ejemplo (nombre ficticio, colores, fechas) para simular un certificado real
- **Escalado automatico:** El iframe se escala proporcionalmente segun el tamano del contenedor, respetando las dimensiones reales del documento (ej: 1056x816 para carta horizontal)
- **Responsive a orientacion/tamano:** Al cambiar la orientacion o tamano de pagina en el formulario, el preview se ajusta automaticamente a las nuevas dimensiones
- **Toggle show/hide:** Boton para mostrar u ocultar el panel de preview. Al ocultar, el editor ocupa todo el ancho
- **Indicadores visuales:** Muestra las dimensiones del documento y el porcentaje de zoom actual
- **Barra de placeholders:** Lista de placeholders disponibles como referencia rapida

**Datos de ejemplo usados en el preview:**
- `participant_name`: "Juan Carlos Perez Lopez"
- `course_name`: "Diplomado en Gestion de Proyectos"
- `org_name`: "Universidad Ejemplo"
- `primary_color`: "#1e3a5f"
- `secondary_color`: "#c9a84c"
- Y otros datos representativos para todas las variables soportadas

**Flujo de uso:**
1. El usuario abre el modal de nueva plantilla o edicion (se usa modal tamano `xl`)
2. El preview se muestra activo por defecto junto al editor de HTML/CSS
3. Al escribir o modificar el HTML, el preview se actualiza instantaneamente
4. Al cambiar orientacion o tamano de pagina, el preview refleja las nuevas dimensiones
5. El boton "Preview en vivo" permite ocultar/mostrar el panel segun necesidad

---

### Modulo: Frontend - Configuracion (Admin)

**Estado:** Pendiente

> Se documentara: gestion de branding institucional, historial de versiones, preview de certificado.

---

### Modulo: Seguridad

**Estado:** Pendiente

> Se documentara: rate limiting, CORS, helmet, validacion de entrada, control de acceso por rol, filtrado por dependencia, aislamiento de datos.

---

### Modulo: Produccion

**Estado:** Implementado

Configuracion de produccion con nginx como reverse proxy, build optimizado del frontend y backend sin hot reload.

**Archivos:**
- `docker-compose.prod.yml` — Orquestacion de produccion (3 servicios, restart automático)
- `frontend/Dockerfile.prod` — Multi-stage: build Vite + servir con nginx
- `backend/Dockerfile.prod` — Node.js con `NODE_ENV=production`, sin nodemon
- `frontend/nginx.conf` — Reverse proxy: SPA fallback + proxy `/api` y `/storage` al backend
- `.env.prod` — Variables de entorno de produccion (requiere configuracion manual)

#### Despliegue en produccion

1. Configurar variables de entorno:
```bash
# Editar .env.prod con valores reales
nano .env.prod
# IMPORTANTE: cambiar POSTGRES_PASSWORD, JWT_SECRET y BASE_URL
```

2. Construir y levantar:
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

3. Verificar que los servicios estan corriendo:
```bash
docker compose -f docker-compose.prod.yml ps
```

4. Acceder via puerto 80 (nginx sirve frontend y proxea API).

#### Diferencias entre desarrollo y produccion

| Aspecto | Desarrollo | Produccion |
|---|---|---|
| Frontend | Vite dev server (HMR) en :5173 | Build estatico servido por nginx en :80 |
| Backend | nodemon con hot reload | `node src/index.js` directo |
| NODE_ENV | development | production |
| Volumenes src | Montados (hot reload) | No montados (copiados en imagen) |
| API URL | `http://localhost:3000/api` | `/api` (proxy nginx) |
| Puertos expuestos | 5173, 3000, 5432 | Solo 80 |
| DB | Puerto accesible externamente | Solo accesible internamente |

#### Arquitectura de produccion

```
        :80
         |
      [nginx]
      /      \
   SPA      /api/ --> [backend:3000] --> [database:5432]
   /storage/ --------/
```

Nginx sirve los archivos estaticos del frontend y redirige `/api/*` y `/storage/*` al backend. Todas las rutas del SPA caen en `index.html` via `try_files`.

#### Respaldo y restauracion

Los datos se almacenan en carpetas locales (no en volumenes Docker):
- `database/data/` — Datos de PostgreSQL
- `storage/certificates/` — PDFs generados
- `storage/logos/` — Logos de dependencias y branding

**Generar respaldo:**
```bash
npm run backup
# Genera database/backup.tar.gz y storage/backup.tar.gz
```

**Restaurar desde respaldo:**
```bash
npm run down
npm run restore
npm run up:build   # o: docker compose -f docker-compose.prod.yml up --build -d
```

**Snapshot rapido (antes de operaciones destructivas):**
```bash
npm run snapshot
# Genera snapshot.tar.gz (separado del backup principal)
```

**Reset completo (snapshot + limpiar + reconstruir):**
```bash
npm run reset
```

**Migrar datos entre maquinas:**
```bash
# Origen: generar backup y subir
npm run backup && git add . && git commit -m "backup" && git push

# Destino: descargar y sincronizar
git pull && npm run pull:sync
```

> **Nota:** Los archivos backup.tar.gz se incluyen en git para facilitar la migracion. En produccion con volumenes grandes, considerar almacenamiento externo (S3, etc.).

---

## API Reference

> Se completara con la documentacion detallada de cada endpoint a medida que sean implementados. Formato por endpoint:
>
> **METODO /ruta**
> - Descripcion
> - Autenticacion requerida: si/no
> - Roles permitidos: admin / emisor / publico
> - Filtrado por dependencia: si/no
> - Body/Params esperados
> - Respuesta exitosa (ejemplo)
> - Errores posibles

---

## Licencia

Pendiente de definicion.
