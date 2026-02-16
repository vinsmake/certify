# Credenciales y Datos de Prueba

> Archivo temporal para uso durante el desarrollo. No incluir en produccion.

---

## Acceso al Sistema

| Campo | Valor |
|---|---|
| URL Backend | http://localhost:3000 |
| URL Frontend | http://localhost:5173 |

### Usuario Admin

| Campo | Valor |
|---|---|
| Email | vinsmakedev@gmail.com |
| Password | @0G00G0000000000 |
| Rol | admin |
| dependency_id | null (ve todo) |

---

## Base de Datos (PostgreSQL)

| Campo | Valor |
|---|---|
| Host | localhost |
| Puerto | 5432 |
| Base de datos | credenciales_db |
| Usuario | credenciales_user |
| Password | password_seguro_aqui |

### Acceso directo via Docker

```bash
docker exec certify-database-1 psql -U credenciales_user -d credenciales_db -c "<query SQL>"
```

---

## Obtener Token JWT

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"Admin123!"}'
```

Usar el campo `token` de la respuesta en el header `Authorization: Bearer <token>`.

> El token expira en 8 horas (configurado en JWT_EXPIRATION=8h).

---

## IDs de Datos Semilla (creados durante pruebas)

### Dependencias
| ID | Nombre |
|---|---|
| 1 | Dependencia General (semilla inicial) |

### Branding
| ID | Label | Estado |
|---|---|---|
| 1 | v1 inicial | (segun estado actual) |
| 2 | (si fue creado) | activo |

### Plantillas de Certificado
| ID | Slug | Nombre |
|---|---|---|
| 1 | default | Plantilla por Defecto |
| 2 | formal | Plantilla Formal |
| 3 | modern | Plantilla Moderna |

### Cursos
| ID | Nombre | Notas |
|---|---|---|
| 1 | Curso de Prueba Bloque 10 | Creado durante pruebas de Bloque 10 |

### Participantes
| ID | Cedula | Nombre |
|---|---|---|
| 1 | (ver BD) | (ver BD) |
| 3 | 5555555555 | Ana Garcia |

### Certificados
| ID | UUID | Estado | Notas |
|---|---|---|---|
| 1 | (ver BD) | valid | Primer certificado emitido |
| 2 | c6adb454-4fcc-45bd-88e2-c6753e2e21a0 | revoked | Revocado durante pruebas de Bloque 15 |

---

## Comandos Utiles

### Contenedores

```bash
# Ver estado de contenedores
docker ps --format "table {{.Names}}\t{{.Status}}"

# Reiniciar backend (cuando nodemon no recarga)
docker restart certify-backend-1

# Ver logs del backend
docker logs certify-backend-1 --tail 20

# Ver logs en tiempo real
docker logs -f certify-backend-1
```

### Base de Datos

```bash
# Listar todas las tablas
docker exec certify-database-1 psql -U credenciales_user -d credenciales_db \
  -c "\dt"

# Ver usuarios
docker exec certify-database-1 psql -U credenciales_user -d credenciales_db \
  -c "SELECT id, email, role, dependency_id FROM users;"

# Ver certificados
docker exec certify-database-1 psql -U credenciales_user -d credenciales_db \
  -c "SELECT id, uuid, status, participant_id, course_id FROM certificates;"

# Ver log de revocaciones
docker exec certify-database-1 psql -U credenciales_user -d credenciales_db \
  -c "SELECT * FROM revocation_log;"

# Ver branding activo
docker exec certify-database-1 psql -U credenciales_user -d credenciales_db \
  -c "SELECT id, version_label, is_active FROM branding_versions;"
```

### Pruebas con curl

```bash
# Guardar token en variable
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"Admin123!"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Verificar token
echo $TOKEN

# Usar token en peticiones
curl -s -X GET http://localhost:3000/api/certificates \
  -H "Authorization: Bearer $TOKEN"
```

---

## Variables de Entorno (.env)

```
POSTGRES_USER=credenciales_user
POSTGRES_PASSWORD=password_seguro_aqui
POSTGRES_DB=credenciales_db
POSTGRES_HOST=database
POSTGRES_PORT=5432
NODE_ENV=development
PORT=3000
JWT_SECRET=clave_secreta_jwt_cambiar_en_produccion
JWT_EXPIRATION=8h
BASE_URL=http://localhost:5173
API_URL=http://localhost:3000
VERIFICATION_BASE_URL=http://localhost:5173/verificar
VITE_API_URL=http://localhost:3000/api
VITE_APP_TITLE=Plataforma de Credenciales Digitales
```
