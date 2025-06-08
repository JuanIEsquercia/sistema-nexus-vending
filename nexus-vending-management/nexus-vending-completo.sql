    -- ============================================
    -- NEXUS VENDING - CONFIGURACIÓN COMPLETA
    -- Archivo único para ejecutar en Supabase
    -- ============================================

    -- ============================================
    -- PASO 1: ELIMINAR TABLAS SI EXISTEN
    -- ============================================
    DROP TABLE IF EXISTS cargaproductosmaquina CASCADE;
    DROP TABLE IF EXISTS stock CASCADE;
    DROP TABLE IF EXISTS detallecompra CASCADE;
    DROP TABLE IF EXISTS compras CASCADE;
    DROP TABLE IF EXISTS proveedores CASCADE;
    DROP TABLE IF EXISTS productos CASCADE;

    -- Eliminar funciones si existen
    DROP FUNCTION IF EXISTS actualizar_stock_compra() CASCADE;
    DROP FUNCTION IF EXISTS actualizar_stock_carga() CASCADE;
    DROP FUNCTION IF EXISTS revertir_stock_compra() CASCADE;
    DROP FUNCTION IF EXISTS revertir_stock_carga() CASCADE;
    DROP FUNCTION IF EXISTS obtener_precio_venta(INTEGER) CASCADE;
    DROP FUNCTION IF EXISTS verificar_stock(INTEGER) CASCADE;

    -- Eliminar vista si existe
    DROP VIEW IF EXISTS vista_stock_completo CASCADE;

    -- ============================================
    -- PASO 2: CREAR TABLAS
    -- ============================================

    -- Tabla de productos
    CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    multiplicador_precio DECIMAL(5,2) NOT NULL DEFAULT 1.5,
    created_at TIMESTAMP DEFAULT NOW()
    );

    -- Tabla de proveedores
    CREATE TABLE proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
    );

    -- Tabla de compras
    CREATE TABLE compras (
    id SERIAL PRIMARY KEY,
    proveedor_id INTEGER REFERENCES proveedores(id),
    numero_factura VARCHAR(100) NOT NULL UNIQUE,
    fecha DATE NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
    );

    -- Tabla de detalle de compras
    CREATE TABLE detallecompra (
    id SERIAL PRIMARY KEY,
    compra_id INTEGER REFERENCES compras(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    precio_total DECIMAL(10,2) NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
    );

    -- Tabla de stock
    CREATE TABLE stock (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER REFERENCES productos(id) UNIQUE,
    cantidad INTEGER NOT NULL DEFAULT 0,
    costo_unitario DECIMAL(10,2),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
    );

    -- Tabla de carga de productos en máquina
    CREATE TABLE cargaproductosmaquina (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    fecha_carga DATE NOT NULL,
    responsable VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
    );

    -- ============================================
    -- PASO 3: CONFIGURAR SEGURIDAD (RLS)
    -- ============================================

    -- Habilitar Row Level Security
    ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
    ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
    ALTER TABLE detallecompra ENABLE ROW LEVEL SECURITY;
    ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
    ALTER TABLE cargaproductosmaquina ENABLE ROW LEVEL SECURITY;

    -- Crear políticas para permitir todas las operaciones
    CREATE POLICY "Enable all for productos" ON productos FOR ALL USING (true);
    CREATE POLICY "Enable all for proveedores" ON proveedores FOR ALL USING (true);
    CREATE POLICY "Enable all for compras" ON compras FOR ALL USING (true);
    CREATE POLICY "Enable all for detallecompra" ON detallecompra FOR ALL USING (true);
    CREATE POLICY "Enable all for stock" ON stock FOR ALL USING (true);
    CREATE POLICY "Enable all for cargaproductosmaquina" ON cargaproductosmaquina FOR ALL USING (true);

    -- ============================================
    -- PASO 4: CREAR FUNCIONES DE TRIGGERS
    -- ============================================

    -- Función: Actualizar stock después de una compra
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

    -- Función: Actualizar stock después de cargar máquina
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

    -- Función: Revertir stock si se elimina una compra
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

    -- Función: Revertir stock si se elimina una carga
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

    -- ============================================
    -- PASO 5: CREAR TRIGGERS
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
    -- PASO 6: CREAR VISTAS Y FUNCIONES ÚTILES
    -- ============================================

    -- Vista: Stock con información completa
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
    -- PASO 7: INSERTAR DATOS DE EJEMPLO
    -- ============================================

    -- Insertar productos de ejemplo
    INSERT INTO productos (nombre, multiplicador_precio) VALUES 
    ('Alfajor', 1.5),
    ('Galletas', 1.4),
    ('Chocolates', 1.6),
    ('Bebida Cola', 1.3),
    ('Agua Mineral', 1.2),
    ('Chicles', 1.8),
    ('Caramelos', 1.7),
    ('Papas Fritas', 1.4),
    ('Barras de Cereal', 1.5),
    ('Jugos', 1.3);

    -- Insertar proveedores de ejemplo
    INSERT INTO proveedores (nombre, telefono) VALUES 
    ('Distribuidora Central', '1234567890'),
    ('Mayorista del Norte', '0987654321'),
    ('Proveedor Express', '1122334455'),
    ('Comercial Sur', '5566778899'),
    ('Distribuciones ABC', '9988776655');

    -- ============================================
    -- PASO 8: VERIFICACIÓN FINAL
    -- ============================================

    -- Verificar que las tablas se crearon correctamente
    SELECT 'productos' as tabla, COUNT(*) as registros FROM productos
    UNION ALL
    SELECT 'proveedores' as tabla, COUNT(*) as registros FROM proveedores
    UNION ALL
    SELECT 'compras' as tabla, COUNT(*) as registros FROM compras
    UNION ALL
    SELECT 'detallecompra' as tabla, COUNT(*) as registros FROM detallecompra
    UNION ALL
    SELECT 'stock' as tabla, COUNT(*) as registros FROM stock
    UNION ALL
    SELECT 'cargaproductosmaquina' as tabla, COUNT(*) as registros FROM cargaproductosmaquina;

    -- ============================================
    -- ¡CONFIGURACIÓN COMPLETADA!
    -- ============================================
    -- 
    -- ✅ 6 tablas creadas con relaciones
    -- ✅ Triggers automáticos de stock configurados
    -- ✅ Políticas de seguridad configuradas
    -- ✅ Vistas y funciones útiles creadas
    -- ✅ Datos de ejemplo insertados
    -- ✅ Sistema listo para usar
    --
    -- LÓGICA DE STOCK:
    -- • Compra productos → SUMA al stock
    -- • Carga máquina → RESTA del stock
    -- • Eliminar compra → SUMA de vuelta al stock
    -- • Eliminar carga → SUMA de vuelta al stock
    --
    -- INICIAR APLICACIÓN: npm run dev
    -- ============================================ 