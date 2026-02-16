# Guía de Despliegue — certify.jalisco.gob.mx

## Arquitectura de producción

```
Internet
   │
   ▼
Nginx del servidor (host) ──► :443 SSL / :80 redirect
   │
   ├── /api/*       → proxy a contenedor backend (puerto 3000)
   ├── /storage/*   → proxy a contenedor backend (puerto 3000)
   └── /*           → archivos estáticos de /var/www/certify (dist/)
                       con SPA fallback a index.html
```

- **Frontend**: se hace `npm run build` en local, se sube solo la carpeta `dist/` al servidor. Nginx sirve los archivos estáticos directamente. **No necesita Docker**.
- **Backend + BD**: corren en Docker Compose.

---

## 1. Prerrequisitos en el servidor

```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx

# Docker (si no está instalado)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

---

## 2. Estructura en el servidor

```
/opt/certify/
├── backend/          ← código fuente del backend
├── database/         ← datos de PostgreSQL
├── storage/          ← certificados y logos
├── docker-compose.prod.yml
└── .env.prod

/var/www/certify/     ← build del frontend (solo archivos estáticos)
├── index.html
├── assets/
└── ...
```

Solo se suben al servidor:
- `backend/`, `database/init/`, `storage/`, `docker-compose.prod.yml`, `.env.prod`
- La carpeta `dist/` generada del frontend → se copia a `/var/www/certify/`

---

## 3. Archivo de entorno `.env.prod`

Crear `/opt/certify/.env.prod`:

```env
NODE_ENV=production
PORT=3000

# Base de datos
POSTGRES_USER=certify_user
POSTGRES_PASSWORD=<CONTRASEÑA_SEGURA>
POSTGRES_DB=certify_db
POSTGRES_HOST=database
POSTGRES_PORT=5432

# JWT
JWT_SECRET=<SECRETO_JWT_MUY_LARGO>
JWT_EXPIRATION=8h

# URLs de producción
BASE_URL=https://certify.jalisco.gob.mx
API_URL=https://certify.jalisco.gob.mx/api
VERIFICATION_BASE_URL=https://certify.jalisco.gob.mx/verificar
```

---

## 4. Build del frontend (en tu máquina local)

```bash
cd frontend

# Instalar dependencias
npm ci

# Build con las variables de producción
VITE_API_URL=/api VITE_APP_TITLE="Plataforma de Credenciales Digitales" npm run build
```

En Windows (PowerShell):

```powershell
cd frontend
npm ci
$env:VITE_API_URL="/api"; $env:VITE_APP_TITLE="Plataforma de Credenciales Digitales"; npm run build
```

Esto genera la carpeta `frontend/dist/` con los archivos estáticos listos.

---

## 5. Subir archivos al servidor

### 5.1. Primera vez — subir todo el proyecto (sin frontend/src)

```bash
# Desde la raíz del proyecto en tu máquina local

# Backend, database init, storage, compose y env
rsync -avz --progress \
  backend/ \
  database/init/ \
  storage/ \
  docker-compose.prod.yml \
  .env.prod \
  usuario@certify.jalisco.gob.mx:/opt/certify/

# Frontend build
rsync -avz --progress --delete \
  frontend/dist/ \
  usuario@certify.jalisco.gob.mx:/var/www/certify/
