# Registro de decisiones

Formato: contexto -> decision -> alternativas descartadas -> consecuencias.
Las entradas nuevas van al final. No se borran: si una decision cambia, se agrega
otra que la reemplace y se marca la anterior como "Reemplazada por #N".

---

## #1 - Correr todo en local con datos restaurados (2026-10-21)

- **Contexto:** el dominio de produccion (`certify.vinsmake.dev`) dejo de existir.
- **Decision:** usar todas las URLs con `localhost` y restaurar la BD y el storage desde los backups.
  Las URLs de ejemplo fijas a `vinsmake.dev` en el preview de plantillas pasan a usar
  `VERIFICATION_BASE_URL` / `window.location.origin`.
- **Consecuencias:** los QR apuntan a `localhost`. `.env.prod` y `docker-compose.prod.yml`
  siguen apuntando al dominio viejo y no se usan.

## #2 - Reiniciar la BD a cero y cambiar la contraseña inicial (2026-10-21)

- **Contexto:** el usuario queria empezar limpio.
- **Decision:** borrar `database/data` y el storage y re-sembrar. El hash del admin en el seed
  se cambio a la nueva contraseña (ver `credenciales.md`).
- **Consecuencias:** los datos de produccion solo existen en `database/backup.tar.gz` y
  `storage/backup.tar.gz`. El usuario de dependencia `ps.enrique.e@gmail.com` ya no existe.

## #3 - Migraciones obligatorias para cambios de schema (2026-10-21)

- **Contexto:** antes los cambios de schema se hacian editando `database/init/01_schema.sql`
  (y algunos con scripts sueltos 02/03). Eso no permite actualizar una BD existente
  sin perder datos.
- **Decision:** todo cambio de schema va como migracion versionada, aplicada automaticamente
  al arrancar el backend. Se puede editar la BD libremente porque no hay produccion, pero
  siempre por migraciones.
