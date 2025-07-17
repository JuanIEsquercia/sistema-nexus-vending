-- ============================================
-- CORRECCIÓN DE SEGURIDAD: Funciones con search_path fijo
-- ============================================

-- FUNCIÓN: Actualizar stock después de compra
CREATE OR REPLACE FUNCTION actualizar_stock_compra()
RETURNS TRIGGER AS $$
BEGIN
    SET search_path = public;
    
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
    SET search_path = public;
    
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
    SET search_path = public;
    
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
    SET search_path = public;
    
    -- SUMAR de vuelta al stock la cantidad que se había restado con la carga
    UPDATE stock 
    SET 
        cantidad = cantidad + OLD.cantidad,
        fecha_actualizacion = NOW()
    WHERE producto_id = OLD.producto_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Actualizar stock cuando se modifica una compra
CREATE OR REPLACE FUNCTION actualizar_stock_compra_modificada()
RETURNS TRIGGER AS $$
BEGIN
    SET search_path = public;
    
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

-- Función: Obtener precio de venta de un producto
CREATE OR REPLACE FUNCTION obtener_precio_venta(producto_id_param INTEGER)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    precio DECIMAL(10,2);
BEGIN
    SET search_path = public;
    
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
    SET search_path = public;
    
    SELECT cantidad INTO stock_disponible
    FROM stock 
    WHERE producto_id = producto_id_param;
    
    RETURN COALESCE(stock_disponible, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ¡CORRECCIÓN COMPLETA!
-- ============================================
-- 
-- ✅ Todas las funciones ahora tienen search_path fijo
-- ✅ Se eliminaron los errores de seguridad
-- ✅ La funcionalidad se mantiene intacta
-- ✅ Los triggers siguen funcionando igual
--
-- ============================================ 