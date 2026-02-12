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

## 2. Sistema de Branding Versionado (Institucional)

El branding institucional (logo, colores, fuente, nombre de organizacion) se gestiona mediante versiones en la base de datos. Esto garantiza que los certificados historicos conserven el branding con el que fueron emitidos.

**Importante:** El branding institucional es independiente de los logos de dependencias. El branding define la identidad visual global (colores, fuente, logo institucional), mientras que cada dependencia tiene su propio logo que se muestra adicionalmente en los certificados.

### 2.1 Como funciona

- La tabla `branding_versions` almacena cada version de marca institucional.
- Solo una version puede estar activa a la vez (campo `is_active`).
- Al emitir un certificado, se guarda la referencia a la version de branding activa en ese momento (`branding_version_id` en la tabla `certificates`).
- Al cambiar de logo o colores institucionales, se crea una NUEVA version de branding. La anterior se desactiva pero no se elimina.
- Cuando se visualiza o descarga un certificado historico, se usa la version de branding con la que fue emitido, NO la activa actual.

### 2.2 Crear una version de branding

Para crear la version inicial o una nueva version:

1. Subir el logo institucional via el endpoint POST /api/branding/versions/:id/logo o colocarlo manualmente en backend/src/storage/logos/branding/ con nombre descriptivo (ej: logo_institucional_v1.png).
2. Crear la version en la base de datos via POST /api/branding/versions con los datos:
   - version_label: etiqueta descriptiva (ej: "2024-original", "2025-nuevo-logo")
   - logo_path: ruta relativa al logo institucional (ej: "logos/branding/logo_institucional_v1.png")
   - primary_color: color primario en hex (ej: "#1a237e")
   - secondary_color: color secundario en hex (ej: "#0d47a1")
   - font_family: familia tipografica (ej: "Roboto")
   - organization_name: nombre oficial de la organizacion (ej: "Ministerio de Educacion")
3. Activar la version via PUT /api/branding/versions/:id/activate.

### 2.3 Cambiar de logo institucional (sin afectar certificados anteriores)

1. Subir el nuevo logo institucional al sistema.
2. Crear una nueva version de branding con el nuevo logo y los colores/fuente deseados.
3. Activar la nueva version.
4. Los certificados emitidos anteriormente seguiran mostrando el logo anterior porque estan vinculados a la version de branding con la que fueron emitidos.

## 3. Sistema de Dependencias (Unidades Organizacionales)

Las dependencias representan las unidades organizacionales que pueden emitir certificados (ej: "Direccion de Capacitacion", "Direccion de Tecnologia").

### 3.1 Configuracion de una dependencia

Cada dependencia tiene:
- **name:** Nombre completo (ej: "Direccion Nacional de Capacitacion")
- **abbreviation:** Abreviatura (ej: "DNC")
- **logo_path:** Ruta al logo de la dependencia (almacenado en storage/logos/dependencies/)

### 3.2 Logos de dependencia en certificados

- Cada dependencia tiene su propio logo, independiente del logo institucional.
- Al emitir un certificado, se incluyen: el logo institucional (del branding activo) + los logos de todas las dependencias asociadas al curso.
- Si un curso es colaborativo entre dos dependencias, ambos logos aparecen en el certificado.
- Los logos de dependencia se muestran en el orden definido por `display_order` en la tabla `course_dependencies`.

### 3.3 Cursos con multiples dependencias

Un curso puede tener una o mas dependencias asociadas:
- La **dependencia principal** se asigna automaticamente al crear el curso (la del usuario emisor que lo crea).
- Se pueden agregar **dependencias colaboradoras** via POST /api/courses/:id/dependencies.
- Cada dependencia asociada tiene un `display_order` que determina el orden de aparicion de los logos en el certificado.
- Ejemplo: Un taller creado por la "Direccion de Capacitacion" con colaboracion de la "Direccion de Tecnologia" mostrara ambos logos.

### 3.4 Asignacion de usuarios a dependencias

- Los usuarios con rol **admin** no necesitan estar vinculados a una dependencia (dependency_id puede ser null). Tienen acceso global.
- Los usuarios con rol **emisor** deben estar vinculados a una dependencia (dependency_id requerido). Solo pueden gestionar cursos y certificados de su dependencia.

## 4. Sistema de Plantillas de Certificado

Las plantillas permiten crear multiples modelos/disenos de certificado sin modificar codigo. Cada plantilla es un documento HTML/CSS autocontenido que se renderiza a PDF con Puppeteer.

### 4.1 Como funciona

- La tabla `certificate_templates` almacena las plantillas.
- Cada plantilla tiene un `html_content` que es el HTML/CSS completo del certificado.
- Una plantilla puede marcarse como `is_default` para usarse cuando no se selecciona una especificamente.
- Al emitir certificados, el usuario selecciona la plantilla a usar.
- El certificado emitido guarda referencia a la plantilla usada (`template_id`).

### 4.2 Plantillas incluidas por defecto

El sistema incluye 3 plantillas base:

1. **default** - Plantilla estandar: horizontal, tamano carta, diseno limpio con zonas bien definidas.
2. **formal** - Plantilla formal: bordes decorativos, tipografia serif, estilo clasico.
3. **modern** - Plantilla moderna: minimalista, colores planos, tipografia sans-serif.

### 4.3 Variables disponibles en las plantillas

Las siguientes variables se inyectan dinamicamente al generar el PDF:

**Datos del participante:**
- `{{participant_name}}` - Nombre completo del participante
- `{{document_id}}` - Cedula/identificacion del participante

