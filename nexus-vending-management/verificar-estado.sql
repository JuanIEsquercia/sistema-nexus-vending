-- ============================================
-- VERIFICACIÓN DE ESTADO - NEXUS VENDING
-- ============================================

-- 1. Ver todas las tablas públicas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Ver funciones creadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name LIKE '%stock%';

-- 3. Ver triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- 4. Contar registros en cada tabla (si existen)
DO $$
DECLARE
    rec RECORD;
    query TEXT;
    result INTEGER;
BEGIN
    FOR rec IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('productos', 'proveedores', 'compras', 'detallecompra', 'stock', 'cargaproductosmaquina')
    LOOP
        query := 'SELECT COUNT(*) FROM ' || rec.table_name;
        EXECUTE query INTO result;
        RAISE NOTICE 'Tabla %: % registros', rec.table_name, result;
    END LOOP;
END $$;

-- 5. Verificar datos específicos
SELECT 'PRODUCTOS:' as seccion;
SELECT id, nombre, multiplicador_precio FROM productos LIMIT 3;

SELECT 'PROVEEDORES:' as seccion;
SELECT id, nombre, telefono FROM proveedores LIMIT 3;

-- ============================================
-- RESULTADO ESPERADO:
-- - 6 tablas listadas
-- - 4 funciones de stock
-- - 4 triggers listados
-- - 10 productos, 5 proveedores
-- ============================================ 