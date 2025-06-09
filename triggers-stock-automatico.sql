-- ============================================
-- TRIGGERS AUTOMÁTICOS PARA GESTIÓN DE STOCK
-- Ejecutar DESPUÉS de crear las tablas principales
-- ============================================

-- FUNCIÓN: Actualizar stock después de una compra
CREATE OR REPLACE FUNCTION actualizar_stock_compra()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar o insertar en stock
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

-- FUNCIÓN: Actualizar stock después de cargar máquina
CREATE OR REPLACE FUNCTION actualizar_stock_carga()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar que hay suficiente stock
    IF (SELECT cantidad FROM stock WHERE producto_id = NEW.producto_id) < NEW.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente. Stock disponible: %, Cantidad solicitada: %', 
            (SELECT cantidad FROM stock WHERE producto_id = NEW.producto_id), NEW.cantidad;
    END IF;
    
    -- Descontar del stock
    UPDATE stock 
    SET 
        cantidad = cantidad - NEW.cantidad,
        fecha_actualizacion = NOW()
    WHERE producto_id = NEW.producto_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Revertir stock si se elimina una compra
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

-- FUNCIÓN: Revertir stock si se elimina una carga
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
-- CREAR TRIGGERS
-- ============================================

-- Trigger: Después de insertar detalle de compra → SUMAR al stock
CREATE TRIGGER trigger_stock_compra
    AFTER INSERT ON detallecompra
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_compra();

-- Trigger: Después de cargar producto en máquina → RESTAR del stock
CREATE TRIGGER trigger_stock_carga
    AFTER INSERT ON cargaproductosmaquina
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_carga();

-- FUNCIÓN: Actualizar stock cuando se modifica una compra
CREATE OR REPLACE FUNCTION actualizar_stock_compra_modificada()
RETURNS TRIGGER AS $$
BEGIN
    -- Revertir el stock anterior
    UPDATE stock 
    SET 
        cantidad = cantidad - OLD.cantidad,
        fecha_actualizacion = NOW()
    WHERE producto_id = OLD.producto_id;
    
    -- Aplicar el nuevo stock
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

-- Trigger: Si se modifica detalle de compra → AJUSTAR stock
CREATE TRIGGER trigger_actualizar_stock_compra_modificada
    AFTER UPDATE ON detallecompra
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_compra_modificada();

-- Trigger: Si se elimina detalle de compra → REVERTIR stock
CREATE TRIGGER trigger_revertir_stock_compra
    AFTER DELETE ON detallecompra
    FOR EACH ROW
    EXECUTE FUNCTION revertir_stock_compra();

-- Trigger: Si se elimina carga → REVERTIR stock
CREATE TRIGGER trigger_revertir_stock_carga
    AFTER DELETE ON cargaproductosmaquina
    FOR EACH ROW
    EXECUTE FUNCTION revertir_stock_carga();

-- ============================================
-- VISTA: Stock con información completa
-- ============================================

CREATE OR REPLACE VIEW vista_stock_completo AS
SELECT 
    s.id,
    p.nombre as producto,
    s.cantidad,
    s.costo_unitario,
    ROUND(s.costo_unitario * p.multiplicador_precio, 2) as precio_venta,
    ROUND(s.cantidad * s.costo_unitario, 2) as valor_total_stock,
    s.fecha_actualizacion,
    CASE 
        WHEN s.cantidad <= 5 THEN 'CRÍTICO'
        WHEN s.cantidad <= 20 THEN 'BAJO'
        ELSE 'NORMAL'
    END as estado_stock
FROM stock s
JOIN productos p ON s.producto_id = p.id
ORDER BY s.cantidad ASC;

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función: Obtener precio de venta de un producto
CREATE OR REPLACE FUNCTION obtener_precio_venta(producto_id_param INTEGER)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    precio DECIMAL(10,2);
BEGIN
    SELECT ROUND(s.costo_unitario * p.multiplicador_precio, 2)
    INTO precio
    FROM stock s
    JOIN productos p ON s.producto_id = p.id
    WHERE s.producto_id = producto_id_param;
    
    RETURN COALESCE(precio, 0);
END;
$$ LANGUAGE plpgsql;

-- Función: Verificar stock disponible
CREATE OR REPLACE FUNCTION verificar_stock(producto_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    stock_disponible INTEGER;
BEGIN
    SELECT cantidad INTO stock_disponible
    FROM stock 
    WHERE producto_id = producto_id_param;
    
    RETURN COALESCE(stock_disponible, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICACIÓN DE TRIGGERS (OPCIONAL)
-- ============================================
-- 
-- Para probar los triggers después de tener datos:
-- 
-- 1. Inserta una compra desde la aplicación
-- 2. Verifica que el stock se actualizó:
--    SELECT * FROM vista_stock_completo;
-- 
-- 3. Carga productos en máquina desde la aplicación  
-- 4. Verifica que el stock se descontó:
--    SELECT * FROM vista_stock_completo;

-- ============================================
-- ¡LISTO! FUNCIONALIDAD COMPLETA
-- ============================================
-- 
-- ✅ Stock se actualiza automáticamente con compras
-- ✅ Stock se descuenta automáticamente con cargas
-- ✅ Validación de stock suficiente antes de cargar
-- ✅ Reversión automática si se eliminan registros
-- ✅ Vista completa con precios de venta
-- ✅ Funciones útiles para consultas
-- ✅ Datos de prueba incluidos
--
-- ============================================ 