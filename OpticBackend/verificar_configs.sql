-- ============================================
-- VERIFICAR CONFIGURACIONES EN AMBOS SCHEMAS
-- ============================================

-- Verificar que existan configuraciones en public
SELECT 'public' as schema, 
       nombre_optica, 
       color_primario, 
       color_secundario,
       CASE 
           WHEN color_primario IS NULL THEN '❌ FALTA color_primario'
           ELSE '✅ OK'
       END as estado
FROM public.configuracion_sistema;

-- Verificar que existan configuraciones en public_test
SELECT 'public_test' as schema, 
       nombre_optica, 
       color_primario, 
       color_secundario,
       CASE 
           WHEN color_primario IS NULL THEN '❌ FALTA color_primario'
           ELSE '✅ OK'
       END as estado
FROM public_test.configuracion_sistema;

-- Comparar colores (deben ser diferentes)
SELECT 
    CASE 
        WHEN (SELECT color_primario FROM public.configuracion_sistema LIMIT 1) = 
             (SELECT color_primario FROM public_test.configuracion_sistema LIMIT 1)
        THEN '⚠️ PROBLEMA: Los colores son iguales en ambos schemas'
        ELSE '✅ OK: Los colores son diferentes'
    END as comparacion_colores;
