-- ============================================
-- SOLUCIÓN: FOREIGN KEY CONSTRAINT PRODUCTOS
-- ============================================

-- 1. ELIMINAR CONSTRAINT EXISTENTE
ALTER TABLE stock DROP CONSTRAINT IF EXISTS stock_producto_id_fkey;

-- 2. AGREGAR CONSTRAINT CON CASCADE
ALTER TABLE stock 
ADD CONSTRAINT stock_producto_id_fkey 
FOREIGN KEY (producto_id) 
REFERENCES productos(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 3. HACER LO MISMO PARA OTRAS TABLAS RELACIONADAS

-- Detalle de compras
ALTER TABLE detallecompra DROP CONSTRAINT IF EXISTS detallecompra_producto_id_fkey;
ALTER TABLE detallecompra 
ADD CONSTRAINT detallecompra_producto_id_fkey 
FOREIGN KEY (producto_id) 
REFERENCES productos(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Carga de productos en máquina
ALTER TABLE cargaproductosmaquina DROP CONSTRAINT IF EXISTS cargaproductosmaquina_producto_id_fkey;
ALTER TABLE cargaproductosmaquina 
ADD CONSTRAINT cargaproductosmaquina_producto_id_fkey 
FOREIGN KEY (producto_id) 
REFERENCES productos(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- ============================================
-- LÓGICA CON CASCADE:
-- ============================================
-- 
-- ✅ Eliminar producto → Se elimina automáticamente:
--    - Su registro en stock
--    - Sus detalles de compra
--    - Sus registros de carga en máquina
--
-- ⚠️  IMPORTANTE: Esto puede afectar el historial
-- Si necesitas conservar el historial, usa la solución alternativa
-- ============================================

-- ============================================
-- SOLUCIÓN ALTERNATIVA: VERIFICACIÓN PREVIA
-- ============================================

-- Función para verificar si un producto se puede eliminar
CREATE OR REPLACE FUNCTION puede_eliminar_producto(producto_id_param INTEGER)
RETURNS TABLE(puede_eliminar BOOLEAN, razon TEXT, detalles TEXT) AS $$
DECLARE
    stock_cantidad INTEGER;
    compras_count INTEGER;
    cargas_count INTEGER;
BEGIN
    -- Verificar stock
    SELECT cantidad INTO stock_cantidad 
    FROM stock 
    WHERE producto_id = producto_id_param;
    
    -- Verificar compras
    SELECT COUNT(*) INTO compras_count 
    FROM detallecompra 
    WHERE producto_id = producto_id_param;
    
    -- Verificar cargas
    SELECT COUNT(*) INTO cargas_count 
    FROM cargaproductosmaquina 
    WHERE producto_id = producto_id_param;
    
    -- Evaluar si se puede eliminar
    IF stock_cantidad > 0 THEN
        RETURN QUERY SELECT FALSE, 'Producto tiene stock', 
                     FORMAT('Stock actual: %s unidades', stock_cantidad);
    ELSIF compras_count > 0 THEN
        RETURN QUERY SELECT FALSE, 'Producto tiene historial de compras', 
                     FORMAT('%s compras registradas', compras_count);
    ELSIF cargas_count > 0 THEN
        RETURN QUERY SELECT FALSE, 'Producto tiene historial de cargas', 
                     FORMAT('%s cargas registradas', cargas_count);
    ELSE
        RETURN QUERY SELECT TRUE, 'Se puede eliminar', 
                     'No tiene stock ni historial';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso:
-- SELECT * FROM puede_eliminar_producto(1);

-- ============================================
-- RECOMENDACIÓN:
-- 
-- 1. Si quieres SIMPLICIDAD → Usar CASCADE (arriba)
-- 2. Si quieres SEGURIDAD → Usar verificación previa
-- 
-- Para este proyecto recomiendo CASCADE ya que es 
-- un sistema de gestión interno y la simplicidad 
-- es más importante que conservar historial detallado
-- ============================================ 