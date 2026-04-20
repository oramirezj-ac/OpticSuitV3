-- Script para configurar schemas de prueba multi-tenant
-- Ejecutar este script en PostgreSQL para crear los schemas y configuraciones de prueba

-- ============================================
-- 1. CREAR SCHEMA optica_test (si no existe)
-- ============================================
CREATE SCHEMA IF NOT EXISTS optica_test;

-- ============================================
-- 2. CREAR TABLA configuracion_sistema en optica_test
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
-- 3. INSERTAR CONFIGURACIÓN NARANJA para optica_test
-- ============================================
INSERT INTO optica_test.configuracion_sistema 
    (nombre_optica, eslogan, color_primario, color_secundario, color_acento, color_texto_base)
VALUES 
    ('Óptica Test', 'Visión de Prueba', '#ff6600', '#ff9944', '#ffaa00', '#333333')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. VERIFICAR/CREAR TABLA en schema public
-- ============================================
CREATE TABLE IF NOT EXISTS public.configuracion_sistema (
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
-- 5. INSERTAR CONFIGURACIÓN AZUL para public (admin)
-- ============================================
INSERT INTO public.configuracion_sistema 
    (nombre_optica, eslogan, color_primario, color_secundario, color_acento, color_texto_base)
VALUES 
    ('Óptica Admin', 'Administración Central', '#0066cc', '#4499dd', '#0088ff', '#222222')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. VERIFICAR CONFIGURACIONES
-- ============================================
SELECT 'public' as schema, nombre_optica, color_primario FROM public.configuracion_sistema
UNION ALL
SELECT 'optica_test' as schema, nombre_optica, color_primario FROM optica_test.configuracion_sistema;

-- ============================================
-- NOTAS:
-- ============================================
-- - admin@opticsuit.com usa schema 'public' -> Colores AZULES (#0066cc)
-- - test@opticsuit.com usa schema 'optica_test' -> Colores NARANJAS (#ff6600)
-- - Ambos usuarios tienen contraseña: Password123!
