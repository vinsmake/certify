# Conocimiento del proyecto

Datos que sabemos y que no son obvios desde el codigo.

## Que es Certify

Plataforma para emitir, gestionar, revocar y verificar certificados digitales de cursos,
talleres, charlas, seminarios y diplomados. Cada certificado es un PDF generado con
Puppeteer desde una plantilla HTML/CSS e incluye un QR a la pagina publica
`/verificar/<uuid>`. Se usa en un contexto de gobierno, con unidades organizacionales
llamadas "dependencias".

- Roles: `admin` (todo) y `dependencia` (solo los datos de su dependencia).
- Un curso puede tener varias dependencias colaboradoras, y sus logos y firmas salen en el certificado.
- El branding esta versionado: cada certificado guarda la version con la que se emitio.
- Los certificados no se borran: se revocan, y queda un registro en `revocation_log`.

## Reglas del proyecto (definidas por el usuario)

- **No ejecutar ni instalar nada fuera de Docker.** Los `npm install`, builds, migraciones
  y tests se corren dentro de contenedores (`docker compose exec` / `docker compose run`).
- No usar emojis (codigo, UI, docs ni commits).
- Idioma: la UI, la documentacion y los comentarios van en español. Los identificadores
  de codigo van en ingles.
- Hacer commits solo cuando el usuario lo pida. El usuario a veces hace commit por su cuenta.
- El proyecto esta en desarrollo y no hay produccion activa (desde 2026-10-21): se puede
  modificar la BD libremente. Aun asi, todo cambio de schema va como **migracion**, para
  que un futuro despliegue sea limpio.

## Estado del entorno (2026-10-21)

- El dominio `certify.vinsmake.dev` ya no existe. Todo corre en local (ver `entorno-local.md`).
- La BD local se reinicio a cero: solo existen los datos del seed (admin, "Dependencia General",
  branding v1 y 4 plantillas).
- Las credenciales del admin estan en `credenciales.md`.

## Trampas conocidas

- `database/backup.tar.gz` es un **PGDATA crudo de produccion** (PG16, rol `vinsmake`, base
  `certify`), no un dump. Para restaurarlo, `.env` debe usar las credenciales de `.env.prod`.
- Postgres solo ejecuta `/docker-entrypoint-initdb.d` si el directorio de datos esta vacio.
- `env_file` se lee al crear el contenedor: despues de cambiar `.env`, usar
  `docker compose up -d` (recrea el contenedor), no `restart`.
- El backup de storage no incluye `storage/signatures/`: hay que crearla a mano.
- El branding v1 del seed apunta a `/storage/logos/branding/default_logo.png`, que no existe.
  Los PDFs se generan igual, pero sin logo institucional.
- `VERIFICATION_BASE_URL` define la URL del QR. En local es `localhost`, asi que el QR solo
  abre desde la misma maquina.
- Los static files (`/storage/logos`, `/storage/signatures`) se sirven **antes** de helmet
  para evitar el bloqueo CORP. Los PDFs solo se sirven por el endpoint autenticado.
- Las rutas de API de estadisticas son `GET /api/stats` (global) y `GET /api/stats/me`.
  `/api/stats/dashboard` no existe.

## Desarrollo (v2, desde 2026-10-21)

- Primera vez: `npm run setup` (instala en el contenedor) y luego `npm run up:build`.
- El backend aplica las migraciones y el seed en cada arranque de desarrollo (`npm run dev` del backend).
- Para cambiar el schema: editar `backend/prisma/schema.prisma` y correr `npm run db:migrate -- --name <cambio>`.
  Eso crea la migracion en `backend/prisma/migrations/` (versionada) y regenera el cliente.
- **Trampa:** `npm install` sobre un bind mount de Windows es muy lento (mas de 20 minutos la primera vez).
  Si se vuelve un problema, mover el repo dentro del filesystem de WSL2.
- **Trampa:** en un bind mount de Windows los watchers no reciben eventos de archivos. nodemon usa
  `legacyWatch` (polling) y Vite usa `usePolling`.
- Tests: `npm test` (raiz) corre Vitest en el contenedor del backend contra la BD `<POSTGRES_DB>_test`,
  que se migra sola.
