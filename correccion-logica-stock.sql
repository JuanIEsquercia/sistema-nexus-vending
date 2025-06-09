-- ============================================
-- CORRECCIÓN FINAL: LÓGICA DE TRIGGERS STOCK
-- ============================================

-- FUNCIÓN CORREGIDA: Revertir stock si se elimina una compra
CREATE OR REPLACE FUNCTION revertir_stock_compra()
RETURNS TRIGGER AS $$
BEGIN
    -- RESTAR del stock (revertir la suma que se había hecho en la compra)
    UPDATE stock 
    SET 
        cantidad = cantidad - OLD.cantidad,
        fecha_actualizacion = NOW()
    WHERE producto_id = OLD.producto_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN CORREGIDA: Revertir stock si se elimina una carga
CREATE OR REPLACE FUNCTION revertir_stock_carga()
RETURNS TRIGGER AS $$
BEGIN
    -- SUMAR al stock (revertir la resta que se había hecho en la carga)
    UPDATE stock 
    SET 
        cantidad = cantidad + OLD.cantidad,
        fecha_actualizacion = NOW()
    WHERE producto_id = OLD.producto_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- LÓGICA CORREGIDA:
-- ============================================
-- 
-- ✅ Compra productos → SUMA al stock
-- ✅ Eliminar compra → RESTA del stock (revierte la suma)
-- ✅ Carga máquina → RESTA del stock  
-- ✅ Eliminar carga → SUMA al stock (revierte la resta)
--
-- EJEMPLO:
-- 1. Compra 10 alfajores → +10 → stock = 10
-- 2. Elimina compra → -10 → stock = 0 ✅
-- 3. Compra 15 alfajores → +15 → stock = 15  
-- 4. Carga 5 alfajores → -5 → stock = 10
-- 5. Elimina carga → +5 → stock = 15
-- ============================================ 