```

O con `scp`:

```bash
# Build del frontend
scp -r frontend/dist/* usuario@certify.jalisco.gob.mx:/var/www/certify/

# Backend y configs
scp -r backend docker-compose.prod.yml .env.prod usuario@certify.jalisco.gob.mx:/opt/certify/
```

### 5.2. Actualizaciones posteriores

Solo del **frontend** (cuando cambias la UI):
```bash
# En local: rebuild
cd frontend && VITE_API_URL=/api VITE_APP_TITLE="Plataforma de Credenciales Digitales" npm run build

# Subir solo el dist
rsync -avz --progress --delete frontend/dist/ usuario@certify.jalisco.gob.mx:/var/www/certify/
```

Solo del **backend** (cuando cambias la API):
```bash
rsync -avz --progress backend/ usuario@certify.jalisco.gob.mx:/opt/certify/backend/

# En el servidor: rebuild del contenedor
ssh usuario@certify.jalisco.gob.mx "cd /opt/certify && docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d backend"
```

---

## 6. Crear directorio del frontend en el servidor

```bash
# En el servidor
sudo mkdir -p /var/www/certify
sudo chown -R $USER:$USER /var/www/certify
```

---

## 7. Configurar Nginx del host

### 7.1. Crear el archivo de configuración

```bash
sudo nano /etc/nginx/sites-available/certify.jalisco.gob.mx
```

```nginx
# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name certify.jalisco.gob.mx;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name certify.jalisco.gob.mx;

    # ─── SSL (Certbot los configura automáticamente) ───
    ssl_certificate     /etc/letsencrypt/live/certify.jalisco.gob.mx/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/certify.jalisco.gob.mx/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # ─── Seguridad ───
    add_header X-Frame-Options          "SAMEORIGIN" always;
    add_header X-Content-Type-Options   "nosniff" always;
    add_header Referrer-Policy          "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # ─── Límites ───
    client_max_body_size 20M;

    # ─── API → backend (Node.js en Docker) ───
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    # ─── Storage (logos) → backend ───
    location /storage/ {
        proxy_pass http://127.0.0.1:3000/storage/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # ─── Frontend (archivos estáticos del build) ───
    root /var/www/certify;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # ─── Cache para assets estáticos ───
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/certify;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7.2. Habilitar el sitio

```bash
sudo ln -s /etc/nginx/sites-available/certify.jalisco.gob.mx /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. Certificado SSL con Let's Encrypt

Primero, configurar una versión temporal solo HTTP para que Certbot pueda validar:

```bash
sudo nano /etc/nginx/sites-available/certify.jalisco.gob.mx
```

```nginx
server {
    listen 80;
    server_name certify.jalisco.gob.mx;

    root /var/www/certify;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_set_header Host $host;
    }

    location /storage/ {
        proxy_pass http://127.0.0.1:3000/storage/;
        proxy_set_header Host $host;
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Obtener el certificado:

```bash
sudo certbot --nginx -d certify.jalisco.gob.mx
```

Certbot modifica el archivo automáticamente. Después, reemplazar con la configuración completa del paso 7.1 y recargar:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Verificar renovación automática:

```bash
sudo certbot renew --dry-run
```

---

## 9. Levantar backend y base de datos

```bash
cd /opt/certify

# Build e iniciar
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d

# Verificar
docker compose -f docker-compose.prod.yml ps

# Ver logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## 10. Verificar el despliegue

```bash
# Backend directo
curl -s http://127.0.0.1:3000/api/health

# Frontend (archivo estático)
curl -I http://127.0.0.1/

# A través de HTTPS
curl -I https://certify.jalisco.gob.mx
curl -s https://certify.jalisco.gob.mx/api/health
```

---

## 11. Firewall

```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP (redirect a HTTPS)
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
sudo ufw status
```

> El puerto 3000 no debe estar abierto al exterior. Al bindear a `127.0.0.1` en Docker, ya se encarga de esto.

---

## 12. Flujo de actualización completo

```bash
# ── En tu máquina local ──

# 1. Pull cambios
git pull origin main

# 2. Si hay cambios en el frontend:
cd frontend
VITE_API_URL=/api VITE_APP_TITLE="Plataforma de Credenciales Digitales" npm run build
rsync -avz --progress --delete dist/ usuario@certify.jalisco.gob.mx:/var/www/certify/
cd ..

# 3. Si hay cambios en el backend:
rsync -avz --progress backend/ usuario@certify.jalisco.gob.mx:/opt/certify/backend/
ssh usuario@certify.jalisco.gob.mx "cd /opt/certify && docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d backend"
```

> **El frontend no requiere reiniciar nada**: al subir los nuevos archivos, Nginx los sirve automáticamente.

---

## 13. Comandos útiles

| Acción                  | Comando                                                                          |
| ----------------------- | -------------------------------------------------------------------------------- |
| Ver contenedores        | `docker compose -f docker-compose.prod.yml ps`                                  |
| Ver logs backend        | `docker compose -f docker-compose.prod.yml logs -f backend`                     |
| Reiniciar backend       | `docker compose -f docker-compose.prod.yml restart backend`                     |
| Rebuild backend         | `docker compose -f docker-compose.prod.yml up --build -d backend`               |
| Detener todo            | `docker compose -f docker-compose.prod.yml down`                                |
| Backup base de datos    | `tar -czf backup-db-$(date +%F).tar.gz -C database data`                       |
| Backup storage          | `tar -czf backup-storage-$(date +%F).tar.gz -C storage certificates logos`      |
| Backup frontend         | `tar -czf backup-frontend-$(date +%F).tar.gz -C /var/www certify`              |
| Logs de Nginx           | `sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log`               |
| Renovar SSL             | `sudo certbot renew`                                                             |

---

## Resumen

| Componente     | Ubicación en servidor    | Cómo se sirve              | Docker |
| -------------- | ------------------------ | -------------------------- | ------ |
| Frontend (SPA) | `/var/www/certify/`      | Nginx del host (estático)  | ❌ No  |
| Backend (API)  | `/opt/certify/backend/`  | Docker → `127.0.0.1:3000` | ✅ Sí  |
| PostgreSQL     | `/opt/certify/database/` | Docker (sin puerto host)   | ✅ Sí  |
| Nginx (host)   | Sistema                  | Puertos 80/443 públicos    | ❌ No  |
