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
FRONTEND_URL=http://localhost:5173
VERIFICATION_BASE_URL=http://localhost:5173/verificar
```
La variable VERIFICATION_BASE_URL es la que se usa para generar los QR de los certificados. En produccion debe apuntar al dominio publico, por ejemplo: `https://certificados.miorganizacion.com/verificar`

### 1.4 Frontend
```
# El frontend usa rutas relativas /api y /storage (proxy de Vite o nginx); no necesita la URL del backend.
VITE_APP_TITLE=Plataforma de Credenciales Digitales
```

## 2. Diseño del certificado (todo es por curso)

Desde 2026-10-22 (decision #11) **todo lo que aparece en el certificado se configura en cada curso**,
en la pestaña **Diseño** de su pagina (`/cursos/:id/diseno`). No hay branding global ni pagina de
Configuracion.

### 2.1 Que se configura en el curso

| Elemento | Variable de plantilla | Como se guarda |
|---|---|---|
| HTML/CSS del certificado | (el documento entero) | "Guardar diseño" |
| Orientacion y tamaño de pagina | - | "Guardar diseño" |
| Organizacion emisora | `{{organization_name}}` | "Guardar diseño" |
| Color principal y secundario | `{{primary_color}}`, `{{secondary_color}}` | "Guardar diseño" |
| Fuente | `{{font_family}}` | "Guardar diseño" |
| Logo | `{{institutional_logo_base64}}` | Al subirlo |
| Firma del instructor | `{{instructor_signature_html}}` | Al subirla |
| Logo, firma y firmante de cada colaboradora | `{{dependency_logos_html}}`, `{{dependency_signatures_html}}`, `{{dependency_names}}` | Al subirlos / al salir del campo |

- La vista previa en vivo muestra el borrador (sin guardar) con los datos reales del curso y un
  participante de ejemplo. "Ver como PDF" genera el PDF exacto.
- Sin logo, el certificado usa una imagen transparente (no sale el icono de imagen rota).
- Los certificados ya emitidos no cambian. Para aplicar un diseño nuevo a uno existente se reimprime desde
  la pestaña Certificados: conserva el mismo QR y la fecha de emision.

### 2.2 Plantillas base

- La pagina **Plantillas base** (admin) es un catalogo de puntos de partida.
- Al crear un curso se copia la plantilla marcada por defecto. En la pestaña Diseño se puede cargar otra
  ("Cargar"): reemplaza el HTML, la orientacion y el tamaño del curso, y conserva logo, colores y firmas.
- Editar o desactivar una plantilla base no modifica los cursos que ya la copiaron.

## 3. Dependencias

- Una dependencia define permisos (los usuarios con rol `dependencia` solo ven lo suyo) y agrupa cursos y
  participantes. En la pagina Dependencias solo se edita nombre y abreviatura.
- Un curso puede tener varias **colaboradoras** (las agrega el admin, porque les da acceso al curso).
  Su logo, firma y nombre del firmante se configuran en la pestaña Diseño de cada curso y solo aplican ahi.
- Si no se escribe firmante, se usa el nombre de la dependencia.

## 4. Plantillas base (HTML)

Cada plantilla es un documento HTML/CSS autocontenido con variables `{{variable}}` que el backend
sustituye y Puppeteer convierte a PDF.

### 4.1 Como funciona

- La tabla `certificate_templates` guarda las plantillas base; una se marca `is_default`.
- El curso guarda su propia copia en `courses.certificate_html` (junto con `orientation` y `page_size`).
- Al emitir o reimprimir se usa siempre el HTML del curso.

### 4.2 Plantillas incluidas por defecto

El seed crea 4 plantillas base (`backend/prisma/seed-data/templates/`): default, formal, modern y circuits.

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
- `{{institutional_logo_base64}}` - Logo del curso en base64 (imagen transparente si no tiene)
- `{{dependency_logos_html}}` - Bloque HTML con los logos de dependencias del curso y sus nombres debajo, cada dependencia como una columna (generado automaticamente, imgs en base64, en orden de display_order)

**Diseño del curso:**
- `{{primary_color}}` - Color principal del curso
- `{{secondary_color}}` - Color secundario
- `{{font_family}}` - Fuente del curso
- `{{organization_name}}` - Organizacion emisora del curso

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

### 4.5 Vista previa en tiempo real

Tanto el editor de Plantillas base como la pestaña Diseño del curso muestran la vista previa mientras se
escribe. El HTML lo renderiza el backend (POST /api/templates/render con datos de ejemplo, o
POST /api/courses/:id/certificate-preview con los datos del curso), asi que es exactamente lo que se emitira.
Se muestra en un iframe aislado, a escala, con las dimensiones reales de la pagina.

### 4.6 Consideraciones tecnicas de las plantillas

- Usar CSS inline o en un bloque `<style>` dentro del mismo HTML. No usar archivos CSS externos.
- Los logos se inyectan como base64, no como URLs. Usar `<img src="{{institutional_logo_base64}}">`.
- Para el bloque de logos de dependencias, usar `{{dependency_logos_html}}` que genera automaticamente columnas con logo + nombre para cada dependencia.
- El tamano del viewport de Puppeteer es fijo (ej: 1056x816 para carta horizontal), por lo que el diseno debe considerar esas dimensiones.
- La plantilla soporta cualquier estructura HTML/CSS compatible con Chromium.
- **No usar JavaScript** en las plantillas; solo HTML y CSS.

### 4.7 Ejemplo de estructura basica de plantilla

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
    {{dependency_logos_html}}
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

## 5. Apariencia del panel

Los colores, tipografia y radios del panel de administracion son variables CSS en `:root` de
`frontend/src/styles/global.css` (`--color-primary`, `--font-sans`, etc.). El titulo sale de
`VITE_APP_TITLE` (`frontend/src/config.ts`). Esto afecta solo al panel, NO a los certificados PDF: estos
usan el diseño de cada curso.

## 6. Configuracion inicial para nueva instalacion

Para instalar la plataforma en una nueva organizacion:

1. Clonar el repositorio.
2. Copiar .env.example a .env y configurar las variables.
3. (Opcional) Ajustar los colores del panel en frontend/src/styles/global.css.
4. Ejecutar npm run setup y npm run up.
5. El backend aplica migraciones y seed: plantillas base y la dependencia general.
6. Login con SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD de .env.
7. Desde el panel admin:
   a. Crear las dependencias de la organizacion.
   b. Crear usuarios y asignarlos a sus dependencias.
   c. (Opcional) Ajustar las plantillas base y elegir la de por defecto.
8. En cada curso, pestaña Diseño: logo, organizacion, colores, firmas y colaboradoras (quedan en storage/).

## 7. Respaldo y migracion

### 7.1 Que respaldar

Ejecutar `npm run backup` genera dos archivos que se incluyen en git:
- `database/backup.tar.gz` - base de datos completa
- `storage/backup.tar.gz` - todos los PDFs y logos

Adicionalmente respaldar:
- Archivo .env (no se commitea por seguridad)

### 7.2 Restaurar en otro servidor
1. Instalar Docker, Docker Compose y Node.js.
2. Clonar el repositorio.
3. Crear el archivo .env a partir de .env.example.
4. Ejecutar `npm run pull:sync` (restaura datos de los backups y levanta los contenedores).
5. El sistema estara operativo con todos los datos, certificados, logos y plantillas intactos.

### 7.3 Migrar datos entre maquinas
```bash
# Maquina origen
npm run backup
git add . && git commit -m "backup: actualizar datos" && git push

# Maquina destino
git pull
npm run pull:sync
```
