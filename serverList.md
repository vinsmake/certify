# Lista de Pasos — Despliegue `certify.jalisco.gob.mx`

**Estado:** ✅ Completado | 🔄 En progreso | ⬜ Pendiente

**Dominio:** `certify.jalisco.gob.mx`
**Ruta en servidor:** `/opt/certify`
**Arquitectura:** Nginx host (reverse proxy SSL) → Docker (frontend :8080, backend :3000, postgres interno)

---

## FASE 0 — Prerrequisitos en el Servidor ✅ COMPLETADO

- [x] **Actualizar sistema**
  ```bash
  sudo apt update
  sudo apt upgrade -y
  ```

- [x] **Instalar Nginx**
  ```bash
  sudo apt install nginx -y
  ```

- [x] **Instalar Node.js y npm** *(solo necesario si se hacen builds en el servidor — normalmente se hace local)*
  ```bash
  sudo apt install -y nodejs
  sudo apt install -y npm
  ```

- [x] **Instalar Docker**
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  ```

- [x] **Instalar docker-compose-plugin**
  ```bash
  sudo apt install docker-compose-plugin -y
  ```

---

## FASE 1 — Configuración del Sistema en el Servidor

- [x] **Agregar usuario al grupo `docker`** *(para no usar sudo con cada comando docker)*
  ```bash
  sudo usermod -aG docker $USER
  # Cerrar sesion SSH y volver a entrar para que tome efecto
  # Verificar:
  docker ps
  ```

- [x] **Instalar Certbot y su plugin para Nginx**
  ```bash
  sudo apt install -y certbot python3-certbot-nginx
  # Verificar instalacion:
  certbot --version
  ```

- [x] **Crear directorio del proyecto en el servidor**
  ```bash
  sudo mkdir -p /opt/certify
  sudo chown $USER:$USER /opt/certify
  ```

- [ ] **Crear estructura de directorios de almacenamiento**
  ```bash
  mkdir -p /opt/certify/storage/certificates
  mkdir -p /opt/certify/storage/logos/branding
  mkdir -p /opt/certify/storage/logos/dependencies
  mkdir -p /opt/certify/storage/signatures
  mkdir -p /opt/certify/database/data
  mkdir -p /opt/certify/database/init
  ```

---

## FASE 2 — Preparar Archivos en la Máquina Local

> Estos pasos se ejecutan **en tu computadora (Windows/local)**, no en el servidor.

- [ ] **Verificar que `frontend/.env.production` existe y tiene el contenido correcto**

  Archivo: `frontend/.env.production`
  ```env
  VITE_API_URL=/api
  VITE_APP_TITLE=Plataforma de Credenciales Digitales
  ```
  > ✅ Ya creado. Verificar que existe antes de compilar.

- [ ] **Compilar el frontend localmente**
  ```bash
  cd frontend
  npm install
  npm run build
  cd ..
  ```
  > Esto genera `frontend/dist/` con los archivos estáticos optimizados.
  > El archivo `.env.production` es leído automáticamente por Vite al hacer `npm run build`.

- [ ] **Generar contraseñas seguras para el servidor**

  Para `POSTGRES_PASSWORD` (en tu terminal local):
  ```bash
  # Opcion A - openssl
  openssl rand -base64 32

  # Opcion B - /dev/urandom
  cat /dev/urandom | tr -dc 'a-zA-Z0-9!@#%^&*' | head -c 32
  ```

  Para `JWT_SECRET`:
  ```bash
  openssl rand -base64 64
  ```
  > Guardar ambos valores en un lugar seguro. Se necesitan en la Fase 4.

---

## FASE 3 — Subir Archivos al Servidor

> Estos pasos se ejecutan desde **tu computadora local** con acceso SSH al servidor.

- [ ] **Subir proyecto al servidor con rsync**
  ```bash
  # Desde la raiz del proyecto (certify/)
  rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude 'frontend/src' \
    --exclude 'frontend/public' \
    --exclude 'frontend/index.html' \
    --exclude 'frontend/package.json' \
    --exclude 'frontend/package-lock.json' \
    --exclude 'frontend/vite.config.js' \
    --exclude 'frontend/Dockerfile' \
    --exclude 'frontend/.env.production' \
    --exclude 'database/data' \
    --exclude '.env' \
    --exclude '.git' \
    --exclude '.claude' \
    --exclude '*.md' \
    --exclude 'storage/certificates' \
    --exclude 'storage/logos' \
    --exclude 'storage/signatures' \
    ./ USUARIO@certify.jalisco.gob.mx:/opt/certify/
  ```
  > Reemplazar `USUARIO` por el usuario SSH del servidor (ej: `ubuntu`, `deploy`, `root`).

- [ ] **Verificar la estructura subida en el servidor**
  ```bash
  ssh USUARIO@certify.jalisco.gob.mx "ls -la /opt/certify/"
  ssh USUARIO@certify.jalisco.gob.mx "ls -la /opt/certify/frontend/"
  ssh USUARIO@certify.jalisco.gob.mx "ls -la /opt/certify/backend/src/"
  ssh USUARIO@certify.jalisco.gob.mx "ls -la /opt/certify/database/init/"
  ```
  Debe existir:
  - `/opt/certify/docker-compose.prod.yml`
  - `/opt/certify/.env.prod` *(con placeholders — se edita en Fase 4)*
  - `/opt/certify/frontend/dist/` *(build compilada)*
  - `/opt/certify/frontend/Dockerfile.prod`
  - `/opt/certify/frontend/nginx.conf`
  - `/opt/certify/backend/src/`
  - `/opt/certify/backend/Dockerfile.prod`
  - `/opt/certify/database/init/01_schema.sql`

- [ ] **Recrear directorios de storage que rsync no haya copiado**
  ```bash
  ssh USUARIO@certify.jalisco.gob.mx "
    mkdir -p /opt/certify/storage/certificates
    mkdir -p /opt/certify/storage/logos/branding
    mkdir -p /opt/certify/storage/logos/dependencies
    mkdir -p /opt/certify/storage/signatures
    mkdir -p /opt/certify/database/data
  "
  ```

---

## FASE 4 — Configurar `.env.prod` en el Servidor

> Estos pasos se ejecutan **en el servidor** (via SSH).

- [ ] **Editar el archivo `.env.prod` con las credenciales reales de producción**
  ```bash
  ssh USUARIO@certify.jalisco.gob.mx
  nano /opt/certify/.env.prod
  ```

  Contenido final que debe quedar:
  ```env
  # ===========================================
  # Produccion - Base de Datos (PostgreSQL)
  # ===========================================
  POSTGRES_USER=certify_user
  POSTGRES_PASSWORD=<CONTRASEÑA_GENERADA_EN_FASE_2>
  POSTGRES_DB=certify_db
  POSTGRES_HOST=database
  POSTGRES_PORT=5432

  # ===========================================
  # Produccion - Backend
  # ===========================================
  NODE_ENV=production
  PORT=3000
  JWT_SECRET=<JWT_SECRET_GENERADO_EN_FASE_2>
  JWT_EXPIRATION=8h

  # ===========================================
  # Produccion - URLs Base
  # ===========================================
  BASE_URL=https://certify.jalisco.gob.mx
  API_URL=https://certify.jalisco.gob.mx/api
  VERIFICATION_BASE_URL=https://certify.jalisco.gob.mx/verificar
  ```
  > Guardar con `Ctrl+O`, salir con `Ctrl+X`.

- [ ] **Verificar que el archivo tiene los valores correctos**
  ```bash
  cat /opt/certify/.env.prod
  ```
  > Asegurarse de que no queden los placeholders `CAMBIAR_POR_*`.

---

## FASE 5 — Configurar Nginx (HTTP temporal para obtener SSL)

> En el servidor.

- [ ] **Crear el archivo de configuración Nginx (solo HTTP por ahora)**
  ```bash
  sudo nano /etc/nginx/sites-available/certify.jalisco.gob.mx
  ```

  Pegar este contenido:
  ```nginx
  server {
      listen 80;
      server_name certify.jalisco.gob.mx;

      # Limite de subida de archivos (logos, firmas)
      client_max_body_size 20M;

      location /api/ {
          proxy_pass http://127.0.0.1:3000/api/;
          proxy_http_version 1.1;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
          proxy_read_timeout 120s;
          proxy_send_timeout 120s;
      }

      location /storage/ {
          proxy_pass http://127.0.0.1:3000/storage/;
          proxy_http_version 1.1;
          proxy_set_header Host $host;
      }

      location / {
          proxy_pass http://127.0.0.1:8080;
          proxy_http_version 1.1;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }
  ```

- [ ] **Habilitar el sitio y deshabilitar el default**
  ```bash
  sudo ln -s /etc/nginx/sites-available/certify.jalisco.gob.mx /etc/nginx/sites-enabled/
  sudo rm -f /etc/nginx/sites-enabled/default
  ```

- [ ] **Verificar sintaxis y recargar Nginx**
  ```bash
  sudo nginx -t
  sudo systemctl reload nginx
  ```

---

## FASE 6 — Levantar Contenedores Docker

> En el servidor, desde `/opt/certify`.

- [ ] **Construir e iniciar todos los contenedores**
  ```bash
  cd /opt/certify
  docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
  ```
  > La primera vez tarda varios minutos: descarga imágenes de Docker Hub y compila el backend.

- [ ] **Verificar que los tres contenedores están corriendo**
  ```bash
  docker compose -f docker-compose.prod.yml ps
  ```
  Debe mostrar los tres servicios en estado `running`:
  - `certify-frontend-1`
  - `certify-backend-1`
  - `certify-database-1`

- [ ] **Revisar logs para detectar errores**
  ```bash
  # Todos los servicios
  docker compose -f docker-compose.prod.yml logs --tail=50

  # Solo backend (donde suelen ocurrir errores de DB)
  docker compose -f docker-compose.prod.yml logs backend --tail=50

  # Solo base de datos
  docker compose -f docker-compose.prod.yml logs database --tail=50
  ```
  > Buscar mensajes como `Server running on port 3000` y `database system is ready to accept connections`.

- [ ] **Probar los contenedores directamente desde el servidor**
  ```bash
  # Backend
  curl -s http://127.0.0.1:3000/api/health
  # o si no hay endpoint /health:
  curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/

  # Frontend
  curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080
  ```
  > El frontend debe devolver `200`. El backend debe responder (200 o 404 en la raiz, ambos indican que esta corriendo).

- [ ] **Probar via Nginx (HTTP)**
  ```bash
  curl -s -o /dev/null -w "%{http_code}" http://certify.jalisco.gob.mx
  curl -s -o /dev/null -w "%{http_code}" http://certify.jalisco.gob.mx/api/
  ```

---

## FASE 7 — Certificado SSL con Let's Encrypt

> En el servidor. El dominio `certify.jalisco.gob.mx` debe ya apuntar a la IP del servidor (DNS configurado por el área de TI de Jalisco).

- [ ] **Verificar que el dominio resuelve a la IP correcta**
  ```bash
  dig certify.jalisco.gob.mx +short
  # o desde fuera del servidor:
  nslookup certify.jalisco.gob.mx
  ```

- [ ] **Verificar que el puerto 80 es accesible desde internet**
  ```bash
  # Desde tu maquina local:
  curl -I http://certify.jalisco.gob.mx
  ```

- [ ] **Obtener certificado SSL con Certbot**
  ```bash
  sudo certbot --nginx -d certify.jalisco.gob.mx
  ```
  > Certbot pedirá un email para notificaciones de renovación y aceptar términos.
  > Certbot modifica automáticamente la config de Nginx para incluir SSL.
  >
  > **NOTA:** Si el dominio `jalisco.gob.mx` tiene restricciones de DNS o firewall que impidan la validación HTTP de Let's Encrypt,
  > contactar al área de TI para usar validación DNS (`--preferred-challenges dns`) o un certificado institucional.

- [ ] **Verificar que la renovación automática funciona**
  ```bash
  sudo certbot renew --dry-run
  ```
  > Debe terminar con `Congratulations, all simulated renewals succeeded`.

---

## FASE 8 — Nginx con HTTPS Completo

> Certbot ya habrá modificado el archivo de Nginx. Verificar que quedó bien, o reemplazar con la configuración completa.

- [ ] **Reemplazar la config de Nginx con la versión HTTPS completa**
  ```bash
  sudo nano /etc/nginx/sites-available/certify.jalisco.gob.mx
  ```

  Contenido final:
  ```nginx
  # Redirigir HTTP → HTTPS
  server {
      listen 80;
      server_name certify.jalisco.gob.mx;
      return 301 https://$host$request_uri;
  }

  server {
      listen 443 ssl http2;
      server_name certify.jalisco.gob.mx;

      # ─── SSL (generados por Certbot) ───
      ssl_certificate     /etc/letsencrypt/live/certify.jalisco.gob.mx/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/certify.jalisco.gob.mx/privkey.pem;
      include             /etc/letsencrypt/options-ssl-nginx.conf;
      ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

      # ─── Headers de seguridad ───
      add_header X-Frame-Options        "SAMEORIGIN" always;
      add_header X-Content-Type-Options "nosniff" always;
      add_header Referrer-Policy        "strict-origin-when-cross-origin" always;
      add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

      # ─── Limite de subida (logos, firmas) ───
      client_max_body_size 20M;

      # ─── API → backend Node.js en Docker ───
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

      # ─── Storage (logos, certificados publicos) → backend ───
      location /storage/ {
          proxy_pass http://127.0.0.1:3000/storage/;
          proxy_http_version 1.1;
          proxy_set_header Host $host;
      }

      # ─── Frontend SPA → Nginx interno en Docker ───
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

- [ ] **Verificar sintaxis y recargar Nginx**
  ```bash
  sudo nginx -t
  sudo systemctl reload nginx
  ```

- [ ] **Probar HTTPS**
  ```bash
  curl -I https://certify.jalisco.gob.mx
  curl -s -o /dev/null -w "%{http_code}" https://certify.jalisco.gob.mx/api/
  ```

---

## FASE 9 — Firewall (UFW)

- [ ] **Configurar UFW para permitir solo los puertos necesarios**
  ```bash
  sudo ufw allow 22/tcp    # SSH (obligatorio, no olvidar antes de activar)
  sudo ufw allow 80/tcp    # HTTP (redirect a HTTPS)
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw enable
  ```
  > Cuando pregunte "Command may disrupt existing ssh connections. Proceed with operation (y|n)?", escribir `y`.

- [ ] **Verificar el estado del firewall**
  ```bash
  sudo ufw status verbose
  ```
  > Los puertos 3000 y 8080 NO deben estar listados como abiertos al exterior.

---

## FASE 10 — Verificación Final

- [ ] **Verificar la aplicación desde el navegador**
  - Abrir `https://certify.jalisco.gob.mx` en el navegador
  - Verificar que carga el login
  - Verificar que el candado SSL aparece en el navegador

- [ ] **Verificar el API**
  ```bash
  curl https://certify.jalisco.gob.mx/api/
  ```

- [ ] **Iniciar sesión con credenciales de administrador**
  > Las credenciales iniciales están en `temporalCredentials.md` del proyecto.

- [ ] **Probar generación de un certificado PDF**
  - Crear una dependencia
  - Crear un curso
  - Agregar un participante
  - Emitir el certificado
  - Descargar el PDF y verificar que el QR funciona

- [ ] **Verificar que el QR del certificado apunta a la URL correcta**
  - Escanear el QR del PDF
  - Debe abrir `https://certify.jalisco.gob.mx/verificar/<uuid>`

- [ ] **Verificar la subida de logos**
  - Subir un logo de dependencia
  - Verificar que aparece en la URL `https://certify.jalisco.gob.mx/storage/logos/...`

---

## Referencia Rápida — Comandos Útiles Post-Despliegue

```bash
# Ver estado de contenedores
cd /opt/certify && docker compose -f docker-compose.prod.yml ps

# Ver logs en tiempo real
docker compose -f docker-compose.prod.yml logs -f

# Reiniciar un servicio
docker compose -f docker-compose.prod.yml restart backend

# Rebuild completo
docker compose -f docker-compose.prod.yml up --build -d

# Backup de la base de datos
tar -czf /opt/backup-db-$(date +%F).tar.gz -C /opt/certify/database data

# Backup del storage
tar -czf /opt/backup-storage-$(date +%F).tar.gz -C /opt/certify/storage .

# Logs de Nginx del host
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log

# Renovar SSL manualmente
sudo certbot renew

# Estado del firewall
sudo ufw status verbose
```

---

## Flujo de Actualizaciones Futuras

### Solo cambia el frontend:
```bash
# Local:
cd frontend && npm run build && cd ..
rsync -avz --delete frontend/dist/ USUARIO@certify.jalisco.gob.mx:/opt/certify/frontend/dist/

# Servidor:
ssh USUARIO@certify.jalisco.gob.mx "cd /opt/certify && docker compose -f docker-compose.prod.yml up --build -d frontend"
```

### Solo cambia el backend:
```bash
# Local:
rsync -avz --delete --exclude 'node_modules' backend/ USUARIO@certify.jalisco.gob.mx:/opt/certify/backend/

# Servidor:
ssh USUARIO@certify.jalisco.gob.mx "cd /opt/certify && docker compose -f docker-compose.prod.yml up --build -d backend"
```

### Cambian ambos:
```bash
# Local:
cd frontend && npm run build && cd ..
rsync -avz --progress \
  --exclude 'node_modules' --exclude 'frontend/src' --exclude 'frontend/public' \
  --exclude 'frontend/index.html' --exclude 'frontend/package*.json' \
  --exclude 'frontend/vite.config.js' --exclude 'frontend/Dockerfile' \
  --exclude 'database/data' --exclude '.env' --exclude '.git' --exclude '.claude' \
  ./ USUARIO@certify.jalisco.gob.mx:/opt/certify/

# Servidor:
ssh USUARIO@certify.jalisco.gob.mx "cd /opt/certify && docker compose -f docker-compose.prod.yml up --build -d"
```

---

## Resumen de Puertos

| Servicio           | Puerto interno | Expuesto en host   | Acceso exterior |
| ------------------ | -------------- | ------------------ | --------------- |
| Nginx del host     | —              | 80, 443            | ✅ Sí           |
| Frontend (Docker)  | 80             | 127.0.0.1:**8080** | ❌ No           |
| Backend (Docker)   | 3000           | 127.0.0.1:**3000** | ❌ No           |
| PostgreSQL (Docker)| 5432           | No expuesto        | ❌ No           |
