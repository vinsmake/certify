# Instrucciones de Trabajo - Flujo de Desarrollo

Este documento define el proceso a seguir cada vez que se trabaja en una nueva tarea del proyecto. Debe seguirse en orden estricto.

## Flujo por cada tarea (item del todo.md)

### Paso 1: Seleccionar la tarea
- Abrir todo.md e identificar la siguiente tarea pendiente en orden.
- No saltarse tareas a menos que haya una dependencia bloqueante documentada.

### Paso 2: Entender el contexto
- Leer arquitectura.md para entender donde encaja la tarea dentro del sistema.
- Leer config.md si la tarea involucra elementos configurables (logos, colores, fuentes).
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

### Paso 5: Actualizar documentacion
- Actualizar readme.md con la documentacion del modulo/funcionalidad implementada.
  - Si es un endpoint nuevo: documentar en la seccion de API del readme.
  - Si es un componente nuevo: documentar en la seccion de frontend del readme.
  - Si es una tabla/migracion nueva: documentar en la seccion de base de datos del readme.
  - Si es configuracion nueva: documentar en config.md y en la seccion correspondiente del readme.
- La documentacion en el readme debe incluir: que hace, como funciona, y como se usa.

### Paso 6: Marcar como completado
- En todo.md, cambiar el estado de la tarea de `[ ]` a `[x]`.
- Hacer commit con mensaje descriptivo que indique que tarea se completo.

### Paso 7: Commit
- El mensaje de commit debe ser claro y descriptivo.
- Formato sugerido: `tipo(modulo): descripcion breve`
- Tipos: feat, fix, docs, style, refactor, config, db
- Ejemplos:
  - `feat(backend): agregar endpoint POST /api/courses`
  - `feat(frontend): crear componente CourseList`
  - `db(schema): crear tabla certificates`
  - `config(docker): configurar volumen persistente para PDFs`
  - `docs(readme): documentar modulo de cursos`

## Reglas generales

### Sobre la base de datos
- Nunca modificar directamente el esquema en 01_schema.sql despues de la primera ejecucion.
- Usar archivos de migracion numerados: 02_add_column.sql, 03_create_table.sql, etc.
- Cada migracion debe ser idempotente cuando sea posible (usar IF NOT EXISTS).

### Sobre el branding
- Al emitir un certificado, siempre guardar la referencia a la version de branding activa en ese momento.
- Nunca eliminar versiones de branding anteriores, solo desactivarlas.
- Los logos de versiones anteriores deben permanecer en el sistema de archivos.

### Sobre los certificados
- Los certificados emitidos son inmutables. Nunca modificar un certificado ya emitido.
- Para invalidar un certificado, usar el flujo de revocacion (cambiar status + registrar en revocation_log).
- Los PDFs generados nunca se eliminan, incluso si el certificado es revocado.

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
3. Funcionalidad correcta.
4. Documentacion actualizada.
5. Limpieza de codigo.