**Datos del curso:**
- `{{course_name}}` - Nombre del curso/charla/taller
- `{{course_type}}` - Tipo (curso, charla, taller)
- `{{course_duration}}` - Duracion en horas
- `{{instructor}}` - Nombre del instructor

**Datos del certificado:**
- `{{issue_date}}` - Fecha de emision
- `{{certificate_uuid}}` - UUID del certificado
- `{{verification_url}}` - URL completa de verificacion

**Logos e identidad visual:**
- `{{institutional_logo_base64}}` - Logo institucional (del branding activo) en base64
- `{{dependency_logos_html}}` - Bloque HTML con todos los logos de dependencias del curso (imgs en base64, en orden de display_order)
- `{{dependency_names}}` - Nombres de todas las dependencias del curso, separados por coma

**Branding institucional:**
- `{{primary_color}}` - Color primario de la version de branding
- `{{secondary_color}}` - Color secundario
- `{{font_family}}` - Fuente de la version de branding
- `{{organization_name}}` - Nombre de la organizacion

**QR:**
- `{{qr_code_base64}}` - Imagen QR en base64

### 4.4 Crear una nueva plantilla

1. Escribir el HTML/CSS de la plantilla usando las variables `{{variable}}` donde corresponda.
2. Via la interfaz admin o API: POST /api/templates con los datos:
   - name: nombre descriptivo
   - slug: identificador unico (ej: "diploma-formal-2025")
   - description: descripcion del diseno
   - html_content: el HTML/CSS completo
   - orientation: "landscape" o "portrait"
   - page_size: "letter" o "A4"
3. Usar POST /api/templates/:id/preview para generar un PDF de prueba con datos ficticios.
4. (Opcional) Establecer como plantilla por defecto con PUT /api/templates/:id/default.

### 4.5 Consideraciones tecnicas de las plantillas

- Usar CSS inline o en un bloque `<style>` dentro del mismo HTML. No usar archivos CSS externos.
- Los logos se inyectan como base64, no como URLs. Usar `<img src="{{institutional_logo_base64}}">`.
- Para el bloque de logos de dependencias, usar `{{dependency_logos_html}}` que genera automaticamente las etiquetas `<img>` con los logos.
- El tamano del viewport de Puppeteer es fijo (ej: 1056x816 para carta horizontal), por lo que el diseno debe considerar esas dimensiones.
- La plantilla soporta cualquier estructura HTML/CSS compatible con Chromium.
- **No usar JavaScript** en las plantillas; solo HTML y CSS.

### 4.6 Ejemplo de estructura basica de plantilla

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1056px; height: 816px;
      font-family: {{font_family}}, sans-serif;
      background: white;
    }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 40px; }
    .logos { display: flex; gap: 20px; align-items: center; }
    .logos img { max-height: 80px; }
    .content { text-align: center; padding: 40px; }
    .participant-name { font-size: 36px; color: {{primary_color}}; margin: 20px 0; }
    .course-info { font-size: 18px; color: #333; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; padding: 40px; }
    .qr img { width: 120px; height: 120px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logos">
      <img src="{{institutional_logo_base64}}" alt="Logo institucional">
      {{dependency_logos_html}}
    </div>
    <div class="org-name">{{organization_name}}</div>
  </div>
  <div class="content">
    <h1>Certificado de {{course_type}}</h1>
    <p>Se certifica que</p>
    <p class="participant-name">{{participant_name}}</p>
    <p>C.I. {{document_id}}</p>
    <p class="course-info">
      Ha completado el {{course_type}}: <strong>{{course_name}}</strong><br>
      Duracion: {{course_duration}} horas | Instructor: {{instructor}}
    </p>
    <p>{{dependency_names}}</p>
  </div>
  <div class="footer">
    <div>Fecha de emision: {{issue_date}}</div>
    <div class="qr">
      <img src="{{qr_code_base64}}" alt="QR de verificacion">
      <p>Verificar en: {{verification_url}}</p>
    </div>
  </div>
</body>
</html>
```

## 5. Configuracion del Frontend (theme.js)

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

Estos valores afectan unicamente la apariencia del panel de administracion, NO la de los certificados PDF. Los certificados usan la configuracion de branding_versions para colores/fuente y las plantillas para el diseno.

## 6. Configuracion inicial para nueva instalacion

Para instalar la plataforma en una nueva organizacion:

1. Clonar el repositorio.
2. Copiar .env.example a .env y configurar las variables.
3. Colocar el logo institucional en backend/src/storage/logos/branding/.
4. Colocar los logos de las dependencias en backend/src/storage/logos/dependencies/.
5. Editar frontend/src/config/theme.js con los colores y fuentes del panel admin.
6. Ejecutar docker compose up --build.
7. El sistema se inicializa con el esquema de base de datos, la plantilla de certificado por defecto y la dependencia general.
8. Login con admin@admin.com y la contrasena definida en el seed.
9. Desde el panel admin:
   a. Crear las dependencias de la organizacion y subir sus logos.
   b. Crear la primera version de branding institucional (logo, colores, fuente, nombre).
   c. Crear usuarios emisores y asignarlos a sus dependencias.
   d. (Opcional) Personalizar o crear nuevas plantillas de certificado.

## 7. Respaldo y migracion

### 7.1 Que respaldar
- Volumen pgdata (base de datos completa)
- Volumen certificates_data (todos los PDFs)
- Volumen logos_data (todos los logos: institucionales y de dependencias)
- Archivo .env

### 7.2 Restaurar en otro servidor
1. Instalar Docker y Docker Compose.
2. Clonar el repositorio.
3. Restaurar el archivo .env.
4. Restaurar los volumenes de datos.
5. Ejecutar docker compose up --build.
6. El sistema estara operativo con todos los datos, certificados, logos y plantillas intactos.
