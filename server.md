# Guía de Despliegue — certify.jalisco.gob.mx

## Arquitectura de producción

```
Internet
   │
   ▼
Nginx del servidor (host) ──► :443 SSL / :80 redirect
   │
   ├── /api/*       → proxy a contenedor backend   (puerto 3000)
   ├── /storage/*   → proxy a contenedor backend   (puerto 3000)
   └── /*           → proxy a contenedor frontend  (puerto 8080)
                       (Nginx interno sirve el SPA)
```

El Nginx **del host** actúa como reverse proxy con SSL. Los contenedores Docker no exponen puertos al mundo exterior, solo al host vía `127.0.0.1`.

### ¿Qué se sube al servidor?

| Componente | Se sube código fuente? | Lo que se sube                                  |
| ---------- | ---------------------- | ----------------------------------------------- |
| Frontend   | ❌ No                  | Solo `dist/`, `nginx.conf`, `Dockerfile.prod`   |
| Backend    | ✅ Sí                  | Todo `backend/` (Node.js necesita el código)     |
| Database   | —                      | `database/init/` (schema) + volumen de datos     |

La **build del frontend se hace en tu máquina local** con `npm run build`. Solo el resultado compilado (`dist/`) se sube al servidor.

---

## 1. Prerrequisitos en el servidor

```bash
# Nginx, Docker y Certbot
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
# Docker (si no está instalado)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

---

## 2. Estructura en el servidor

En el servidor, el proyecto se organiza así en `/opt/certify`:

```
/opt/certify/
├── docker-compose.prod.yml
├── .env.prod
├── frontend/
│   ├── Dockerfile.prod          # Solo copia dist/ a nginx:alpine
│   ├── nginx.conf               # Config de SPA (sin proxy rules)
│   └── dist/                    # ← Build pre-compilada desde tu máquina
├── backend/
│   ├── Dockerfile.prod
│   ├── package.json
│   ├── package-lock.json
│   └── src/                     # Código fuente completo del backend
├── database/
│   └── init/
│       └── 01_schema.sql
└── storage/
    ├── certificates/
    ├── logos/
    └── signatures/
```

> **No se sube:** `node_modules/`, código fuente del frontend, ni archivos de desarrollo.

---

## 3. Build del frontend (en tu máquina local)

Antes de subir al servidor, genera la build de producción localmente:

```bash
cd frontend

# Configurar variables de entorno para la build
# Crear .env.production en frontend/ (o exportar las variables)
echo "VITE_API_URL=/api" > .env.production
echo "VITE_APP_TITLE=Plataforma de Credenciales Digitales" >> .env.production

# Instalar dependencias y compilar
npm install
npm run build
```

Esto genera la carpeta `frontend/dist/` con los archivos estáticos optimizados.

---

## 4. Subir archivos al servidor

### Primera vez (setup inicial)

```bash
# Desde la raíz del proyecto en tu máquina local
# Subir la estructura necesaria (sin node_modules ni código fuente del frontend)

# Opción A: rsync (recomendado)
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude 'frontend/src' \
  --exclude 'frontend/public' \
  --exclude 'frontend/index.html' \
  --exclude 'frontend/package.json' \
  --exclude 'frontend/package-lock.json' \
  --exclude 'frontend/vite.config.js' \
  --exclude 'frontend/Dockerfile' \
  --exclude 'database/data' \
  --exclude '.env' \
  --exclude '.git' \
  ./ usuario@certify.jalisco.gob.mx:/opt/certify/

# Opción B: scp selectivo
scp docker-compose.prod.yml .env.prod usuario@servidor:/opt/certify/
scp -r frontend/dist frontend/nginx.conf frontend/Dockerfile.prod usuario@servidor:/opt/certify/frontend/
scp -r backend/ usuario@servidor:/opt/certify/backend/
scp -r database/init/ usuario@servidor:/opt/certify/database/init/
```

> **Nota:** el directorio `storage/signatures/` no se crea automáticamente con rsync si no existe localmente. Crearlo manualmente en el servidor:

```bash
mkdir -p /opt/certify/storage/signatures
```

### Actualizaciones posteriores (solo frontend)

Cuando solo cambie el frontend:

```bash
# 1. Rebuild local
cd frontend && npm run build

# 2. Subir solo la build
rsync -avz --delete frontend/dist/ usuario@servidor:/opt/certify/frontend/dist/

# 3. Rebuild del contenedor en el servidor
ssh usuario@servidor "cd /opt/certify && docker compose -f docker-compose.prod.yml up --build -d frontend"
```

### Actualizaciones posteriores (backend)

```bash
# 1. Subir código del backend
rsync -avz --delete --exclude 'node_modules' backend/ usuario@servidor:/opt/certify/backend/

