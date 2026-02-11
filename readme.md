# Plataforma de Emision y Gestion de Credenciales Digitales

## Descripcion General

Plataforma de certificacion verificable que transforma el aprendizaje tecnico en activos digitales seguros. Permite la trazabilidad absoluta de las competencias adquiridas, garantizando que el conocimiento sea auditable y medible.

El sistema permite emitir, gestionar y revocar credenciales digitales que acreditan la participacion en cursos, charlas y talleres. Cada certificado emitido genera un PDF con un codigo QR que enlaza a una pagina publica de verificacion donde cualquier persona puede confirmar la autenticidad y vigencia del documento.

## Stack Tecnologico

| Componente | Tecnologia |
|---|---|
| Frontend | React (Vite) + React Router + Axios |
| Backend | Node.js + Express.js |
| Base de Datos | PostgreSQL 16 |
| Generacion PDF | Puppeteer |
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

## Estructura del Proyecto

Consultar [arquitectura.md](arquitectura.md) para la estructura completa de carpetas, modelo de datos y diagramas de flujo.

## Configuracion y Personalizacion

Consultar [config.md](config.md) para la guia completa de personalizacion (branding, logos, colores, fuentes, plantilla de certificado).

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

> Se documentara: esquema de tablas, relaciones, indices, migraciones, datos semilla.

---

### Modulo: Autenticacion y Usuarios

**Estado:** Pendiente

> Se documentara: endpoints de auth, sistema de roles, gestion de usuarios, formato JWT.

---

### Modulo: Cursos

**Estado:** Pendiente

> Se documentara: endpoints CRUD de cursos, filtros, paginacion, inscripcion de participantes.

---

### Modulo: Participantes

**Estado:** Pendiente

> Se documentara: endpoints CRUD de participantes, busqueda, historial de certificados.

---

### Modulo: Branding Versionado

**Estado:** Pendiente

> Se documentara: endpoints de branding, sistema de versiones, subida de logos, activacion.

---

### Modulo: Emision de Certificados

**Estado:** Pendiente

> Se documentara: flujo de emision, generacion de QR, generacion de PDF, almacenamiento.

---

### Modulo: Revocacion de Certificados

**Estado:** Pendiente

> Se documentara: flujo de revocacion, log de revocacion, validaciones.

---

### Modulo: Verificacion Publica

**Estado:** Pendiente

> Se documentara: endpoint publico de verificacion, pagina de verificacion, estados posibles.

---

### Modulo: Frontend - Autenticacion

**Estado:** Pendiente

> Se documentara: pagina de login, contexto de auth, rutas protegidas, manejo de sesion.

---

### Modulo: Frontend - Layout y Navegacion

**Estado:** Pendiente

> Se documentara: estructura del layout, sidebar, header, sistema de rutas, control de acceso por rol.

---

### Modulo: Frontend - Dashboard

**Estado:** Pendiente

> Se documentara: estadisticas mostradas, endpoint de stats, tarjetas de resumen.

---

### Modulo: Frontend - Gestion de Cursos

**Estado:** Pendiente

> Se documentara: lista de cursos, formulario CRUD, detalle de curso, inscripcion de participantes, filtros.

---

### Modulo: Frontend - Gestion de Participantes

**Estado:** Pendiente

> Se documentara: lista de participantes, formulario CRUD, detalle con historial, busqueda.

---

### Modulo: Frontend - Gestion de Certificados

**Estado:** Pendiente

> Se documentara: lista de certificados, detalle, descarga PDF, emision masiva, revocacion.

---

### Modulo: Frontend - Verificacion Publica

**Estado:** Pendiente

> Se documentara: pagina de verificacion, estados visuales, diseno responsive.

---

### Modulo: Frontend - Configuracion (Admin)

**Estado:** Pendiente

> Se documentara: gestion de usuarios, gestion de branding, preview de certificado.

---

### Modulo: Seguridad

**Estado:** Pendiente

> Se documentara: rate limiting, CORS, helmet, validacion de entrada, control de acceso.

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
> - Roles permitidos
> - Body/Params esperados
> - Respuesta exitosa (ejemplo)
> - Errores posibles

---

## Licencia

Pendiente de definicion.
