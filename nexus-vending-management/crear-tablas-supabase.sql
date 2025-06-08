-- ============================================
-- NEXUS VENDING - CONFIGURACIÓN DE BASE DE DATOS
-- Ejecutar este SQL en el SQL Editor de Supabase
-- ============================================

-- 1. TABLA DE PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  multiplicador_precio DECIMAL(5,2) NOT NULL DEFAULT 1.5,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. TABLA DE PROVEEDORES
CREATE TABLE IF NOT EXISTS proveedores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  telefono VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. TABLA DE COMPRAS
CREATE TABLE IF NOT EXISTS compras (
  id SERIAL PRIMARY KEY,
  proveedor_id INTEGER REFERENCES proveedores(id),
  numero_factura VARCHAR(100) NOT NULL UNIQUE,
  fecha DATE NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. TABLA DE DETALLE DE COMPRAS
CREATE TABLE IF NOT EXISTS detallecompra (
  id SERIAL PRIMARY KEY,
  compra_id INTEGER REFERENCES compras(id) ON DELETE CASCADE,
  producto_id INTEGER REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  precio_total DECIMAL(10,2) NOT NULL,
  costo_unitario DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. TABLA DE STOCK
CREATE TABLE IF NOT EXISTS stock (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id) UNIQUE,
  cantidad INTEGER NOT NULL DEFAULT 0,
  costo_unitario DECIMAL(10,2),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- 6. TABLA DE CARGA DE PRODUCTOS EN MÁQUINA
CREATE TABLE IF NOT EXISTS cargaproductosmaquina (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  fecha_carga DATE NOT NULL,
  responsable VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CONFIGURACIÓN DE SEGURIDAD (RLS)
-- ============================================

-- Habilitar Row Level Security en todas las tablas
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE detallecompra ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargaproductosmaquina ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Enable all for productos" ON productos;
DROP POLICY IF EXISTS "Enable all for proveedores" ON proveedores;
DROP POLICY IF EXISTS "Enable all for compras" ON compras;
DROP POLICY IF EXISTS "Enable all for detallecompra" ON detallecompra;
DROP POLICY IF EXISTS "Enable all for stock" ON stock;
DROP POLICY IF EXISTS "Enable all for cargaproductosmaquina" ON cargaproductosmaquina;

-- Crear políticas para permitir todas las operaciones
CREATE POLICY "Enable all for productos" ON productos FOR ALL USING (true);
CREATE POLICY "Enable all for proveedores" ON proveedores FOR ALL USING (true);
CREATE POLICY "Enable all for compras" ON compras FOR ALL USING (true);
CREATE POLICY "Enable all for detallecompra" ON detallecompra FOR ALL USING (true);
CREATE POLICY "Enable all for stock" ON stock FOR ALL USING (true);
CREATE POLICY "Enable all for cargaproductosmaquina" ON cargaproductosmaquina FOR ALL USING (true);

-- ============================================
-- DATOS DE EJEMPLO
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
('Jugos', 1.3)
ON CONFLICT (nombre) DO NOTHING;

-- Insertar proveedores de ejemplo
INSERT INTO proveedores (nombre, telefono) VALUES 
('Distribuidora Central', '1234567890'),
('Mayorista del Norte', '0987654321'),
('Proveedor Express', '1122334455'),
('Comercial Sur', '5566778899'),
('Distribuciones ABC', '9988776655')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- VERIFICACIÓN
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
-- ✅ Políticas de seguridad configuradas
-- ✅ Datos de ejemplo insertados
-- ✅ Sistema listo para usar
--
-- Ahora puedes ejecutar: npm run dev
-- ============================================ 