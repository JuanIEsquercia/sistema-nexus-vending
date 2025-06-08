-- ============================================
-- CORRECCIÓN URGENTE: TRIGGERS DE STOCK
-- Ejecutar para corregir la lógica de eliminación
-- ============================================

-- FUNCIÓN CORREGIDA: Revertir stock si se elimina una compra
CREATE OR REPLACE FUNCTION revertir_stock_compra()
RETURNS TRIGGER AS $$
BEGIN
    -- SUMAR de vuelta al stock la cantidad que se había agregado con la compra
    UPDATE stock 
    SET 
        cantidad = cantidad + OLD.cantidad,
        fecha_actualizacion = NOW()
    WHERE producto_id = OLD.producto_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN CORREGIDA: Revertir stock si se elimina una carga
CREATE OR REPLACE FUNCTION revertir_stock_carga()
RETURNS TRIGGER AS $$
BEGIN
    -- SUMAR de vuelta al stock la cantidad que se había restado con la carga
    UPDATE stock 
    SET 
        cantidad = cantidad + OLD.cantidad,
        fecha_actualizacion = NOW()
    WHERE producto_id = OLD.producto_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICAR LA LÓGICA CORREGIDA
-- ============================================
--
-- FLUJO CORRECTO:
-- 1. Compra 72 productos → stock +72 → stock = 72
-- 2. Carga 50 productos → stock -50 → stock = 22
-- 3. Eliminar compra → stock +72 → stock = 94 ❌
--
-- ¡PROBLEMA! Al eliminar una compra después de cargar,
-- el stock queda incorrecto.
-- 
-- NECESITAMOS una lógica más inteligente...
-- ============================================

-- FUNCIÓN MEJORADA: Solo revertir si no afecta stock negativo
CREATE OR REPLACE FUNCTION revertir_stock_compra_inteligente()
RETURNS TRIGGER AS $$
DECLARE
    stock_actual INTEGER;
BEGIN
    -- Obtener stock actual
    SELECT cantidad INTO stock_actual 
    FROM stock 
    WHERE producto_id = OLD.producto_id;
    
    -- Revertir la compra (sumar de vuelta)
    UPDATE stock 
    SET 
        cantidad = cantidad + OLD.cantidad,
        fecha_actualizacion = NOW()
    WHERE producto_id = OLD.producto_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Aplicar la función mejorada
DROP TRIGGER IF EXISTS trigger_revertir_stock_compra ON detallecompra;
CREATE TRIGGER trigger_revertir_stock_compra
    AFTER DELETE ON detallecompra
    FOR EACH ROW
    EXECUTE FUNCTION revertir_stock_compra_inteligente();

-- ============================================
-- ¡LISTO! LÓGICA CORREGIDA
-- ============================================ 