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

## 2. Clonar el proyecto

```bash
cd /opt
sudo git clone <REPO_URL> certify
sudo chown -R $USER:$USER /opt/certify
cd /opt/certify
```

---

## 3. Archivo de entorno `.env.prod`

Crear `/opt/certify/.env.prod` con las variables de producción:

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

## 4. Ajustar `docker-compose.prod.yml`

Modificar los puertos para que solo escuchen en `127.0.0.1` (localhost) y no estén expuestos al exterior. El Nginx del host será quien reciba el tráfico.

```yaml
# docker-compose.prod.yml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        VITE_API_URL: /api
        VITE_APP_TITLE: Plataforma de Credenciales Digitales
    ports:
      - "127.0.0.1:8080:80"   # Solo accesible desde localhost
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    ports:
      - "127.0.0.1:3000:3000"  # Solo accesible desde localhost
    volumes:
      - ./storage/certificates:/app/storage/certificates
      - ./storage/logos:/app/storage/logos
    env_file:
      - .env.prod
    depends_on:
      - database
    restart: unless-stopped

  database:
    image: postgres:16-alpine
    volumes:
      - ./database/data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    restart: unless-stopped
```

> **Nota:** El frontend se mapea al puerto `8080` del host para no colisionar con el Nginx del host que usa el `80`. La base de datos no expone puertos al host.

---

## 5. Configurar Nginx del host

### 5.1. Crear el archivo de configuración

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

### 5.2. Habilitar el sitio

```bash
sudo ln -s /etc/nginx/sites-available/certify.jalisco.gob.mx /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   # Eliminar el default si existe
sudo nginx -t                                  # Verificar sintaxis
sudo systemctl reload nginx
```

---

## 6. Certificado SSL con Let's Encrypt

Antes de tener el certificado, usar temporalmente una config solo HTTP para que Certbot pueda validar:

```bash
# Configuración temporal (solo HTTP, sin redirect)
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

Certbot modificará el archivo automáticamente para incluir SSL. Después, reemplazar con la configuración completa del paso 5.1 y recargar:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Renovación automática (ya viene configurada con el paquete, pero verificar):

```bash
sudo certbot renew --dry-run
```

---

## 7. Build y levantar contenedores

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

## 8. Verificar el despliegue

```bash
# Desde el servidor
curl -I http://127.0.0.1:3000/api/health     # Backend directo
curl -I http://127.0.0.1:8080                  # Frontend directo
curl -I https://certify.jalisco.gob.mx         # A través de Nginx + SSL
curl https://certify.jalisco.gob.mx/api/health # API a través de Nginx + SSL
```

---

## 9. Firewall

Asegurarse de que solo los puertos 80 y 443 estén abiertos al exterior:

```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP (redirect a HTTPS)
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
sudo ufw status
```

> Los puertos 3000 y 8080 no deben estar abiertos al exterior. Al bindear a `127.0.0.1`, Docker ya se encarga de esto.

---

## 10. Actualizar el proyecto

Cuando haya cambios en el código:

```bash
cd /opt/certify
git pull origin main
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

---

## 11. Comandos útiles

| Acción                  | Comando                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| Ver contenedores        | `docker compose -f docker-compose.prod.yml ps`                        |
| Ver logs                | `docker compose -f docker-compose.prod.yml logs -f`                   |
| Reiniciar todo          | `docker compose -f docker-compose.prod.yml restart`                   |
| Detener todo            | `docker compose -f docker-compose.prod.yml down`                      |
| Rebuild un servicio     | `docker compose -f docker-compose.prod.yml up --build -d backend`     |
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
