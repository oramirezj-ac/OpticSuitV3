-- ============================================
-- SCRIPT DE CORRECCIÓN DEFINITIVA DE SCHEMAS
-- ============================================

-- 1. Crear el schema correcto 'public_test' (si no existe)
CREATE SCHEMA IF NOT EXISTS public_test;

-- 2. Asegurar que la tabla de configuración existe en 'public_test'
CREATE TABLE IF NOT EXISTS public_test.configuracion_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_optica VARCHAR(255) NOT NULL DEFAULT 'Óptica Galileo',
    eslogan TEXT,
    logo_url TEXT,
    color_primario VARCHAR(7) NOT NULL DEFAULT '#007bff',
    color_secundario VARCHAR(7) NOT NULL DEFAULT '#6c757d',
    color_acento VARCHAR(7) NOT NULL DEFAULT '#28a745',
    color_texto_base VARCHAR(7) NOT NULL DEFAULT '#212529',
    direccion TEXT,
    telefono VARCHAR(50),
    email_contacto VARCHAR(255),
    ultima_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Insertar la configuración NARANJA para el usuario de prueba
-- Usamos ON CONFLICT para no duplicar si ya existe
INSERT INTO public_test.configuracion_sistema 
    (nombre_optica, eslogan, color_primario, color_secundario, color_acento, color_texto_base)
VALUES 
    ('Óptica Public Test', 'Visión de Prueba Correcta', '#ff6600', '#ff9944', '#ffaa00', '#333333')
ON CONFLICT (id) DO NOTHING;

-- 4. Actualizar al usuario 'test@opticsuit.com' para que apunte DEFINITIVAMENTE a 'public_test'
UPDATE public."AspNetUsers" 
SET "NombreEsquema" = 'public_test'
WHERE "Email" = 'test@opticsuit.com';

-- 5. Verificar que el usuario tenga el esquema correcto
SELECT "Email", "NombreEsquema" FROM public."AspNetUsers" WHERE "Email" = 'test@opticsuit.com';
