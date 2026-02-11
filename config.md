# Configuracion del Sistema - Guia de Personalizacion

Este documento explica como configurar y personalizar la plataforma para que sea replicable e instalable por cualquier organizacion.

## 1. Variables de Entorno (.env)

El archivo `.env` en la raiz del proyecto contiene toda la configuracion del sistema. Se debe crear a partir de `.env.example`.

### 1.1 Base de datos
```
POSTGRES_USER=credenciales_user
POSTGRES_PASSWORD=password_seguro_aqui
POSTGRES_DB=credenciales_db
POSTGRES_HOST=database
POSTGRES_PORT=5432
```

### 1.2 Backend
```
NODE_ENV=development
PORT=3000
JWT_SECRET=clave_secreta_jwt_cambiar_en_produccion
JWT_EXPIRATION=8h
```

### 1.3 URL base
```
BASE_URL=http://localhost:5173
API_URL=http://localhost:3000
VERIFICATION_BASE_URL=http://localhost:5173/verificar
```
La variable VERIFICATION_BASE_URL es la que se usa para generar los QR de los certificados. En produccion debe apuntar al dominio publico, por ejemplo: `https://certificados.miorganizacion.com/verificar`

### 1.4 Frontend
```
VITE_API_URL=http://localhost:3000/api
VITE_APP_TITLE=Plataforma de Credenciales Digitales
```

## 2. Sistema de Branding Versionado

El branding (logo, colores, fuente, nombre de organizacion) se gestiona mediante versiones en la base de datos. Esto garantiza que los certificados historicos conserven el branding con el que fueron emitidos.

### 2.1 Como funciona

- La tabla `branding_versions` almacena cada version de marca.
- Solo una version puede estar activa a la vez (campo `is_active`).
- Al emitir un certificado, se guarda la referencia a la version de branding activa en ese momento (`branding_version_id` en la tabla `certificates`).
- Al cambiar de logo o colores, se crea una NUEVA version de branding. La anterior se desactiva pero no se elimina.
- Cuando se visualiza o descarga un certificado historico, se usa la version de branding con la que fue emitido, NO la activa actual.

### 2.2 Crear una version de branding

Para crear la version inicial o una nueva version:

1. Subir el logo via el endpoint POST /api/branding/versions/:id/logo o colocarlo manualmente en backend/src/storage/logos/ con nombre descriptivo (ej: logo_v1.png).
2. Crear la version en la base de datos via POST /api/branding/versions con los datos:
   - version_label: etiqueta descriptiva (ej: "2024-original", "2025-nuevo-logo")
   - logo_path: ruta relativa al logo (ej: "logos/logo_v1.png")
   - primary_color: color primario en hex (ej: "#1a237e")
   - secondary_color: color secundario en hex (ej: "#0d47a1")
   - font_family: familia tipografica (ej: "Roboto")
   - organization_name: nombre oficial (ej: "Direccion Nacional de Capacitacion")
3. Activar la version via PUT /api/branding/versions/:id/activate.

### 2.3 Cambiar de logo (sin afectar certificados anteriores)

1. Subir el nuevo logo al sistema.
2. Crear una nueva version de branding con el nuevo logo y los colores/fuente deseados.
3. Activar la nueva version.
4. Los certificados emitidos anteriormente seguiran mostrando el logo anterior porque estan vinculados a la version de branding con la que fueron emitidos.

### 2.4 Ejemplo practico

Escenario: En 2024 la organizacion usa logo_v1.png. En 2025 cambian a logo_v2.png.

- Enero 2024: Se crea branding version 1 con logo_v1.png. Se activa.
- Todo 2024: Se emiten 500 certificados. Todos tienen branding_version_id = 1.
- Enero 2025: Se crea branding version 2 con logo_v2.png. Se activa (version 1 se desactiva automaticamente).
- Todo 2025: Nuevos certificados tienen branding_version_id = 2.
- Si alguien verifica un certificado de 2024, el sistema carga la version 1 (logo_v1.png).
- Si alguien verifica un certificado de 2025, el sistema carga la version 2 (logo_v2.png).

## 3. Plantilla del Certificado PDF

La plantilla del certificado esta en `backend/src/templates/certificate.html`. Es un archivo HTML/CSS que Puppeteer renderiza a PDF.

### 3.1 Variables disponibles en la plantilla
Las siguientes variables se inyectan dinamicamente al generar el PDF:
- `{{participant_name}}` - Nombre completo del participante
- `{{document_id}}` - Cedula/identificacion del participante
- `{{course_name}}` - Nombre del curso/charla/taller
- `{{course_type}}` - Tipo (curso, charla, taller)
- `{{course_duration}}` - Duracion en horas
- `{{instructor}}` - Nombre del instructor
- `{{issue_date}}` - Fecha de emision
- `{{certificate_uuid}}` - UUID del certificado
- `{{qr_code_base64}}` - Imagen QR en base64
- `{{logo_base64}}` - Logo de la version de branding en base64
- `{{primary_color}}` - Color primario de la version de branding
- `{{secondary_color}}` - Color secundario
- `{{font_family}}` - Fuente de la version de branding
- `{{organization_name}}` - Nombre de la organizacion
- `{{verification_url}}` - URL completa de verificacion

### 3.2 Modificar la plantilla
- Editar el archivo backend/src/templates/certificate.html.
- Usar CSS inline o en un bloque style dentro del mismo archivo.
- Probar generando un certificado de prueba para verificar el resultado.
- La plantilla soporta cualquier estructura HTML/CSS compatible con Chromium.

## 4. Configuracion del Frontend (theme.js)

El archivo `frontend/src/config/theme.js` contiene la configuracion visual del panel de administracion (no del certificado PDF).

```javascript
// frontend/src/config/theme.js
export const theme = {
  colors: {
    primary: '#1a237e',
    secondary: '#0d47a1',
    success: '#2e7d32',
    danger: '#c62828',
    warning: '#f57f17',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#212121',
    textLight: '#757575',
  },
  fonts: {
    primary: "'Roboto', sans-serif",
    heading: "'Roboto', sans-serif",
  },
  appTitle: 'Plataforma de Credenciales Digitales',
};
```

Estos valores afectan unicamente la apariencia del panel de administracion, NO la de los certificados PDF. Los certificados usan la configuracion de branding_versions.

## 5. Configuracion inicial para nueva instalacion

Para instalar la plataforma en una nueva organizacion:

1. Clonar el repositorio.
2. Copiar .env.example a .env y configurar las variables.
3. Colocar el logo de la organizacion en backend/src/storage/logos/.
4. Editar frontend/src/config/theme.js con los colores y fuentes del panel admin.
5. (Opcional) Editar backend/src/templates/certificate.html si se quiere personalizar el diseno del certificado.
6. Ejecutar docker compose up --build.
7. El sistema se inicializa con el esquema de base de datos.
8. Acceder al sistema y crear la primera version de branding via la interfaz o directamente en la base de datos.
9. Crear el usuario administrador inicial (se puede hacer via seed en la base de datos o endpoint especial de primera ejecucion).

## 6. Respaldo y migracion

### 6.1 Que respaldar
- Volumen pgdata (base de datos completa)
- Volumen certificates_data (todos los PDFs)
- Volumen logos_data (todos los logos)
- Archivo .env

### 6.2 Restaurar en otro servidor
1. Instalar Docker y Docker Compose.
2. Clonar el repositorio.
3. Restaurar el archivo .env.
4. Restaurar los volumenes de datos.
5. Ejecutar docker compose up --build.
6. El sistema estara operativo con todos los datos y certificados intactos.
