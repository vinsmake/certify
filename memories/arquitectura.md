# Arquitectura (v2, desde 2026-10-21)

Vista general del sistema tal como esta hoy. El porque de cada eleccion esta en `decisiones.md`
(#4, #6, #7, #8 y #9). La version anterior se conserva en `arquitectura-v1.md`.

## Stack

| Capa | Tecnologia |
|---|---|
| Monorepo | npm workspaces: `packages/shared`, `backend`, `frontend`. Un solo `package-lock.json` |
| Compartido | `@certify/shared`: enums, esquemas Zod de entrada y tipos de respuesta de la API |
| Backend | Node 24, Express 5, TypeScript, Prisma 7 (PostgreSQL 16), Zod 4, pino, Puppeteer (Chromium del sistema) |
| Frontend | React 19, React Router 8, TanStack Query 5, axios, Vite 8, TypeScript |
| Calidad | `tsc` estricto, ESLint 10 + typescript-eslint, Prettier, Vitest + supertest (backend) |
| Contenedores | Docker Compose (dev y prod). nginx sirve el frontend en produccion |

## Flujo de una peticion

```
Navegador
  -> /            SPA (Vite en dev :5173, nginx en prod :8080)
  -> /api/...     proxy -> backend :3000 (Vite en dev, nginx en prod)
  -> /storage/... proxy -> backend (logos y firmas publicos; los PDF solo por endpoint autenticado)
Backend -> PostgreSQL (Prisma) y storage en disco (/app/storage)
```

El frontend usa siempre rutas relativas (`/api`, `/storage`), asi no necesita saber donde esta el backend.

## Estructura del repositorio

```
packages/shared/src/
  enums.ts        valores de dominio (roles, tipos de curso, estados...)
  schemas.ts      esquemas Zod de entrada de cada endpoint (backend valida, frontend valida formularios)
  responses.ts    formas de las respuestas JSON (contrato que consume el frontend)

backend/
  prisma/schema.prisma, migrations/, seed.ts, seed-data/templates/*.html
  src/
    app.ts, index.ts
    config/env.ts           variables de entorno validadas con Zod
    lib/                    prisma, errores HTTP, auth (JWT/bcrypt), storage (multer), logger
    middlewares/            authenticate, requireRole, scopeToDependency, validacion, errores
    rendering/              certificado: variables de plantilla, QR, PDF (Puppeteer)
    modules/<dominio>/      <dominio>.routes.ts (HTTP + validacion) y <dominio>.service.ts (logica + Prisma)
  test/                     Vitest contra la BD <POSTGRES_DB>_test

frontend/src/
  main.tsx, App.tsx        QueryClient, AuthProvider y rutas (carga diferida por pagina)
  api/                     index.ts (una funcion tipada por endpoint), keys.ts (claves de query),
                           queries.ts (catalogos reutilizados), useApiMutation.ts (mutacion + invalidacion + toasts)
  auth/                    AuthContext, useAuth, ProtectedRoute (adminOnly)
  components/ui/           Button, Field (Input/Select/Textarea), Modal, Table, Pagination, Badge, Alert...
  components/<dominio>/    piezas reutilizadas entre paginas (CourseForm, CertificateDetailModal, CertificatePreview...)
  lib/                     http (axios), format, files (descarga de PDF), form (validacion Zod), toast
  pages/                   una pagina por ruta; pages/courses/tabs/ con las pestañas del curso
  styles/global.css        tokens de diseño y clases (btn, card, table, field, tabs, modal...)
```

## Modulos del backend y endpoints

Todos bajo `/api`. Autenticacion con `Authorization: Bearer <JWT>` salvo login, verificacion y health.

| Modulo | Endpoints principales |
|---|---|
| auth | `POST /auth/login`, `GET /auth/me` |
| users (admin) | `GET/POST /users`, `PUT/DELETE /users/:id` |
| dependencies | `GET /dependencies`, `POST/PUT/DELETE` (admin). Solo nombre y abreviatura |
| tags | CRUD `/tags` y `POST /tags/:id/logo` |
| templates (plantillas base) | `GET /templates`, `GET /:id`, CRUD (admin), `PUT /:id/default`, `POST /:id/preview` (PDF de ejemplo), `POST /templates/render` (HTML de ejemplo para el editor) |
| participants | CRUD `/participants` (filtros search, dependency_id, course_id, tag_id), `GET /:id/certificates` |
| courses | CRUD `/courses`; `GET/POST /:id/participants`, `PUT/DELETE /:id/participants/:participantId`; diseño: `PUT /:id/design`, `POST /:id/design/apply-template`, `POST/DELETE /:id/logo`, `POST/DELETE /:id/signature` (instructor), `POST /:id/certificate-preview` (acepta borrador); colaboradoras: `POST/DELETE /:id/dependencies/:depId` (admin), `PUT /:id/dependencies/:depId` (firmante), `POST/DELETE /:id/dependencies/:depId/logo` y `/signature` |
| certificates | `GET /certificates`, `GET /:id`, `POST /emit`, `GET /:id/download`, `POST /:id/reprint`, `POST /:id/revoke` |
| verification | `GET /verify/:uuid` (publico) |
| stats | `GET /stats` (admin), `GET /stats/me`, `GET /stats/dependency/:id` |
| admin | `GET /admin/events`, `GET /admin/certificates`, `GET /admin/activity` |

Errores: `{ error, details?: [{ field, message }] }`. 400 validacion, 401 sin sesion, 403 sin permiso,
404 no existe, 409 conflicto (duplicado o regla de negocio).

## Acceso por rol

- **admin**: todo. Gestiona usuarios, dependencias, plantillas base y agrega/quita colaboradoras de un curso.
- **dependencia**: sus participantes y los cursos donde su dependencia es duena o colaboradora
  (y los certificados de esos cursos). Un curso que crea queda a nombre de su dependencia.

## Pagina del curso (`/cursos/:id/:tab`)

Concentra el ciclo de vida del curso (decisiones #5, #9 y #11):

| Pestaña | Que hace |
|---|---|
| Participantes | Inscribir (buscador con seleccion multiple), asistencia, baja, estado del certificado |
| Diseño | TODO el certificado del curso: HTML propio con vista previa en vivo, cargar plantilla base, organizacion, colores, fuente, formato, logo, firma del instructor y colaboradoras (logo, firma, firmante) |
| Generar | Emitir a quienes completaron y no tienen certificado valido |
| Certificados | Emitidos del curso: PDF, detalle, reimpresion (mismo QR) y revocacion (desde el detalle) |
| Informacion | Datos generales, edicion y eliminacion |

## Generacion de certificados

1. HTML: la copia propia del curso (`courses.certificate_html`), con su orientacion y tamaño.
2. Variables `{{...}}`: participante, curso, diseño del curso (logo, organizacion, colores, fuente),
   colaboradoras (logos y firmas del curso en base64) y QR. `backend/src/rendering/certificate-html.ts`
   documenta la lista.
3. Puppeteer renderiza el HTML a PDF y se guarda en `storage/certificates/`.
4. **Reimpresion**: mismo `uuid` (mismo QR) y misma `issue_date`; datos y diseño actuales del curso.
   Archivo `certificate_<uuid>_r<n>.pdf`; el anterior no se borra.
5. **Revocacion**: el certificado nunca se borra; queda `revoked` y se registra en `revocation_log`.

Las vistas previas (editor de plantillas y pestaña Diseño) usan el mismo renderizado del backend,
asi lo que se ve es exactamente lo que se emitira (decision #8).

## Datos

El schema vive en `backend/prisma/schema.prisma` y se aplica solo con migraciones
(`backend/prisma/migrations/`). Tablas: dependencies, users, certificate_templates, courses,
course_dependencies, participants, tags, participant_tags, course_participants, certificates,
revocation_log. (`branding_versions` existio hasta la migracion `20261022120000_diseno_por_curso`.)
