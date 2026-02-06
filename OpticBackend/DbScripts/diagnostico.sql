-- ============================================
-- SCRIPT DE DIAGNÓSTICO MULTI-TENANT
-- ============================================
-- Este script verifica el estado actual de la base de datos
-- y muestra qué existe y qué falta

-- ============================================
-- 1. VERIFICAR USUARIOS
-- ============================================
SELECT 
    '=== USUARIOS REGISTRADOS ===' as seccion,
    "Email" as email,
    "NombreCompleto" as nombre,
    "NombreEsquema" as schema_asignado,
    "EmailConfirmed" as email_confirmado
FROM public."AspNetUsers"
ORDER BY "Email";

-- ============================================
-- 2. VERIFICAR SCHEMAS EXISTENTES
-- ============================================
SELECT 
    '=== SCHEMAS EN LA BASE DE DATOS ===' as seccion,
    schema_name
FROM information_schema.schemata
WHERE schema_name IN ('public', 'optica_test')
ORDER BY schema_name;

-- ============================================
-- 3. VERIFICAR TABLA configuracion_sistema en public
-- ============================================
SELECT 
    '=== CONFIGURACIÓN EN SCHEMA PUBLIC ===' as seccion,
    EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'configuracion_sistema'
    ) as tabla_existe;

-- Si existe, mostrar datos
SELECT 
    nombre_optica,
    color_primario,
    color_secundario,
    eslogan
FROM public.configuracion_sistema
WHERE EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'configuracion_sistema'
);

-- ============================================
-- 4. VERIFICAR TABLA configuracion_sistema en optica_test
-- ============================================
SELECT 
    '=== CONFIGURACIÓN EN SCHEMA OPTICA_TEST ===' as seccion,
    EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'optica_test' 
        AND table_name = 'configuracion_sistema'
    ) as tabla_existe;

-- Si existe, mostrar datos
SELECT 
    nombre_optica,
    color_primario,
    color_secundario,
    eslogan
FROM optica_test.configuracion_sistema
WHERE EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'optica_test' 
    AND table_name = 'configuracion_sistema'
);

-- ============================================
-- 5. RESUMEN DE PROBLEMAS POTENCIALES
-- ============================================
SELECT 
    '=== DIAGNÓSTICO ===' as seccion,
    CASE 
        WHEN (SELECT COUNT(*) FROM public."AspNetUsers" WHERE "Email" = 'test@opticsuit.com') = 0 
        THEN '❌ FALTA: Usuario test@opticsuit.com'
        WHEN (SELECT COUNT(*) FROM public."AspNetUsers" WHERE "Email" = 'test@opticsuit.com') > 1
        THEN '⚠️ DUPLICADO: Múltiples usuarios test@opticsuit.com'
        ELSE '✅ OK: Usuario test@opticsuit.com existe'
    END as estado_usuario_test,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM public."AspNetUsers" WHERE "Email" = 'admin@opticsuit.com') = 0 
        THEN '❌ FALTA: Usuario admin@opticsuit.com'
        WHEN (SELECT COUNT(*) FROM public."AspNetUsers" WHERE "Email" = 'admin@opticsuit.com') > 1
        THEN '⚠️ DUPLICADO: Múltiples usuarios admin@opticsuit.com'
        ELSE '✅ OK: Usuario admin@opticsuit.com existe'
    END as estado_usuario_admin,
    
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'optica_test')
        THEN '❌ FALTA: Schema optica_test'
        ELSE '✅ OK: Schema optica_test existe'
    END as estado_schema,
    
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'configuracion_sistema')
        THEN '❌ FALTA: Tabla configuracion_sistema en public'
        WHEN (SELECT COUNT(*) FROM public.configuracion_sistema) = 0
        THEN '⚠️ VACÍA: Tabla configuracion_sistema en public sin datos'
        ELSE '✅ OK: Configuración en public'
    END as estado_config_public,
    
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'optica_test' AND table_name = 'configuracion_sistema')
        THEN '❌ FALTA: Tabla configuracion_sistema en optica_test'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'optica_test' AND table_name = 'configuracion_sistema')
             AND (SELECT COUNT(*) FROM optica_test.configuracion_sistema) = 0
        THEN '⚠️ VACÍA: Tabla configuracion_sistema en optica_test sin datos'
        ELSE '✅ OK: Configuración en optica_test'
    END as estado_config_test;
