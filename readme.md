# Plataforma de Emision y Gestion de Credenciales Digitales

## Descripcion General

Plataforma de certificacion verificable que transforma el aprendizaje tecnico en activos digitales seguros. Permite la trazabilidad absoluta de las competencias adquiridas, garantizando que el conocimiento sea auditable y medible.

El sistema permite emitir, gestionar y revocar credenciales digitales que acreditan la participacion en cursos, charlas y talleres. Cada certificado emitido genera un PDF con un codigo QR que enlaza a una pagina publica de verificacion donde cualquier persona puede confirmar la autenticidad y vigencia del documento.

### Caracteristicas principales

- **Plantillas de certificado intercambiables:** Multiples modelos de certificado (formal, moderno, personalizado) seleccionables al emitir. Se crean con HTML/CSS sin modificar codigo.
- **Sistema de dependencias:** Cada unidad organizacional (dependencia) tiene su logo y sus usuarios emisores. Los cursos pueden involucrar multiples dependencias y el certificado mostrara todos los logos.
- **Multi-logo en certificados:** Los certificados incluyen el logo institucional (branding global) mas los logos de todas las dependencias que participaron en el evento.
- **Roles diferenciados:** Usuarios admin con acceso global, y usuarios emisores que solo gestionan los cursos y certificados de su dependencia.
- **Panel de administracion global:** Vista para administradores con lista de todos los eventos, certificados y actividad del sistema.
- **Branding versionado:** Los cambios de logo/colores institucionales no afectan certificados ya emitidos.
- **Verificacion publica:** Cualquier persona puede verificar un certificado escaneando su QR, sin necesidad de cuenta.

## Stack Tecnologico

| Componente | Tecnologia |
|---|---|
| Frontend | React (Vite) + React Router + Axios |
| Backend | Node.js + Express.js |
| Base de Datos | PostgreSQL 16 |
| Generacion PDF | Puppeteer (HTML/CSS a PDF con viewport fijo) |
| Generacion QR | qrcode (npm) |
| Autenticacion | JWT + bcrypt |
| Contenedores | Docker + Docker Compose |

## Requisitos Previos

- Docker Desktop instalado y en ejecucion
- Docker Compose v2+
- Git

## Instalacion Rapida

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd credenciales-digitales
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con los valores deseados
```

3. Levantar el sistema:
```bash
docker compose up --build
```

4. Acceder:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432

5. Login inicial:
- Email: admin@admin.com
- Password: (definido en el seed de la base de datos)

6. Configuracion inicial (desde panel admin):
- Crear dependencias y subir sus logos
- Crear branding institucional (logo, colores, fuente)
- Crear usuarios emisores y asignarlos a dependencias
- (Opcional) Crear nuevas plantillas de certificado

## Comandos Docker Utiles

### Destruir y reconstruir completamente los contenedores

Los datos (base de datos, PDFs, logos) son persistentes y se conservan entre reinicios. Para destruir y reconstruir solo los contenedores e imagenes:

```bash
# Detener y eliminar contenedores y redes (los datos persisten)
docker compose down

# Eliminar las imagenes construidas del proyecto
docker rmi certify-frontend certify-backend

