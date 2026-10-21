# Historial de cambios

Bitacora cronologica de lo que no se ve facil en `git log`: por que se hizo algo y su estado.
Las entradas nuevas van al final.

---

## Antes de 2026-10

Se construyo el sistema siguiendo `todo-historico.md`: Express + pg + React/Vite en Docker.
Se desplego en `certify.vinsmake.dev` (ver `despliegue-servidor.md`). Commits relevantes:
tags de participantes (`0aa1262`), "Sin dependencia" (`c314b20`), mensaje opcional (`74bd05b`)
y fix de PDF (`a53a537`).

## 2026-10-21 - Rescate y puesta en marcha local

- Se analizo el proyecto y se documento en `entorno-local.md`.
- Se creo `.env` local (no versionado) y se restauraron los backups de BD y storage.
- Se quitaron las URLs fijas a `vinsmake.dev` (preview de plantillas).
- Se verificaron health, login, endpoints principales y generacion de PDF.

## 2026-10-21 - BD a cero

- Se reinicio la BD a solo el seed y se cambio la contraseña inicial del admin (decision #2).
- Se verifico que el schema fresco de `database/init/` es identico al de produccion (`pg_dump -s`).
- El usuario hizo commit `42a10e3 restart` con lo anterior.

## 2026-10-21 - Inicio de reestructura (en curso)

- Se creo `memories/` y se movieron ahi todos los .md de contexto (excepto `readme.md`).
- Se intento montar migraciones con Knex y se revirtio al decidir usar Prisma (decisiones #3 y #4).
- Plan por fases:
  0. `memories/` (hecho).
  1. Backend con TypeScript + Prisma + Zod, modulos por dominio, mismo contrato de API.
  2. Frontend con TypeScript.
  3. Tooling: ESLint, Prettier, tests y CI.
  4. Pagina de curso (decision #5).

## 2026-10-21 - Fase 1: backend v2 (TypeScript + Prisma)

- Se reescribio el backend completo a TypeScript (Express 5, Prisma 7, Zod 4, pino), organizado en
  modulos por dominio. Detalle en la decision #6.
- Se elimino `database/init/`: el schema ahora vive en `backend/prisma/schema.prisma` y en las migraciones
  (`backend/prisma/migrations/<fecha>_init`). Se recreo la BD local desde cero con la migracion init + seed.
- Las plantillas del seed se extrajeron de la BD a `backend/prisma/seed-data/templates/*.html`.
- La variable `BASE_URL` se renombro a `FRONTEND_URL`.
- Los `node_modules` pasaron a volumenes de Docker y se agrego `.devcontainer/`.
- Verificado: typecheck y ESLint limpios, 18/18 tests (flujo completo con PDF real), los 17 endpoints que
  usa el frontend responden 200 con el frontend viejo funcionando, y la imagen de produccion construye,
  migra y genera PDFs.
- Pendiente: fase 2 (frontend TS), fase 3 (CI) y fase 4 (pagina de curso).

## 2026-10-21 - Fase 2: frontend v2 y pagina del curso

- Backend: vistas previas renderizadas en el servidor (`POST /templates/render`,
  `POST /courses/:id/certificate-preview`) con tests; se elimino `GET /templates/sample-qr` (decision #8).
- Frontend reescrito en TypeScript con React 19, Router 8, TanStack Query y clases CSS (decision #7).
- Pagina del curso con pestañas Participantes, Diseño, Generar, Certificados e Informacion; reimpresion
  con el mismo QR; se elimino `/emitir` (decision #9).
- CI descartado por el usuario (decision #10).
- Trampas encontradas: Prisma Studio trae React 18 a la raiz del monorepo (Vite usa `resolve.dedupe`);
  el build del frontend fuerza `NODE_ENV=production` porque `.env` trae `development`.
- Verificado: typecheck y lint de los 3 paquetes, 20/20 tests, imagen de produccion del frontend, y flujo
  completo en navegador (inscribir, completar, diseño, generar, reimprimir, verificacion publica).
- Commits por bloque (el usuario lo pidio): `6dfc5bc` API, `f52ba50` frontend, `28504e1` pagina del curso,
  `85c9054` fix.
- Documentacion al dia: `readme.md` reescrito para v2, `arquitectura.md` nueva (la anterior en
  `arquitectura-v1.md`), `configuracion.md`, `entorno-local.md` y `conocimiento.md` actualizados.
- Pendiente sugerido (no pedido): tests automaticos del frontend; logo `default_logo.png` del seed.
