-- Migration: Agregar columna signature_path a courses
-- Para bases de datos existentes que ya tienen la tabla courses

ALTER TABLE courses ADD COLUMN IF NOT EXISTS signature_path VARCHAR(500);
