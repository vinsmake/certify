# Despliegue en producción — certify.vinsmake.dev

Checklist de configuración. Marcar cada ítem cuando esté completado y verificado.

---

## Arquitectura de producción

```
Internet (HTTPS 443)
        ↓
[Host: Nginx/Caddy — SSL termination]
        ↓  proxy_pass http://localhost:80
[Docker: frontend nginx — port 80]
    ↓ (SPA estático)    ↓ (proxy /api/, /storage/)
[React build]       [backend:3000 — Node.js]
                           ↓
                    [database:5432 — PostgreSQL]
```

**Flujo de requests:**
- `https://certify.vinsmake.dev/` → frontend nginx → React SPA (index.html)
- `https://certify.vinsmake.dev/api/` → frontend nginx → backend:3000
- `https://certify.vinsmake.dev/storage/` → frontend nginx → backend:3000 (Express static)

---

## Fase 1 — Archivos de configuración creados (local)

- [x] `docker-compose.prod.yml` — compose de producción (sin hot-reload, con restart policies)
- [x] `frontend/Dockerfile.prod` — build multi-stage: Node (Vite build) → Nginx (serve)
- [x] `frontend/nginx.prod.conf` — Nginx: SPA fallback + proxy `/api/` y `/storage/` al backend
- [x] `backend/Dockerfile.prod` — Node.js producción (sin nodemon, solo deps de producción)
- [x] `.env.prod` — variables de entorno para producción (BASE_URL, DB, JWT)
- [x] `package.json` — scripts `prod:build`, `prod:up`, `prod:down`, `prod:logs`, `prod:ps`, `prod:backup`

---

## Fase 2 — Preparación del .env.prod ✅

- [x] `JWT_SECRET` configurado
- [x] `POSTGRES_PASSWORD` configurada
- [x] `BASE_URL=https://certify.vinsmake.dev` correcto
- [x] `VERIFICATION_BASE_URL=https://certify.vinsmake.dev/verificar` correcto
- [x] `.env.prod` añadido al `.gitignore`

---

## Fase 3 — Servidor (VPS/cloud) ✅

- [x] Docker Engine instalado
- [x] Nginx instalado en el host
- [x] Certbot instalado
- [x] Git instalado

---

## Fase 4 — DNS

- [ ] Crear registro A en DNS: `certify.vinsmake.dev` → IP pública del servidor
- [ ] Esperar propagación (puede tardar hasta 24h, normalmente minutos)
- [ ] Verificar propagación: `dig certify.vinsmake.dev` o `nslookup certify.vinsmake.dev`

---

## Fase 5 — SSL con Certbot (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado (el dominio ya debe resolver a este servidor)
sudo certbot --nginx -d certify.vinsmake.dev

# Verificar renovación automática
sudo certbot renew --dry-run
```

- [ ] Certificado SSL obtenido para `certify.vinsmake.dev`
- [ ] Renovación automática configurada

---

## Fase 6 — Nginx del host (reverse proxy)

Crear o editar `/etc/nginx/sites-available/certify.vinsmake.dev`:

```nginx
server {
    listen 80;
    server_name certify.vinsmake.dev;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name certify.vinsmake.dev;

    ssl_certificate /etc/letsencrypt/live/certify.vinsmake.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/certify.vinsmake.dev/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Aumentar límite para uploads (PDFs, imágenes)
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 300s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/certify.vinsmake.dev /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

- [ ] Archivo de Nginx creado en `/etc/nginx/sites-available/certify.vinsmake.dev`
- [ ] Symlink creado en `sites-enabled`
- [ ] `nginx -t` pasa sin errores
- [ ] Nginx recargado

> **Nota:** Si usas Certbot con `--nginx`, puede que modifique el archivo automáticamente para añadir los bloques SSL. En ese caso ejecuta `certbot --nginx -d certify.vinsmake.dev` después de crear el archivo con solo el bloque HTTP del redirect.

---

## Fase 7 — Clonar y configurar en el servidor ✅

```bash
# Generar SSH key en el servidor y añadirla a GitHub (Settings → SSH keys → Authentication key)
ssh-keygen -t ed25519 -C "server-certify" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub

# Clonar el repositorio
git clone git@github.com:vinsmake/certify.git /var/www/certify
cd /var/www/certify

# Crear el .env.prod con las credenciales reales (no se clona, está en .gitignore)
nano .env.prod
```

- [x] SSH key generada en el servidor y añadida a GitHub
- [x] Repositorio clonado en `/var/www/certify`
- [x] `.env.prod` creado en el servidor

---

## Fase 8 — Primer despliegue

```bash
cd /var/www/certify

# Build y levantar contenedores de producción
# (si npm no está instalado en el servidor, usar el comando docker directamente)
docker compose -f docker-compose.prod.yml up --build -d

# Verificar que todos están corriendo
docker compose -f docker-compose.prod.yml ps
```

Salida esperada:
```
NAME                    STATUS
certify-frontend-1      running
certify-backend-1       running
certify-database-1      running
```

- [ ] Build termina sin errores
- [ ] Los 3 contenedores están en estado `running`
- [ ] `docker compose -f docker-compose.prod.yml logs -f` no muestra errores críticos

---

## Fase 9 — Verificaciones funcionales

- [ ] `https://certify.vinsmake.dev` carga el frontend (no error 502/404)
- [ ] `https://certify.vinsmake.dev/api/health` responde `{"status":"ok"}`
- [ ] Login con admin funciona
- [ ] Generación de un certificado de prueba funciona
- [ ] El PDF se genera correctamente
- [ ] El QR code en el PDF apunta a `https://certify.vinsmake.dev/verificar/...`
- [ ] La URL de verificación del certificado carga correctamente
- [ ] Upload de logos funciona
- [ ] Upload de firmas funciona
- [ ] Las imágenes de logos y firmas se muestran en la UI

---

## Fase 10 — Operaciones habituales en producción

### Actualizar la app tras cambios en el código
```bash
cd /opt/certify
git pull
npm run prod:build   # rebuild + restart
```

### Ver logs en tiempo real
```bash
npm run prod:logs
# Solo backend:
docker compose -f docker-compose.prod.yml logs -f backend
```

### Backup de datos
```bash
npm run prod:backup
# Genera: database/backup.tar.gz y storage/backup.tar.gz
```

### Reiniciar solo el backend (sin rebuild)
```bash
docker compose -f docker-compose.prod.yml restart backend
```

### Parar todo
```bash
npm run prod:down
```

---

## Notas importantes

- El archivo `.env.prod` **nunca debe subirse al repositorio**. Contiene credenciales de producción.
- La base de datos persiste en `database/data/`. Si este directorio existe al iniciar, PostgreSQL NO ejecuta los scripts de `database/init/` de nuevo. Para reinicializar la BD hay que borrar `database/data/`.
- Los archivos generados (certificados, logos, firmas) persisten en `storage/`. Hacer backup regularmente con `npm run prod:backup`.
- Puppeteer/Chromium en Alpine puede ser lento la primera vez que genera un PDF. Es normal.
- `frontend/.env.production` tiene `VITE_API_URL=/api` que es correcto — Vite lo usa en el build y las peticiones van al nginx que luego proxea al backend.
