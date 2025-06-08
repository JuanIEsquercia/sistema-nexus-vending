-- ============================================
-- CORRECCIÓN FINAL: TRIGGERS DE STOCK
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. FUNCIÓN: Actualizar stock después de una compra
CREATE OR REPLACE FUNCTION actualizar_stock_compra()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO stock (producto_id, cantidad, costo_unitario, fecha_actualizacion)
    VALUES (NEW.producto_id, NEW.cantidad, NEW.costo_unitario, NOW())
    ON CONFLICT (producto_id) 
    DO UPDATE SET 
        cantidad = stock.cantidad + NEW.cantidad,
        costo_unitario = NEW.costo_unitario,
        fecha_actualizacion = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. FUNCIÓN: Actualizar stock después de cargar máquina
CREATE OR REPLACE FUNCTION actualizar_stock_carga()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT cantidad FROM stock WHERE producto_id = NEW.producto_id) < NEW.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente. Stock disponible: %, Cantidad solicitada: %', 
            (SELECT cantidad FROM stock WHERE producto_id = NEW.producto_id), NEW.cantidad;
    END IF;
    
    UPDATE stock 
    SET 
        cantidad = cantidad - NEW.cantidad,
        fecha_actualizacion = NOW()
    WHERE producto_id = NEW.producto_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. FUNCIÓN CORREGIDA: Revertir stock si se elimina una compra
CREATE OR REPLACE FUNCTION revertir_stock_compra()
RETURNS TRIGGER AS $$
BEGIN
    -- SUMAR de vuelta al stock (revertir la suma que se había hecho)
    UPDATE stock 
    SET 
        cantidad = cantidad + OLD.cantidad,
        fecha_actualizacion = NOW()
    WHERE producto_id = OLD.producto_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 4. FUNCIÓN: Revertir stock si se elimina una carga
CREATE OR REPLACE FUNCTION revertir_stock_carga()
RETURNS TRIGGER AS $$
BEGIN
    -- SUMAR de vuelta al stock (revertir la resta que se había hecho)
    UPDATE stock 
    SET 
        cantidad = cantidad + OLD.cantidad,
        fecha_actualizacion = NOW()
    WHERE producto_id = OLD.producto_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 5. ELIMINAR TRIGGERS EXISTENTES
DROP TRIGGER IF EXISTS trigger_stock_compra ON detallecompra;
DROP TRIGGER IF EXISTS trigger_stock_carga ON cargaproductosmaquina;
DROP TRIGGER IF EXISTS trigger_revertir_stock_compra ON detallecompra;
DROP TRIGGER IF EXISTS trigger_revertir_stock_carga ON cargaproductosmaquina;

-- 6. CREAR TRIGGERS CORREGIDOS
CREATE TRIGGER trigger_stock_compra
    AFTER INSERT ON detallecompra
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_compra();

CREATE TRIGGER trigger_stock_carga
    AFTER INSERT ON cargaproductosmaquina
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_carga();

CREATE TRIGGER trigger_revertir_stock_compra
    AFTER DELETE ON detallecompra
    FOR EACH ROW
    EXECUTE FUNCTION revertir_stock_compra();

CREATE TRIGGER trigger_revertir_stock_carga
    AFTER DELETE ON cargaproductosmaquina
    FOR EACH ROW
    EXECUTE FUNCTION revertir_stock_carga();

-- 7. CORREGIR STOCKS NEGATIVOS (si los hay)
UPDATE stock SET cantidad = 0 WHERE cantidad < 0;

-- ============================================
-- ¡LISTO! STOCK CORREGIDO
-- ============================================
-- 
-- LÓGICA FINAL:
-- ✅ Compra productos → SUMA al stock
-- ✅ Carga máquina → RESTA del stock
-- ✅ Eliminar compra → SUMA de vuelta al stock
-- ✅ Eliminar carga → SUMA de vuelta al stock
--
-- ============================================ 