# Conocimiento del proyecto

Datos que sabemos y que no son obvios desde el codigo.

## Que es Certify

Plataforma para emitir, gestionar, revocar y verificar certificados digitales de cursos,
talleres, charlas, seminarios y diplomados. Cada certificado es un PDF generado con
Puppeteer desde una plantilla HTML/CSS e incluye un QR a la pagina publica
`/verificar/<uuid>`. Se usa en un contexto de gobierno, con unidades organizacionales
llamadas "dependencias".

- Roles: `admin` (todo) y `dependencia` (solo los datos de su dependencia).
- **Todo el diseño del certificado es por curso** (decision #11, 2026-10-22): HTML propio, logo, organizacion,
  colores, fuente, firma del instructor y logo/firma/firmante de cada colaboradora. Se edita en la pestaña
  Diseño del curso. No hay branding global ni pagina Configuracion.
- Un curso puede tener varias dependencias colaboradoras; su logo y firma en el certificado son del curso.
- Las plantillas son solo puntos de partida: el curso copia una y edita su copia.
- Los certificados no se borran: se revocan, y queda un registro en `revocation_log`.

## Reglas del proyecto (definidas por el usuario)

- **No ejecutar ni instalar nada fuera de Docker.** Los `npm install`, builds, migraciones
  y tests se corren dentro de contenedores (`docker compose exec` / `docker compose run`).
- No usar emojis (codigo, UI, docs ni commits).
- Idioma: la UI, la documentacion y los comentarios van en español. Los identificadores
  de codigo van en ingles.
- Hacer commits solo cuando el usuario lo pida. El usuario a veces hace commit por su cuenta.
- Commits limpios por bloque (pedido 2026-10-21): un commit por bloque logico (API, frontend, feature, docs),
  cada uno verificado. Antes de commitear revisar `git status`: los `git rm` quedan en el index y se cuelan
  en el siguiente commit aunque se agreguen rutas concretas.
- El proyecto esta en desarrollo y no hay produccion activa (desde 2026-10-21): se puede
  modificar la BD libremente. Aun asi, todo cambio de schema va como **migracion**, para
  que un futuro despliegue sea limpio.

## Estado del entorno (2026-10-21)

- El dominio `certify.vinsmake.dev` ya no existe. Todo corre en local (ver `entorno-local.md`).
- La BD local se reinicio a cero: solo existen los datos del seed (admin, "Dependencia General",
  4 plantillas base).
- Las credenciales del admin estan en `credenciales.md`.

## Trampas conocidas

- `database/backup.tar.gz` es un **PGDATA crudo de produccion** (PG16, rol `vinsmake`, base
  `certify`), no un dump. Para restaurarlo, `.env` debe usar las credenciales de `.env.prod`.
- Postgres solo ejecuta `/docker-entrypoint-initdb.d` si el directorio de datos esta vacio.
- `env_file` se lee al crear el contenedor: despues de cambiar `.env`, usar
  `docker compose up -d` (recrea el contenedor), no `restart`.
- El backup de storage no incluye `storage/signatures/`: hay que crearla a mano.
- Si un curso no tiene logo, el certificado usa un GIF transparente (`EMPTY_IMAGE`) para no mostrar el icono
  de imagen rota. (Antes el seed apuntaba a un `default_logo.png` inexistente; la migracion lo descarto.)
- `VERIFICATION_BASE_URL` define la URL del QR. En local es `localhost`, asi que el QR solo
  abre desde la misma maquina.
- Los static files (`/storage/logos`, `/storage/signatures`) se sirven **antes** de helmet
  para evitar el bloqueo CORP. Los PDFs solo se sirven por el endpoint autenticado.
- Las rutas de API de estadisticas son `GET /api/stats` (global) y `GET /api/stats/me`.
  `/api/stats/dashboard` no existe.

## Desarrollo (v2, desde 2026-10-21)

- Primera vez: `npm run setup` (construye las imagenes e instala dentro del contenedor) y luego `npm run up`.
- El backend aplica las migraciones y el seed en cada arranque de desarrollo (`npm run dev` del backend).
- Para cambiar el schema: editar `backend/prisma/schema.prisma` y correr `npm run db:migrate -- --name <cambio>`.
  Eso crea la migracion en `backend/prisma/migrations/` (versionada) y regenera el cliente.
- Para agregar una dependencia: `docker compose run --rm --no-deps backend sh -c "cd /app && npm install <pkg> -w @certify/backend"`.
- `node_modules` vive en **volumenes de Docker**, no en el host. Para tener tipos en el editor, abrir el repo
  con Dev Containers (`.devcontainer/`). Si cambian las dependencias, volver a correr `npm run setup`.
- **Trampa:** `npm install` sobre el bind mount de Windows tardaba mas de 30 minutos; en volumen tarda ~1 minuto.
  Por eso `node_modules` no se monta desde el host.
- **Trampa:** en un bind mount de Windows los watchers no reciben eventos de archivos. nodemon usa
  `legacyWatch` (polling) y Vite usa `usePolling`.
- **Trampa:** npm 11 bloquea los install scripts que no estan en `allowScripts` (`package.json` raiz).
  Si una dependencia nueva los necesita (motores, binarios nativos), hay que aprobarla con
  `npm install-scripts approve <pkg>`.
- **Trampa:** Vitest define `process.env.BASE_URL = '/'`. Por eso la variable del origen del frontend se
  llama `FRONTEND_URL`.
- **Trampa:** `prisma.config.ts` exige `DATABASE_URL` incluso para `prisma generate`. En el build de
  produccion se pasa un valor de relleno.
- Tests: `npm test` (raiz) corre Vitest en el contenedor del backend contra la BD `<POSTGRES_DB>_test`,
  que se migra sola. Cubren el flujo completo, con PDF real (Chromium) incluido.
- Tests: el frontend no tiene tests automaticos todavia; se verifica con typecheck, lint, build y prueba en
  navegador.
- **Trampa:** Prisma Studio (dependencia de prisma) trae React 18 y npm lo eleva a la raiz del monorepo, mientras
  el frontend usa React 19 en `frontend/node_modules`. Sin `resolve.dedupe` en `vite.config.ts`, TanStack Query
  (elevado a la raiz) toma React 18 y la app queda en blanco ("Invalid hook call").
- **Trampa:** `.env` trae `NODE_ENV=development` y los contenedores lo heredan; `vite build` con eso genera un
  bundle de desarrollo. El script `build` del frontend fuerza `NODE_ENV=production`.
- **Trampa:** escribir varios archivos con heredoc en el Bash de esta maquina puede fallar al parsear
  ("unexpected EOF"); usar la herramienta de escritura de archivos.
- **Trampa:** dentro de `node -e "..."` en Bash, los backticks (template strings) se ejecutan como comandos del
  shell y se pierden. Para scripts con backticks, escribir un archivo `.cjs` en el scratchpad y ejecutarlo.
  Node de Windows no ve `/tmp` de Git Bash.
- **Trampa:** `prisma migrate dev` no funciona sin terminal interactiva. Para crear una migracion: editar
  `schema.prisma`, generar el SQL con `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`,
  guardarlo en `prisma/migrations/<fecha>_<nombre>/migration.sql` (ajustando la copia de datos a mano) y aplicar con
  `npx prisma migrate deploy` + `npx prisma generate`.
- Prisma 8 esta en RC (2026-10). Se fijo 7.10.1; actualizar cuando salga estable, siguiendo su guia de migracion.
