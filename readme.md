# Plataforma de Emision y Gestion de Credenciales Digitales (Certify)

Sistema para emitir, gestionar, reimprimir, revocar y verificar certificados digitales de cursos,
talleres, charlas, seminarios y diplomados. Cada certificado es un PDF generado desde una plantilla
HTML/CSS e incluye un QR a su pagina publica de verificacion.

## Caracteristicas

- **Pagina por curso** con todo su ciclo: participantes y asistencia, diseño de certificado con vista
  previa usando los datos reales del curso, generacion, y certificados emitidos.
- **Reimpresion con el mismo QR**: regenera el PDF con los datos y el diseño actuales conservando el
  identificador, la fecha de emision y el branding original.
- **Revocacion** con motivo y registro; la verificacion publica refleja el estado al instante.
- **Plantillas HTML/CSS** intercambiables, editables con vista previa en vivo.
- **Dependencias** (unidades organizacionales) con logo, encargado y firma; un curso puede tener varias
  colaboradoras y todas aparecen en el certificado.
- **Branding versionado**: cada certificado guarda la version con la que se emitio.
- **Roles**: `admin` (todo) y `dependencia` (solo sus datos y los cursos donde colabora).
- Participantes con tags, estadisticas por dependencia y vistas globales para el admin.

## Stack

| Capa | Tecnologia |
|---|---|
| Monorepo | npm workspaces: `packages/shared`, `backend`, `frontend` |
| Backend | Node 24, Express 5, TypeScript, Prisma 7 + PostgreSQL 16, Zod, Puppeteer |
| Frontend | React 19, React Router 8, TanStack Query, Vite 8, TypeScript |
| Calidad | tsc estricto, ESLint, Prettier, Vitest |
| Infraestructura | Docker Compose; nginx sirve el frontend en produccion |

## Inicio rapido

Requisitos: Docker Desktop y Git. Node/npm en el host solo para los atajos `npm run ...`
(cada uno llama a `docker compose`). **Nada se instala ni se ejecuta fuera de Docker.**

```bash
cp .env.example .env      # ajustar credenciales, JWT_SECRET y SEED_ADMIN_*
npm run setup             # construye las imagenes e instala dependencias dentro de Docker
npm run up                # levanta BD, backend y frontend
```

- Frontend: http://localhost:5173
- API: http://localhost:3000/api (`/api/health`)

Al arrancar, el backend aplica las migraciones pendientes y corre el seed (admin inicial desde
`SEED_ADMIN_*`, dependencia por defecto, branding y plantillas).

## Comandos

| Comando | Que hace |
|---|---|
| `npm run setup` | Reconstruye imagenes y reinstala dependencias (tras cambiar un `package.json`) |
| `npm run up` / `down` / `logs` | Levantar, detener y ver logs |
| `npm run check` | Typecheck + lint + tests de todos los paquetes |
| `npm test` | Tests del backend |
| `npm run db:migrate -- --name <cambio>` | Crea y aplica una migracion desde `schema.prisma` |
| `npm run db:studio` | Prisma Studio en http://localhost:5555 |
| `npm run db:reset` | Recrea la BD de desarrollo (migraciones + seed) |
| `npm run backup` / `restore` | Respaldo y restauracion de BD y storage |
| `npm run prod:build` | Construye y levanta produccion (`docker-compose.prod.yml`, `.env.prod`) |

## Documentacion

Todo el contexto del proyecto vive en [`memories/`](memories/README.md):

- [`arquitectura.md`](memories/arquitectura.md): estructura, endpoints y flujo de certificados.
- [`entorno-local.md`](memories/entorno-local.md): desarrollo local en detalle.
- [`conocimiento.md`](memories/conocimiento.md): reglas del proyecto y trampas conocidas.
- [`decisiones.md`](memories/decisiones.md) e [`historial.md`](memories/historial.md): por que esta asi y que cambio.
- [`configuracion.md`](memories/configuracion.md): personalizacion de branding, logos y plantillas.
