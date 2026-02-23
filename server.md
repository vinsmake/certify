# Despliegue en producción — certify.vinsmake.dev

Checklist de configuración en el orden real en que se ejecutaron los pasos.

---

## Arquitectura de producción

```
Internet (HTTPS 443)
        ↓
[Host: Nginx — SSL termination]
        ↓  proxy_pass http://localhost:8080
[Docker: frontend nginx — port 8080]
    ↓ (SPA estático)    ↓ (proxy /api/, /storage/)
[React build]       [backend:3000 — Node.js]
                           ↓
                    [database:5432 — PostgreSQL]
```

**Flujo de requests:**
- `https://certify.vinsmake.dev/` → host nginx → frontend nginx (8080) → React SPA
- `https://certify.vinsmake.dev/api/` → host nginx → frontend nginx → backend:3000
- `https://certify.vinsmake.dev/storage/` → host nginx → frontend nginx → backend:3000

---

## Fase 1 — Archivos de configuración creados (local) ✅

- [x] `docker-compose.prod.yml` — compose de producción, frontend en puerto 8080
- [x] `frontend/Dockerfile.prod` — build multi-stage: Node (Vite build) → Nginx (serve)
- [x] `frontend/nginx.prod.conf` — Nginx: SPA fallback + proxy `/api/` y `/storage/` al backend
- [x] `backend/Dockerfile.prod` — Node.js producción (`npm install --omit=dev`, sin nodemon)
- [x] `.env.prod` — variables de entorno para producción (BASE_URL, DB, JWT)
- [x] `package.json` — scripts `prod:build`, `prod:up`, `prod:down`, `prod:logs`, `prod:ps`, `prod:backup`
- [x] `.gitignore` — añadidos `.env.prod`, `.env.local`, `.env.prod.local`

---

## Fase 2 — Preparación del .env.prod ✅

- [x] `JWT_SECRET` configurado
- [x] `POSTGRES_PASSWORD` configurada
- [x] `BASE_URL=https://certify.vinsmake.dev` correcto
- [x] `VERIFICATION_BASE_URL=https://certify.vinsmake.dev/verificar` correcto
- [x] `.env.prod` añadido al `.gitignore`

---

## Fase 3 — Infraestructura del servidor ✅

- [x] Docker Engine instalado
- [x] Nginx instalado en el host
- [x] Certbot instalado
- [x] Git instalado

---

## Fase 4 — Clonar repo y configurar en el servidor ✅

```bash
# Generar SSH key y añadirla a GitHub (Settings → SSH keys → Authentication key)
ssh-keygen -t ed25519 -C "server-certify" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub

# Clonar el repositorio
git clone git@github.com:vinsmake/certify.git /var/www/certify
cd /var/www/certify

# Crear .env.prod en el servidor (no se clona, está en .gitignore)
nano .env.prod
```

- [x] SSH key generada en el servidor y añadida a GitHub
- [x] Repositorio clonado en `/var/www/certify`
- [x] `.env.prod` creado en el servidor con las credenciales reales

---

## Fase 5 — Primer despliegue ✅

```bash
cd /var/www/certify
npm run prod:build

# Verificar que todos están corriendo
docker compose -f docker-compose.prod.yml ps
```

- [x] Build termina sin errores
- [x] `certify-frontend-1` running en `0.0.0.0:8080->80/tcp`
- [x] `certify-backend-1` running en `3000/tcp`
- [x] `certify-database-1` running en `5432/tcp`

---

## Fase 6 — DNS ✅

- [x] Registro A creado: `certify.vinsmake.dev` → `31.97.141.79`
- [x] DNS propagado (verificado con `dig`)

---

## Fase 7 — Nginx del host (reverse proxy) ✅

```bash
nano /etc/nginx/sites-available/certify.vinsmake.dev
ln -s /etc/nginx/sites-available/certify.vinsmake.dev /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

- [x] Archivo creado en `/etc/nginx/sites-available/certify.vinsmake.dev`
- [x] Symlink creado en `sites-enabled`
- [x] `nginx -t` pasa sin errores
- [x] Nginx recargado

---

## Fase 8 — SSL con Certbot ✅

```bash
certbot --nginx -d certify.vinsmake.dev
```

- [x] Certificado SSL obtenido para `certify.vinsmake.dev`
- [x] Nginx recargado por Certbot con SSL activo y redirect 80→443
- [x] `https://certify.vinsmake.dev` responde correctamente

---

## Fase 9 — Verificaciones funcionales

- [x] `https://certify.vinsmake.dev` carga el frontend
- [x] `https://certify.vinsmake.dev/api/health` responde `{"status":"ok"}`
- [x] Login con admin funciona
- [ ] Generación de un certificado de prueba funciona
- [ ] El PDF se genera correctamente
- [ ] El QR code en el PDF apunta a `https://certify.vinsmake.dev/verificar/...`
- [ ] La URL de verificación del certificado carga correctamente
- [ ] Upload de logos funciona
- [ ] Upload de firmas funciona
- [ ] Las imágenes de logos y firmas se muestran en la UI

---

## Operaciones habituales en producción

### Actualizar tras cambios en el código
```bash
cd /var/www/certify
git pull
npm run prod:build
```

### Ver logs
```bash
npm run prod:logs
# Solo backend:
docker compose -f docker-compose.prod.yml logs -f backend
```

### Backup
```bash
npm run prod:backup
# Genera: database/backup.tar.gz y storage/backup.tar.gz
```

### Reiniciar solo el backend
```bash
docker compose -f docker-compose.prod.yml restart backend
```

### Parar todo
```bash
npm run prod:down
```

---

## Notas importantes

- `.env.prod` nunca debe subirse al repositorio — contiene credenciales de producción.
- La BD persiste en `database/data/`. Si existe al iniciar, PostgreSQL NO re-ejecuta los scripts de `database/init/`. Para reinicializar hay que borrar `database/data/`.
- Los archivos generados (certificados, logos, firmas) persisten en `storage/`. Hacer backup regularmente.
- Puppeteer/Chromium en Alpine puede ser lento la primera vez que genera un PDF. Es normal.
- `frontend/.env.production` tiene `VITE_API_URL=/api` — Vite lo usa en el build y las peticiones se proxean via nginx.
