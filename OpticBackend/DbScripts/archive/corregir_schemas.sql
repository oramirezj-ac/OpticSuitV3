-- ============================================
-- CORRECCIÓN: Usar sandbox en lugar de optica_test
-- ============================================

-- 1. ELIMINAR schema optica_test (creado por error)
DROP SCHEMA IF EXISTS optica_test CASCADE;

-- 2. ACTUALIZAR usuario test para usar sandbox
UPDATE public."AspNetUsers" 
SET "NombreEsquema" = 'sandbox'
WHERE "Email" = 'test@opticsuit.com';

-- 3. VERIFICAR resultado
SELECT "Email", "NombreEsquema" 
FROM public."AspNetUsers" 
WHERE "Email" IN ('admin@opticsuit.com', 'test@opticsuit.com');