# 2. Rebuild del contenedor
ssh usuario@servidor "cd /opt/certify && docker compose -f docker-compose.prod.yml up --build -d backend"
```

---

## 5. Archivo de entorno `.env.prod`

Crear `/opt/certify/.env.prod` en el servidor:

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

## 6. Configurar Nginx del host

### 6.1. Crear el archivo de configuración

```bash
sudo nano /etc/nginx/sites-available/certify.jalisco.gob.mx
```

Pegar el siguiente contenido:

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

    # ─── SSL (Certbot los genera automáticamente) ───
    ssl_certificate     /etc/letsencrypt/live/certify.jalisco.gob.mx/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/certify.jalisco.gob.mx/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # ─── Seguridad ───
    add_header X-Frame-Options        "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy        "strict-origin-when-cross-origin" always;
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

    # ─── Frontend (SPA en Nginx/Docker) ───
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6.2. Habilitar el sitio

```bash
sudo ln -s /etc/nginx/sites-available/certify.jalisco.gob.mx /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   # Eliminar el default si existe
sudo nginx -t                                  # Verificar sintaxis
sudo systemctl reload nginx
```

---

## 7. Certificado SSL con Let's Encrypt

Antes de tener el certificado, usar temporalmente una config solo HTTP para que Certbot pueda validar:

```bash
sudo nano /etc/nginx/sites-available/certify.jalisco.gob.mx
```

```nginx
server {
    listen 80;
    server_name certify.jalisco.gob.mx;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
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

Certbot modificará el archivo automáticamente para incluir SSL. Después, reemplazar con la configuración completa del paso 6.1 y recargar:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Renovación automática (verificar que funcione):

```bash
sudo certbot renew --dry-run
```

---

## 8. Build y levantar contenedores

```bash
cd /opt/certify

# Build e iniciar
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d

# Verificar que todo esté corriendo
docker compose -f docker-compose.prod.yml ps

# Ver logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## 9. Verificar el despliegue

```bash
# Desde el servidor
curl -I http://127.0.0.1:3000/api/health     # Backend directo
curl -I http://127.0.0.1:8080                  # Frontend directo
curl -I https://certify.jalisco.gob.mx         # A través de Nginx + SSL
curl https://certify.jalisco.gob.mx/api/health # API a través de Nginx + SSL
```

---

## 10. Firewall

```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP (redirect a HTTPS)
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
sudo ufw status
```

> Los puertos 3000 y 8080 no deben estar abiertos al exterior. Al bindear a `127.0.0.1`, Docker ya se encarga de esto.

---

## 11. Flujo completo de despliegue (resumen)

```
┌─────────────────────────────────────────────────────────┐
│  TU MÁQUINA LOCAL                                       │
│                                                         │
│  1. cd frontend && npm run build     → genera dist/     │
│  2. rsync dist/ al servidor                             │
│  3. rsync backend/ al servidor (si hubo cambios)        │
└───────────────────────┬─────────────────────────────────┘
                        │ rsync / scp
                        ▼
┌─────────────────────────────────────────────────────────┐
│  SERVIDOR (certify.jalisco.gob.mx)                      │
│                                                         │
│  4. docker compose up --build -d                        │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  frontend    │  │   backend    │  │   database    │  │
│  │  nginx:alpine│  │  node:20     │  │  postgres:16  │  │
│  │  (dist/)     │  │  (src/)      │  │  (data/)      │  │
│  │  :8080       │  │  :3000       │  │  :5432        │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────────┘  │
│         │                 │    red interna de Docker     │
│  ───────┴─────────────────┴──────────────────────────── │
│                        │                                 │
│  Nginx del host ◄──────┘                                │
│  :80 → redirect :443                                     │
│  :443 → proxy a contenedores                             │
└─────────────────────────────────────────────────────────┘
```

---

## 12. Comandos útiles

| Acción                  | Comando                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| Ver contenedores        | `docker compose -f docker-compose.prod.yml ps`                        |
| Ver logs                | `docker compose -f docker-compose.prod.yml logs -f`                   |
| Reiniciar todo          | `docker compose -f docker-compose.prod.yml restart`                   |
| Detener todo            | `docker compose -f docker-compose.prod.yml down`                      |
| Rebuild frontend        | `docker compose -f docker-compose.prod.yml up --build -d frontend`    |
| Rebuild backend         | `docker compose -f docker-compose.prod.yml up --build -d backend`     |
| Backup base de datos    | `tar -czf backup-db-$(date +%F).tar.gz -C database data`             |
| Backup storage          | `tar -czf backup-storage-$(date +%F).tar.gz -C storage certificates logos` |
| Logs del Nginx del host | `sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log`     |
| Renovar SSL             | `sudo certbot renew`                                                  |

---

## Resumen de puertos

| Servicio          | Puerto interno | Puerto en host      | Acceso externo |
| ----------------- | -------------- | ------------------- | -------------- |
| Nginx del host    | —              | 80, 443             | ✅ Sí          |
| Frontend (Docker) | 80             | 127.0.0.1:8080      | ❌ No          |
| Backend (Docker)  | 3000           | 127.0.0.1:3000      | ❌ No          |
| PostgreSQL        | 5432           | No expuesto         | ❌ No          |
