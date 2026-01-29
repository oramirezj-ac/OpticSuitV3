-- ============================================
-- SCRIPT DE LIMPIEZA Y CONFIGURACIÓN
-- ============================================
-- Ejecutar DESPUÉS de revisar el diagnóstico
-- Este script limpia duplicados y configura correctamente

-- ============================================
-- 1. LIMPIAR USUARIOS DUPLICADOS (si existen)
-- ============================================

-- Eliminar usuario test duplicado (mantener solo el más reciente)
DELETE FROM public."AspNetUsers" 
WHERE "Email" = 'test@opticsuit.com'
AND "Id" NOT IN (
    SELECT "Id" 
    FROM public."AspNetUsers" 
    WHERE "Email" = 'test@opticsuit.com'
    ORDER BY "FechaRegistro" DESC 
    LIMIT 1
);

-- Eliminar usuario admin duplicado (mantener solo el más reciente)
DELETE FROM public."AspNetUsers" 
WHERE "Email" = 'admin@opticsuit.com'
AND "Id" NOT IN (
    SELECT "Id" 
    FROM public."AspNetUsers" 
    WHERE "Email" = 'admin@opticsuit.com'
    ORDER BY "FechaRegistro" DESC 
    LIMIT 1
);

-- ============================================
-- 2. ACTUALIZAR SCHEMAS DE USUARIOS EXISTENTES
-- ============================================

-- Asegurar que admin tenga schema 'public'
UPDATE public."AspNetUsers" 
SET "NombreEsquema" = 'public'
WHERE "Email" = 'admin@opticsuit.com';

-- Asegurar que test tenga schema 'optica_test'
UPDATE public."AspNetUsers" 
SET "NombreEsquema" = 'optica_test'
WHERE "Email" = 'test@opticsuit.com';

-- ============================================
-- 3. CREAR SCHEMA optica_test (si no existe)
-- ============================================
CREATE SCHEMA IF NOT EXISTS optica_test;

-- ============================================
-- 4. CREAR TABLA configuracion_sistema en optica_test
-- ============================================
CREATE TABLE IF NOT EXISTS optica_test.configuracion_sistema (
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

-- ============================================
-- 5. LIMPIAR CONFIGURACIONES EXISTENTES
-- ============================================
DELETE FROM optica_test.configuracion_sistema;
DELETE FROM public.configuracion_sistema WHERE nombre_optica IN ('Óptica Test', 'Óptica Admin');

-- ============================================
-- 6. INSERTAR CONFIGURACIÓN NARANJA para optica_test
-- ============================================
INSERT INTO optica_test.configuracion_sistema 
    (nombre_optica, eslogan, color_primario, color_secundario, color_acento, color_texto_base)
VALUES 
    ('Óptica Test', 'Visión de Prueba', '#ff6600', '#ff9944', '#ffaa00', '#333333');

-- ============================================
-- 7. INSERTAR CONFIGURACIÓN AZUL para public
-- ============================================
INSERT INTO public.configuracion_sistema 
    (nombre_optica, eslogan, color_primario, color_secundario, color_acento, color_texto_base)
VALUES 
    ('Óptica Admin', 'Administración Central', '#0066cc', '#4499dd', '#0088ff', '#222222');

-- ============================================
-- 8. VERIFICAR RESULTADO
-- ============================================
SELECT 'public' as schema, nombre_optica, color_primario, color_secundario FROM public.configuracion_sistema
UNION ALL
SELECT 'optica_test' as schema, nombre_optica, color_primario, color_secundario FROM optica_test.configuracion_sistema;

SELECT "Email", "NombreEsquema" FROM public."AspNetUsers" WHERE "Email" IN ('admin@opticsuit.com', 'test@opticsuit.com');