# Reconstruir y levantar todo desde cero
docker compose up --build
```

> **Nota:** Los datos se almacenan en carpetas locales del proyecto, no en volumenes de Docker. Ningun comando de Docker puede eliminarlos. Para reiniciar la base de datos desde cero, elimina manualmente la carpeta `database/data/`. Los PDFs y logos se encuentran en `storage/certificates/` y `storage/logos/`.

## Estructura del Proyecto

Consultar [arquitectura.md](arquitectura.md) para la estructura completa de carpetas, modelo de datos y diagramas de flujo.

## Configuracion y Personalizacion

Consultar [config.md](config.md) para la guia completa de personalizacion (branding, logos, plantillas, dependencias).

## Flujo de Trabajo de Desarrollo

Consultar [instructions.md](instructions.md) para el proceso a seguir al implementar cada tarea.

## Progreso del Desarrollo

Consultar [todo.md](todo.md) para la lista detallada de tareas y su estado actual.

---

## Documentacion por Modulo

> Las siguientes secciones se completaran a medida que cada modulo sea implementado, siguiendo las instrucciones de [instructions.md](instructions.md).

---

### Modulo: Base de Datos

**Estado:** Pendiente

> Se documentara: esquema de tablas (dependencies, users, certificate_templates, courses, course_dependencies, participants, branding_versions, certificates, revocation_log, course_participants), relaciones, indices, migraciones, datos semilla.

---

### Modulo: Autenticacion y Usuarios

**Estado:** Pendiente

> Se documentara: endpoints de auth, sistema de roles (admin/emisor), gestion de usuarios, asignacion a dependencias, formato JWT (incluye role y dependency_id).

---

### Modulo: Dependencias

**Estado:** Pendiente

> Se documentara: CRUD de dependencias, subida de logos, asignacion de usuarios a dependencias, dependencias colaboradoras en cursos.

---

### Modulo: Plantillas de Certificado

**Estado:** Pendiente

> Se documentara: CRUD de plantillas, variables disponibles, preview de plantillas, plantilla por defecto, creacion de nuevos modelos con HTML/CSS.

---

### Modulo: Cursos

**Estado:** Pendiente

> Se documentara: endpoints CRUD de cursos, filtros por dependencia, paginacion, inscripcion de participantes, asociacion de dependencias colaboradoras.

---

### Modulo: Participantes

**Estado:** Pendiente

> Se documentara: endpoints CRUD de participantes, busqueda, historial de certificados.

---

### Modulo: Branding Versionado

**Estado:** Pendiente

> Se documentara: endpoints de branding institucional, sistema de versiones, subida de logos, activacion, independencia de logos de dependencias.

---

### Modulo: Emision de Certificados

**Estado:** Pendiente

> Se documentara: flujo de emision (seleccion de curso, plantilla, participantes), generacion de QR, generacion de PDF con Puppeteer (HTML a PDF con viewport fijo), multi-logo (institucional + dependencias), almacenamiento.

---

### Modulo: Revocacion de Certificados

**Estado:** Pendiente

> Se documentara: flujo de revocacion, log de revocacion, validaciones de permisos por dependencia.

---

### Modulo: Verificacion Publica

**Estado:** Pendiente

> Se documentara: endpoint publico de verificacion, pagina de verificacion, estados posibles, logos institucional y de dependencias.

---

### Modulo: Estadisticas y Panel Admin

**Estado:** Pendiente

> Se documentara: endpoints de estadisticas globales y por dependencia, panel admin con lista global de eventos, lista global de certificados, registro de actividad.

---

### Modulo: Frontend - Autenticacion

**Estado:** Pendiente

> Se documentara: pagina de login, contexto de auth (incluye dependency_id y role), rutas protegidas, AdminRoute, manejo de sesion.

---

### Modulo: Frontend - Layout y Navegacion

**Estado:** Pendiente

> Se documentara: estructura del layout, sidebar diferenciado por rol (admin ve todo, emisor ve su dependencia), header con nombre de dependencia, sistema de rutas.

---

### Modulo: Frontend - Dashboard

**Estado:** Pendiente

> Se documentara: dashboard admin (estadisticas globales, desglose por dependencia), dashboard emisor (estadisticas de su dependencia).

---

### Modulo: Frontend - Gestion de Cursos

**Estado:** Pendiente

> Se documentara: lista de cursos (filtrada por dependencia), formulario CRUD, detalle de curso con dependencias colaboradoras y sus logos, inscripcion de participantes, filtros.

---

### Modulo: Frontend - Gestion de Participantes

**Estado:** Pendiente

> Se documentara: lista de participantes, formulario CRUD, detalle con historial, busqueda.

---

### Modulo: Frontend - Gestion de Certificados

**Estado:** Pendiente

> Se documentara: lista de certificados (filtrada por dependencia), detalle con logos de dependencias, descarga PDF, emision con seleccion de plantilla, revocacion.

---

### Modulo: Frontend - Verificacion Publica

**Estado:** Pendiente

> Se documentara: pagina de verificacion, estados visuales, logos institucional y de dependencias, diseno responsive.

---

### Modulo: Frontend - Panel Admin Global

**Estado:** Pendiente

> Se documentara: gestion de dependencias (CRUD + logos), gestion de plantillas (CRUD + preview + editor HTML), gestion de usuarios (asignacion de roles y dependencias), lista global de eventos, lista global de certificados, registro de actividad.

---

### Modulo: Frontend - Configuracion (Admin)

**Estado:** Pendiente

> Se documentara: gestion de branding institucional, historial de versiones, preview de certificado.

---

### Modulo: Seguridad

**Estado:** Pendiente

> Se documentara: rate limiting, CORS, helmet, validacion de entrada, control de acceso por rol, filtrado por dependencia, aislamiento de datos.

---

### Modulo: Produccion

**Estado:** Pendiente

> Se documentara: docker-compose.prod.yml, nginx, build optimizado, despliegue, respaldo y restauracion.

---

## API Reference

> Se completara con la documentacion detallada de cada endpoint a medida que sean implementados. Formato por endpoint:
>
> **METODO /ruta**
> - Descripcion
> - Autenticacion requerida: si/no
> - Roles permitidos: admin / emisor / publico
> - Filtrado por dependencia: si/no
> - Body/Params esperados
> - Respuesta exitosa (ejemplo)
> - Errores posibles

---

## Licencia

Pendiente de definicion.