- **Alternativas:** se empezo a montar Knex (ya era dependencia) y se descarto en favor de
  Prisma (decision #4).

## #4 - Reestructura: TypeScript + Prisma, back y front (2026-10-21)

- **Contexto:** el usuario pidio reestructurar todo segun las mejores practicas actuales para
  facilitar el desarrollo, el mantenimiento y las actualizaciones. Se le presentaron opciones
  y eligio:
  - ORM: **Prisma** (schema central, Prisma Migrate, cliente tipado), en lugar de Knex + SQL crudo.
  - Lenguaje: **TypeScript en backend y frontend**, en lugar de solo backend o seguir en JS.
  - Orden: **reestructura primero** y despues la nueva pagina de curso, en lugar de feature primero.
- **Decision:** las metas de la reestructura son mantener el contrato de la API (mismas rutas y
  formas de respuesta) para que el frontend siga funcionando durante la transicion; validar
  con Zod; organizar el backend en modulos por dominio; agregar lint, format, tests y CI.
  (CI descartado por el usuario: ver #10.)
- **Consecuencias:** se reescriben los modelos SQL crudos a Prisma. Las consultas complejas
  (agregados JSON, estadisticas) pueden usar `prisma.$queryRaw` tipado.
  `database/init/` deja de ser la fuente del schema.

## #5 - Pagina de curso como centro del flujo (2026-10-21, implementada: ver #9)

- **Contexto:** hoy se crean cursos, se inscriben participantes y la emision vive en una pagina
  aparte (`/emitir`).
- **Decision (pedida por el usuario):** la pagina del curso concentra sus participantes, su diseño
  de certificado, su generador y la lista de certificados emitidos. Los certificados se pueden
  reimprimir conservando el mismo UUID, y por tanto el mismo QR.
- **Diseño acordado hasta ahora:**
  - `courses.template_id`: plantilla asignada al curso, con preview usando datos reales del curso.
  - `certificates.reprint_count` y `last_reprinted_at`.
  - La reimpresion regenera el PDF con el mismo UUID y la misma fecha de emision, y la
    version de branding original. Usa los datos actuales del participante y del curso y la
    plantilla actual del curso. El PDF anterior no se borra.
  - No se reimprimen certificados revocados.

## #6 - Arquitectura del backend v2 (2026-10-21)

Detalle de la decision #4 aplicada al backend:

- **Monorepo con npm workspaces**: `packages/shared` (`@certify/shared`), `backend` (`@certify/backend`)
  y `frontend`. Un solo `package-lock.json` en la raiz.
- **`@certify/shared`**: enums de dominio y esquemas Zod de entrada (snake_case, igual que la API).
  Se consume como fuente TS, sin build: tsup lo empaqueta en el backend y Vite en el frontend.
- **Node 24 LTS** (Node 20 llego a EOL en abril de 2026).
- **Express 5**: maneja los errores async de forma nativa, sin try/catch ni asyncHandler en los handlers.
- **Prisma 7** con `prisma.config.ts`, adapter `@prisma/adapter-pg` y cliente generado en
  `backend/src/generated/prisma` (no versionado).
  - Los campos se quedan en **snake_case** para no romper el contrato de la API. Los modelos van
    en PascalCase con `@@map`.
  - Los estados pasan a ser enums de Postgres: `Role`, `CourseType`, `AttendanceStatus`,
    `CertificateStatus`, `Orientation`, `PageSize`.
  - Las consultas de agregacion (stats, admin) van en `$queryRaw` con casts `::int`, para no
    devolver BigInt.
- **Estructura**: `src/modules/<dominio>/<dominio>.routes.ts` (HTTP + validacion) y `<dominio>.service.ts`
  (logica + Prisma). Infraestructura comun en `src/lib`, middlewares en `src/middlewares` y
  generacion de certificados (HTML, QR, PDF) en `src/rendering`.
- **Validacion** con helpers `parseBody/parseQuery/parseParams` (Zod) dentro de cada handler.
  Respuesta 400 con el formato heredado: `{ error, details: [{ field, message }] }`.
- **Seed** idempotente en `prisma/seed.ts`. Las plantillas viven como archivos en `prisma/seed-data/templates/`.
  El admin inicial sale de `SEED_ADMIN_EMAIL/PASSWORD`; ya no hay un hash fijo en SQL.
- **Logs** con pino (pino-pretty en desarrollo). Las variables de entorno se validan con Zod al arrancar.
- **PDF**: puppeteer-core con el Chromium del sistema y un solo navegador reutilizado.
- **Desarrollo en Docker**: el repo completo se monta en `/app`. `npm run setup` instala las dependencias
  dentro del contenedor. (Corregido en la misma fase: `node_modules` vive en volumenes de Docker porque
  instalar sobre el bind mount de Windows tardaba mas de 30 minutos; el IDE usa Dev Containers.)
- **Alternativas descartadas**: Knex (decision #3), nombres camelCase con mapeo (demasiada
  superficie de cambio para el frontend) y Drizzle (el usuario eligio Prisma).

### Cambios de comportamiento intencionales en v2
- Un solo criterio de acceso a cursos y certificados: admin, dependencia duena o dependencia colaboradora.
  Antes, emitir revisaba las colaboradoras pero ver o descargar revisaba solo la duena.
- En los updates, `undefined` conserva el valor y `null` lo borra. Antes, COALESCE impedia borrar campos.
- No se puede borrar un curso con certificados (409) ni una version de branding usada por certificados.
- Borrar un participante borra sus inscripciones (cascade), pero no si tiene certificados (409).
- Nuevos endpoints: `DELETE /api/courses/:id/participants/:participantId` (baja) y
  `POST /api/certificates/:id/reprint`.
- `GET /api/courses/:id/participants` incluye `certificate` por participante, y el listado de cursos incluye
  `template_id`/`template_name`.
- Los errores de multer (formato o tamaño de imagen) responden 400 en lugar de 500.

## #7 - Arquitectura del frontend v2 (2026-10-21)

Detalle de la decision #4 aplicada al frontend:

- **TypeScript estricto** (mismo `tsconfig.base.json` que el backend). Tipos de entrada desde los
  esquemas Zod de `@certify/shared` y de salida desde `packages/shared/src/responses.ts`, que documenta
  el contrato de la API. Si el backend cambia una respuesta se actualiza ahi y el typecheck senala los usos.
- **React 19, React Router 8** (modo declarativo `BrowserRouter`) y **Vite 8**. Una pagina = un chunk (`lazy`).
- **TanStack Query** para todo dato del servidor: cache, estados de carga y refresco por invalidacion.
  Las claves estan centralizadas en `src/api/keys.ts` con prefijo por dominio, y las mutaciones usan
  `useApiMutation` (invalida, muestra toast de exito y de error). Reemplaza el patron
  `useEffect + useState + callback de recarga` que se repetia en cada pagina.
- **Validacion de formularios con los mismos esquemas Zod** del backend (`lib/form.ts`), asi los mensajes y
  reglas coinciden.
- **Estilos con clases CSS** y tokens en `styles/global.css` en lugar de objetos de estilo en linea por
  componente (el codigo se redujo de ~7.900 a ~5.100 lineas con mas funcionalidad).
- **Rutas relativas** `/api` y `/storage`: Vite hace proxy en desarrollo (`BACKEND_URL`) y nginx en
  produccion. Se elimino `VITE_API_URL`.
- **Alternativas descartadas**: Tailwind o una libreria de componentes (cambio visual grande sin pedirlo;
  se conserva el aspecto existente), React Router en modo framework/data (no aporta para una SPA con
  autenticacion por token) y Redux/Zustand (el estado del cliente es minimo; el del servidor lo lleva Query).

## #8 - Las vistas previas las renderiza el backend (2026-10-21)

- **Contexto:** el editor de plantillas tenia en el frontend una copia de los datos de ejemplo y del
  reemplazo de variables, que ya se habia desincronizado del backend (nombres de variables, archivo de firma
  mal escrito).
- **Decision:** `POST /api/templates/render` devuelve el HTML de una plantilla con datos de ejemplo y
  `POST /api/courses/:id/certificate-preview` el del certificado del curso con sus datos reales y un
  participante de ejemplo (HTML o PDF). El frontend solo lo muestra en un iframe con `sandbox`.
- **Consecuencias:** una sola implementacion del renderizado; la vista previa es exactamente lo que se emite.
  Se elimino `GET /api/templates/sample-qr`.

## #9 - Pagina del curso implementada (2026-10-21)

Implementa la decision #5:

- Ruta `/cursos/:id/:tab` con pestañas Participantes, Diseño, Generar, Certificados e Informacion.
  La pestaña va en la URL para poder enlazarla (por ejemplo, tras crear un curso se abre Participantes).
- Se eliminaron la pagina `/emitir` (redirige a `/cursos`) y el modal de detalle del curso.
- Diseño: guardar la plantilla cambia `courses.template_id`; los certificados ya emitidos no cambian
  hasta reimprimirlos.
- Generar: solo muestra a quien tiene asistencia completada y no tiene certificado valido; la emision
  usa la plantilla del curso.
- Certificados: reimpresion con confirmacion (explica que se conserva el QR) y enlace a la verificacion publica.
- Participantes: inscripcion por busqueda con seleccion multiple y accion "Marcar todos como completados".

## #10 - Sin CI por ahora (2026-10-21)

- **Contexto:** el plan de la reestructura incluia GitHub Actions.
- **Decision (del usuario):** no se pidio CI, solo la reestructura. No se agrega.
- **Consecuencias:** la verificacion es local: `npm run check` (typecheck + lint + tests de todos los
  paquetes, dentro de Docker). Si en el futuro se quiere CI, basta con correr ese mismo comando.
