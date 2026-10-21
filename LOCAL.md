# Certify en local

Guia para correr la plataforma completa en una maquina local. El dominio de produccion
(`certify.vinsmake.dev`) ya no existe, asi que todo apunta a `localhost`.

## Que es

Plataforma para emitir, gestionar, revocar y verificar certificados digitales (cursos, talleres,
diplomados). Cada certificado es un PDF con QR que enlaza a una pagina publica de verificacion.

| Servicio | Tecnologia | URL local |
|---|---|---|
| frontend | React 18 + Vite (dev server con hot reload) | http://localhost:5173 |
| backend | Express + pg + Puppeteer (PDF) + qrcode + JWT | http://localhost:3000/api |
| database | PostgreSQL 16 (alpine) | localhost:5432 |

### Piezas clave

- `backend/src/` — `routes/` (validacion + middleware) → `controllers/` → `models/` (SQL directo con `pool.query`) y `services/` (PDF, QR, plantillas, branding).
- `frontend/src/` — `pages/` (admin/ = solo admin), `components/`, `services/` (axios contra `VITE_API_URL`, default `http://localhost:3000/api`).
- `database/init/*.sql` — schema; solo se ejecuta si `database/data/` esta vacio.
- `storage/` — logos, firmas y PDFs; se monta en `/app/storage` del backend.

### Roles

- `admin`: acceso total (usuarios, dependencias, plantillas, tags, branding, vista global).
- `dependencia`: solo ve y gestiona los datos de su dependencia.

### Flujo principal

1. Admin configura branding, dependencias (logo, encargado, firma), plantillas HTML/CSS y tags.
2. Se crea un curso, se inscriben participantes y se emiten certificados.
3. El backend renderiza la plantilla con Puppeteer → PDF con QR a `VERIFICATION_BASE_URL/<uuid>`.
4. Cualquiera puede verificar en `/verificar/<uuid>` sin cuenta; los certificados se pueden revocar.

## Levantar desde cero

Requisitos: Docker Desktop corriendo, Node/npm (solo para los scripts de la raiz) y Git Bash.

```bash
# 1. .env local: credenciales de BD tomadas de .env.prod (ver nota abajo), URLs en localhost
#    (ya existe un .env generado; si no, copiar .env.example y pegar POSTGRES_USER/PASSWORD/DB de .env.prod)

# 2. Restaurar datos
npm run restore:db        # database/backup.tar.gz -> database/data (PGDATA)
npm run restore:storage   # storage/backup.tar.gz  -> storage/certificates, storage/logos
mkdir -p storage/signatures   # el backup no la incluye

# 3. Levantar
npm run up:build          # docker compose up --build -d
npm run logs              # seguir logs
```

Comprobar: `curl localhost:3000/api/health` → `{"status":"ok"}` y abrir http://localhost:5173.

### Base de datos limpia (estado actual)

La BD local se reinicio a cero: solo existe lo que siembra `database/init/` (admin,
"Dependencia General", branding v1 y 4 plantillas). Para volver a cero en cualquier momento:

```bash
npm run remake   # borra database/data y storage, reconstruye; init/ vuelve a sembrar
mkdir -p storage/signatures
```

Para recuperar los datos de produccion en lugar de empezar limpio, usar `restore:db` +
`restore:storage` como arriba (requiere las credenciales de `.env.prod` en `.env`).

### Credenciales

- Admin: `vinsmakedev@gmail.com` / `@Vinsmake2121` (hash sembrado en `database/init/01_schema.sql`).
- BD: usuario/clave/base de `.env` (iguales a `.env.prod`). Consola:
  `docker compose exec database sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB'`

## Notas importantes

- **El backup es el PGDATA de produccion**, no un dump: el rol y la base ya existen dentro
  (`vinsmake` / `certify`). Por eso `.env` usa las credenciales de `.env.prod`; con las de
  `.env.example` (`credenciales_user`) el backend falla con `role ... does not exist`, ya que
  Postgres omite `database/init/` cuando `database/data` no esta vacio.
- Al cambiar `.env` hay que **recrear** contenedores (`docker compose up -d`), no solo reiniciarlos.
- `VERIFICATION_BASE_URL` define a donde apunta el QR del PDF. En local es
  `http://localhost:5173/verificar`: el QR solo resuelve desde esta maquina. Para probarlo
  desde un celular en la misma red, cambiarla a `http://<IP-LAN>:5173/verificar` y poner
  `BASE_URL=http://<IP-LAN>:5173` (CORS).
- El `JWT_SECRET` local es aleatorio; tokens de produccion no sirven aqui.
- `npm run remake` / `reset` **borran** `database/data` y el storage (reset hace snapshot antes).
- Los scripts `prod:*` y `docker-compose.prod.yml` siguen configurados para el dominio viejo;
  no se usan en local.

## Cambios hechos para correr en local

- `.env` creado (no versionado) con URLs `localhost` y credenciales de BD de produccion.
- Preview de plantillas: la URL de verificacion de ejemplo ya no esta fija a `vinsmake.dev`;
  usa `VERIFICATION_BASE_URL` en `backend/src/controllers/templateController.js` y
  `window.location.origin` en `frontend/src/components/admin/TemplatePreviewPanel.jsx`.

## Mas documentacion

- `readme.md` — modulos y API en detalle.
- `arquitectura.md` — modelo de datos, endpoints, estructura.
- `config.md` — personalizacion (plantillas, branding).
- `server.md` — despliegue en servidor (produccion).
