# Lista de Pasos — Despliegue `certify.jalisco.gob.mx`

**Estado:** ✅ Completado | ⬜ Pendiente

**Dominio:** `certify.jalisco.gob.mx`
**Ruta en servidor:** `/opt/certify`
**Arquitectura:** Nginx host (reverse proxy SSL) → Docker (frontend :8080, backend :3000, postgres interno)

**Estrategia de despliegue:** `git clone` en el servidor. El frontend se compila dentro de Docker (multi-stage build), sin necesidad de Node.js en el host.

---

## FASE 0 — Prerrequisitos en el Servidor ✅

- [x] Actualizar sistema (`apt update && apt upgrade`)
- [x] Instalar Nginx
- [x] Instalar Node.js y npm
- [x] Instalar Docker
- [x] Instalar docker-compose-plugin

---

## FASE 1 — Configuración del Sistema en el Servidor ✅

- [x] **Agregar usuario al grupo `docker`**
  ```bash
  sudo usermod -aG docker $USER
  # Cerrar sesion y volver a entrar, luego verificar:
  docker ps
  ```

- [x] **Instalar Certbot y su plugin para Nginx**
  ```bash
  sudo apt install -y certbot python3-certbot-nginx
  certbot --version
  ```

- [x] **Crear directorio del proyecto**
  ```bash
  sudo mkdir -p /opt/certify
  sudo chown $USER:$USER /opt/certify
  ```

- [x] **Crear estructura de directorios de almacenamiento**

  > Git no rastrea carpetas vacías. Estos directorios deben existir antes de levantar Docker.

  ```bash
  mkdir -p /opt/certify/storage/certificates
  mkdir -p /opt/certify/storage/logos/branding
  mkdir -p /opt/certify/storage/logos/dependencies
  mkdir -p /opt/certify/storage/signatures
  mkdir -p /opt/certify/database/data
  ```

---

## FASE 2 — Clonar el Repositorio en el Servidor

- [x] **Clonar el repositorio**
  ```bash
  cd /opt/certify
  git init
  git remote add origin https://vinsmake:<GITHUB_TOKEN>@github.com/vinsmake/certify.git
  git fetch origin main
  git reset --hard origin/main
  ```

- [x] **Verificar que los archivos clave existen**
  ```bash
  ls /opt/certify/docker-compose.prod.yml
  ls /opt/certify/.env.prod
  ls /opt/certify/backend/Dockerfile.prod
  ls /opt/certify/frontend/Dockerfile.prod
  ls /opt/certify/database/init/01_schema.sql
  ```

- [x] **Proteger `.env.prod` de futuros `git pull`**

  > Hacer esto ahora, antes de editar el archivo con credenciales reales. Le dice a git que ignore los cambios locales de este archivo, para que un `git pull` futuro nunca sobreescriba las credenciales del servidor.
  ```bash
  git -C /opt/certify update-index --assume-unchanged .env.prod
  ```

---

## FASE 3 — Configurar `.env.prod` en el Servidor

- [x] **Generar contraseñas seguras**
  ```bash
  # POSTGRES_PASSWORD:
  openssl rand -base64 32

  # JWT_SECRET:
  openssl rand -base64 64
  ```
  > Guardar ambos valores antes de editar el archivo.

- [x] **Editar `.env.prod` con las credenciales reales**
  ```bash
  nano /opt/certify/.env.prod
  ```

  Contenido final:
  ```env
  # Base de datos
  POSTGRES_USER=certify_user
  POSTGRES_PASSWORD=<CONTRASEÑA_GENERADA>
  POSTGRES_DB=certify_db
  POSTGRES_HOST=database
  POSTGRES_PORT=5432

  # Backend
  NODE_ENV=production
  PORT=3000
  JWT_SECRET=<JWT_SECRET_GENERADO>
  JWT_EXPIRATION=8h

  # URLs
  BASE_URL=https://certify.jalisco.gob.mx
  API_URL=https://certify.jalisco.gob.mx/api
  VERIFICATION_BASE_URL=https://certify.jalisco.gob.mx/verificar
  ```
  > Guardar con `Ctrl+O`, salir con `Ctrl+X`.

- [x] **Verificar que no quedaron placeholders**
  ```bash
  grep "CAMBIAR" /opt/certify/.env.prod
  # No debe mostrar nada
  ```

---

## FASE 4 — Configurar Nginx (HTTP temporal para obtener SSL)

