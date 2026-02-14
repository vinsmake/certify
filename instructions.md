# Instrucciones de Trabajo - Flujo de Desarrollo
IMPORTANTE: NO EJECUTAR NI INSTALAR NADA FUERA DE DOCKER, ABSOLUTAMENTE NADA.
NOTA: En la raiz hay un temporalCredentials.md donde se encuentran las credenciales necesarias para el testing. Si algun dato cambia o es erroneo, actualizalo.
NOTA: No utilizar Emojis
Este documento define el proceso a seguir cada vez que se trabaja en una nueva tarea del proyecto. Debe seguirse en orden estricto.

## Flujo por cada tarea (item del todo.md)

### Paso 1: Seleccionar la tarea
- Abrir todo.md e identificar la siguiente tarea pendiente en orden.
- No saltarse tareas a menos que haya una dependencia bloqueante documentada.
- Se realizará una tarea a la ves, no se hara mas de una tarea por consulta.
- Cada tarea debera ser validada por el usuario.

### Paso 2: Entender el contexto
- Leer arquitectura.md para entender donde encaja la tarea dentro del sistema.
- Leer config.md si la tarea involucra elementos configurables (logos, colores, fuentes, plantillas, dependencias).
- Revisar el codigo existente relacionado para no duplicar funcionalidad.

### Paso 3: Implementar la tarea
- Seguir la estructura de carpetas definida en arquitectura.md.
- Seguir los patrones ya establecidos en el codigo existente.
- Si la tarea es de backend: crear/modificar ruta, controlador, modelo y servicio segun aplique.
- Si la tarea es de frontend: crear/modificar componente, pagina, servicio y estilos segun aplique.
- Si la tarea es de base de datos: crear migracion SQL en database/migrations/.
- Si la tarea requiere variables de entorno: agregarlas a .env y documentarlas en .env.example.

### Paso 4: Verificar funcionamiento
- Asegurarse de que docker compose up levanta sin errores.
- Probar manualmente la funcionalidad implementada.
- Verificar que no se rompio funcionalidad existente.
- Es importante siempre asegurarse de que todos los puntos realizados funcionen como deberian y devuelvan los resultados que deberian.

### Paso 5: Actualizar documentacion
- Actualizar readme.md con la documentacion del modulo/funcionalidad implementada.
  - Si es un endpoint nuevo: documentar en la seccion de API del readme.
  - Si es un componente nuevo: documentar en la seccion de frontend del readme.
  - Si es una tabla/migracion nueva: documentar en la seccion de base de datos del readme.
  - Si es configuracion nueva: documentar en config.md y en la seccion correspondiente del readme.
- La documentacion en el readme debe incluir: que hace, como funciona, y como se usa.

### Paso 6: Marcar como completado (esto se hara una ves YO, el usuario, te confirme que funciona.)
- En todo.md, cambiar el estado de la tarea de `[ ]` a `[x]`.
- Dar una recomendación de commit (utilizando convenciones).

## Reglas generales

### Sobre la base de datos
- Nunca modificar directamente el esquema en 01_schema.sql despues de la primera ejecucion.
- Usar archivos de migracion numerados: 02_add_column.sql, 03_create_table.sql, etc.
- Cada migracion debe ser idempotente cuando sea posible (usar IF NOT EXISTS).

### Sobre el branding institucional
- Al emitir un certificado, siempre guardar la referencia a la version de branding activa en ese momento.
- Nunca eliminar versiones de branding anteriores, solo desactivarlas.
- Los logos institucionales de versiones anteriores deben permanecer en el sistema de archivos.

### Sobre las dependencias
- Cada dependencia tiene su propio logo, almacenado en storage/logos/dependencies/.
- Al crear un curso, se asigna automaticamente la dependencia del usuario emisor.
- Se pueden agregar dependencias colaboradoras a un curso via la tabla course_dependencies.
- Al emitir un certificado, se recopilan los logos de TODAS las dependencias asociadas al curso.
- Nunca eliminar logos de dependencias; desactivar la dependencia si ya no se usa.
- Los logos de dependencia se muestran en el certificado en el orden definido por display_order.

### Sobre las plantillas de certificado
- Las plantillas se almacenan en la tabla certificate_templates con su html_content completo.
- Los archivos en backend/src/templates/ (default.html, formal.html, modern.html) son los originales que se insertan como seed en la BD.
- Al emitir un certificado, se guarda la referencia a la plantilla usada (template_id).
- Las plantillas usan variables con formato {{variable}} que se reemplazan al generar el PDF.
- Nunca eliminar una plantilla que haya sido usada para emitir certificados; solo desactivarla.
- Siempre debe existir al menos una plantilla marcada como is_default.
- Las plantillas deben usar solo HTML y CSS; no incluir JavaScript.
- Los logos se inyectan como base64 dentro de la plantilla, no como URLs externas.

### Sobre los certificados
- Los certificados emitidos son inmutables. Nunca modificar un certificado ya emitido.
- Para invalidar un certificado, usar el flujo de revocacion (cambiar status + registrar en revocation_log).
- Los PDFs generados nunca se eliminan, incluso si el certificado es revocado.
- Cada certificado registra: branding_version_id (branding al momento de emision), template_id (plantilla usada), course_id (incluye las dependencias del curso).

### Sobre los roles y acceso
- Solo existen dos roles: **admin** y **emisor**.
- **admin:** Acceso global sin restriccion de dependencia. Puede gestionar dependencias, plantillas, usuarios, branding, y ver/gestionar todos los cursos y certificados del sistema.
- **emisor:** Vinculado a una dependencia. Solo ve y gestiona cursos y certificados de su dependencia. No accede a configuracion global, plantillas, branding ni gestion de usuarios.
- El middleware dependencyMiddleware filtra automaticamente los datos segun el rol: admin ve todo, emisor ve solo su dependencia.
- Al crear un usuario emisor, dependency_id es requerido. Para admin, es nullable.

### Sobre variables de entorno
- Toda configuracion sensible va en .env (credenciales, secretos JWT, etc.).
- .env nunca se commitea al repositorio.
- .env.example se mantiene actualizado con todas las variables necesarias (sin valores reales).

### Sobre Docker
- No reconstruir imagenes a menos que se modifique package.json o Dockerfile.
- Para desarrollo usar: docker compose up
- Para reconstruir: docker compose up --build
- Los datos de PostgreSQL persisten entre reinicios gracias al volumen pgdata.

## Orden de prioridad en caso de conflicto

1. Seguridad (nunca comprometer datos o accesos).
2. Integridad de datos (nunca perder certificados o registros).
3. Aislamiento por dependencia (emisor nunca debe ver datos de otra dependencia).
4. Funcionalidad correcta.
5. Documentacion actualizada.
6. Limpieza de codigo.
