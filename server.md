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

## Fase 2 — Preparación del .env.prod

- [ ] Cambiar `JWT_SECRET` por un valor seguro generado con:
  ```bash
  openssl rand -hex 64
  ```
- [ ] Confirmar que `POSTGRES_PASSWORD` es segura para producción
- [ ] Verificar que `BASE_URL=https://certify.vinsmake.dev` está correcto
- [ ] Verificar que `VERIFICATION_BASE_URL=https://certify.vinsmake.dev/verificar` está correcto
- [ ] Añadir `.env.prod` al `.gitignore` si no está ya (no subir credenciales al repo)

---

## Fase 3 — Servidor (VPS/cloud)

### Requisitos del servidor
- [ ] Ubuntu 22.04+ (o Debian 12)
- [ ] Docker Engine instalado: https://docs.docker.com/engine/install/ubuntu/
- [ ] Docker Compose plugin instalado (viene con Docker Engine moderno)
- [ ] Git instalado
- [ ] Nginx instalado en el host (para SSL y reverse proxy al puerto 80 de Docker)
- [ ] Certbot instalado (Let's Encrypt para SSL)

### Instalar Docker en Ubuntu
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Cerrar sesión y volver a entrar para aplicar el grupo
```

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

## Fase 7 — Clonar y configurar en el servidor

```bash
# Clonar el repositorio
git clone <URL_DEL_REPO> /opt/certify
cd /opt/certify

# Crear el .env.prod con las credenciales reales
# (copiar de local y ajustar JWT_SECRET)
nano .env.prod

# Crear directorios de storage si no existen
mkdir -p storage/certificates storage/logos storage/signatures
mkdir -p database/data
```

- [ ] Repositorio clonado en el servidor
- [ ] `.env.prod` creado en el servidor con `JWT_SECRET` seguro
- [ ] Directorios `storage/` y `database/data/` creados

---

## Fase 8 — Primer despliegue

```bash
cd /opt/certify

# Build y levantar contenedores de producción
npm run prod:build

# Verificar que todos están corriendo
npm run prod:ps
```

Salida esperada de `prod:ps`:
```
NAME                    STATUS
certify-frontend-1      running
certify-backend-1       running
certify-database-1      running
```

- [ ] `npm run prod:build` termina sin errores
- [ ] Los 3 contenedores están en estado `running`
- [ ] `npm run prod:logs` no muestra errores críticos

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
