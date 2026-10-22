# Certify en local

Todo corre en Docker; no se instala nada en el host (regla del proyecto).

| Servicio | Tecnologia | URL local |
|---|---|---|
| frontend | React 19 + Vite 8 (hot reload, proxy de /api y /storage al backend) | http://localhost:5173 |
| backend | Node 24 + Express 5 + Prisma 7 + Puppeteer | http://localhost:3000/api |
| database | PostgreSQL 16 | localhost:5432 |
| Prisma Studio | `npm run db:studio` | http://localhost:5555 |

Requisitos en el host: Docker Desktop, Git y Node/npm solo para los atajos `npm run ...` de la raiz
(cada uno llama a `docker compose`).

## Levantar desde cero

```bash
cp .env.example .env      # ajustar credenciales, JWT_SECRET y SEED_ADMIN_*
npm run setup             # construye las imagenes e instala dependencias (en volumenes de Docker)
npm run up                # levanta BD, backend y frontend
npm run logs              # seguir logs
```

Al arrancar, el backend aplica las migraciones pendientes y corre el seed (admin inicial, dependencia
por defecto y 4 plantillas base). Comprobar con `curl localhost:3000/api/health`.

Credenciales de desarrollo: ver `credenciales.md`.

## Comandos utiles (raiz)

| Comando | Que hace |
|---|---|
| `npm run setup` | Reconstruye las imagenes y reinstala dependencias (despues de cambiar package.json) |
| `npm run check` | Typecheck + lint + tests de todos los paquetes |
| `npm test` | Tests del backend (BD `<POSTGRES_DB>_test`) |
| `docker compose exec frontend npx tsc --noEmit` | Typecheck solo del frontend |
| `npm run db:migrate -- --name x` | Crea y aplica una migracion a partir de `schema.prisma` |
| `npm run db:status` | Estado de las migraciones |
| `npm run db:seed` | Re-ejecuta el seed (idempotente) |
| `npm run db:reset` | Borra la BD de desarrollo y la recrea con migraciones + seed |
| `npm run remake` | Borra `database/data` y el storage y reconstruye todo |

## Frontend

- Usa rutas relativas `/api` y `/storage`; Vite las reenvia a `BACKEND_URL` (en compose: `http://backend:3000`).
  No hay variable con la URL del backend.
- La primera carga completa de una pagina tarda unos segundos (Vite sirve muchos modulos sobre el bind
  mount con polling). Navegar dentro de la app es inmediato.
- Build de produccion: `npm run build -w @certify/frontend` (deja `frontend/dist`, ignorado por git).

## Editor

Abrir el repo con **Dev Containers** (VS Code: "Reopen in Container"). El editor corre dentro del
contenedor del backend y ve `node_modules`, asi que hay tipos, ESLint, Prettier y Vitest disponibles.

## Restaurar el backup viejo de produccion

`database/backup.tar.gz` es el PGDATA de produccion de **antes** de Prisma (schema SQL v1, rol `vinsmake`).
Para usarlo:
1. Poner en `.env` las credenciales de BD de `.env.prod`.
2. `npm run restore`.
3. La BD no tiene la tabla `_prisma_migrations` y su schema difiere del de Prisma (enums, NOT NULL).
   Hay que generar una migracion de transicion con
   `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`, revisarla,
   aplicarla y marcar `init` como aplicada con `prisma migrate resolve --applied <init>`.
   No se ha hecho todavia porque no hay produccion activa.

## Notas

- `VERIFICATION_BASE_URL` define la URL del QR. En local apunta a `localhost`, asi que solo abre en
  esta maquina. Para probar con un celular en la misma red, usar `http://<IP-LAN>:5173/verificar` y
  `FRONTEND_URL=http://<IP-LAN>:5173`.
- Al cambiar `.env` hay que recrear los contenedores (`npm run up`), no solo reiniciarlos.