- [x] **Crear la configuración de Nginx**
  ```bash
  sudo nano /etc/nginx/sites-available/certify.jalisco.gob.mx
  ```

  Contenido:
  ```nginx
  server {
      listen 80;
      server_name certify.jalisco.gob.mx;

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

- [x] **Habilitar el sitio y deshabilitar el default**
  ```bash
  sudo ln -s /etc/nginx/sites-available/certify.jalisco.gob.mx /etc/nginx/sites-enabled/
  sudo rm -f /etc/nginx/sites-enabled/default
  ```

- [x] **Verificar sintaxis y recargar Nginx**
  ```bash
  sudo nginx -t
  sudo systemctl reload nginx
  ```

---

## FASE 5 — Levantar Contenedores Docker

> El `docker compose up --build` compila el frontend dentro de Docker (multi-stage build). No se necesita Node.js en el host.

- [x] **Construir e iniciar todos los contenedores**
  ```bash
  cd /opt/certify
  docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
  ```
  > La primera vez tarda varios minutos: descarga imágenes y compila el frontend + backend.

- [x] **Verificar que los tres contenedores están corriendo**
  ```bash
  docker compose -f docker-compose.prod.yml ps
  ```
  Debe mostrar `running` para:
  - `certify-frontend-1`
  - `certify-backend-1`
  - `certify-database-1`

- [x] **Revisar logs para detectar errores**
  ```bash
  # Todos los servicios
  docker compose -f docker-compose.prod.yml logs --tail=50

  # Solo backend (errores de DB o configuracion)
  docker compose -f docker-compose.prod.yml logs backend --tail=50
  ```
  > Buscar: `Server running on port 3000` y `database system is ready to accept connections`.

- [ ] **Probar los servicios directamente desde el servidor**
  ```bash
  # Frontend
  curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080

  # Backend
  curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/
  ```
  > Ambos deben devolver `200` o `404` (cualquier respuesta indica que está corriendo).

- [ ] **Probar via Nginx en HTTP**
  ```bash
  curl -s -o /dev/null -w "%{http_code}" http://certify.jalisco.gob.mx
  curl -s -o /dev/null -w "%{http_code}" http://certify.jalisco.gob.mx/api/
  ```

---

## FASE 6 — Certificado SSL con Let's Encrypt

> El dominio `certify.jalisco.gob.mx` debe apuntar a la IP del servidor (DNS configurado por TI de Jalisco) y el puerto 80 debe ser accesible desde internet.

- [ ] **Verificar que el dominio resuelve correctamente**
  ```bash
  dig certify.jalisco.gob.mx +short
  # Debe mostrar la IP publica del servidor
  ```

- [ ] **Obtener certificado SSL**
  ```bash
  sudo certbot --nginx -d certify.jalisco.gob.mx
  ```
  > Certbot pedirá email y aceptación de términos, luego modifica Nginx automáticamente para incluir SSL.
  >
  > **NOTA:** Si el área de TI de Jalisco no permite validación HTTP externa, contactarles para usar validación DNS (`--preferred-challenges dns`) o un certificado institucional.

- [ ] **Verificar renovación automática**
  ```bash
  sudo certbot renew --dry-run
  ```
  > Debe terminar con `All simulated renewals succeeded`.

---

## FASE 7 — Nginx con HTTPS Completo

> Certbot ya modificó el archivo. Reemplazar con la configuración completa y optimizada.

- [ ] **Reemplazar la configuración de Nginx**
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

      # SSL (generados por Certbot)
      ssl_certificate     /etc/letsencrypt/live/certify.jalisco.gob.mx/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/certify.jalisco.gob.mx/privkey.pem;
      include             /etc/letsencrypt/options-ssl-nginx.conf;
      ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

      # Headers de seguridad
      add_header X-Frame-Options        "SAMEORIGIN" always;
      add_header X-Content-Type-Options "nosniff" always;
      add_header Referrer-Policy        "strict-origin-when-cross-origin" always;
      add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

      client_max_body_size 20M;

      # API → backend Node.js en Docker
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

      # Storage (logos, certificados) → backend
      location /storage/ {
          proxy_pass http://127.0.0.1:3000/storage/;
          proxy_http_version 1.1;
          proxy_set_header Host $host;
      }

      # Frontend SPA → Nginx interno en Docker
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
  ```

---

## FASE 8 — Firewall (UFW)

- [ ] **Configurar reglas**
  ```bash
  sudo ufw allow 22/tcp    # SSH — obligatorio antes de activar
  sudo ufw allow 80/tcp    # HTTP (redirect a HTTPS)
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw enable
  ```

- [ ] **Verificar estado**
  ```bash
  sudo ufw status verbose
  ```
  > Los puertos 3000 y 8080 NO deben aparecer abiertos al exterior.

---

## FASE 9 — Verificación Final

- [ ] Abrir `https://certify.jalisco.gob.mx` en el navegador — debe cargar el login con candado SSL
- [ ] Iniciar sesión con credenciales de administrador (ver `temporalCredentials.md`)
- [ ] Crear una dependencia de prueba y subir un logo
- [ ] Crear un curso y emitir un certificado
- [ ] Descargar el PDF y verificar que el QR funciona
- [ ] Escanear el QR — debe abrir `https://certify.jalisco.gob.mx/verificar/<uuid>`

---

## Referencia Rápida — Comandos Post-Despliegue

```bash
# Ver estado de contenedores
cd /opt/certify && docker compose -f docker-compose.prod.yml ps

# Ver logs en tiempo real
docker compose -f docker-compose.prod.yml logs -f

# Reiniciar un servicio
docker compose -f docker-compose.prod.yml restart backend

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log

# Renovar SSL manualmente
sudo certbot renew

# Estado del firewall
sudo ufw status verbose

# Backup base de datos
sudo tar -czf /opt/backup-db-$(date +%F).tar.gz -C /opt/certify/database data

# Backup storage
sudo tar -czf /opt/backup-storage-$(date +%F).tar.gz -C /opt/certify/storage .
```

---

## Flujo de Actualizaciones Futuras

```bash
# En el servidor:
cd /opt/certify
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

> El `--build` recompila el frontend y el backend automáticamente.
> El `.env.prod` con credenciales reales nunca se sobreescribe (protegido con `assume-unchanged`).

---

## Resumen de Puertos

| Servicio            | Puerto interno | Expuesto en host    | Acceso exterior |
| ------------------- | -------------- | ------------------- | --------------- |
| Nginx del host      | —              | 80, 443             | ✅ Sí           |
| Frontend (Docker)   | 80             | 127.0.0.1:**8080**  | ❌ No           |
| Backend (Docker)    | 3000           | 127.0.0.1:**3000**  | ❌ No           |
| PostgreSQL (Docker) | 5432           | No expuesto         | ❌ No           |
