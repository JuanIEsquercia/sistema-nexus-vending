-- Funciones SQL optimizadas para el Dashboard
-- Ejecutar estas funciones en el SQL Editor de Supabase

-- 1. Función para obtener KPIs del dashboard
CREATE OR REPLACE FUNCTION get_kpis_dashboard(fecha_inicio DATE)
RETURNS TABLE (
  total_compras NUMERIC,
  cantidad_compras BIGINT,
  promedio_compra NUMERIC,
  productos_unicos BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(c.total), 0) as total_compras,
    COUNT(c.id) as cantidad_compras,
    CASE 
      WHEN COUNT(c.id) > 0 THEN COALESCE(SUM(c.total), 0) / COUNT(c.id)
      ELSE 0 
    END as promedio_compra,
    (SELECT COUNT(DISTINCT dc.producto_id) 
     FROM detallecompra dc 
     JOIN compras c2 ON dc.compra_id = c2.id 
     WHERE c2.fecha >= fecha_inicio) as productos_unicos
  FROM compras c
  WHERE c.fecha >= fecha_inicio;
END;
$$;

-- 2. Función para productos más comprados con GROUP BY
CREATE OR REPLACE FUNCTION get_productos_mas_comprados(fecha_inicio DATE, limite INTEGER DEFAULT 10)
RETURNS TABLE (
  nombre TEXT,
  cantidad_total BIGINT,
  monto_total NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.nombre::TEXT,
    SUM(dc.cantidad) as cantidad_total,
    SUM(dc.precio_total) as monto_total
  FROM detallecompra dc
  JOIN productos p ON dc.producto_id = p.id
  JOIN compras c ON dc.compra_id = c.id
  WHERE c.fecha >= fecha_inicio
  GROUP BY p.id, p.nombre
  ORDER BY cantidad_total DESC
  LIMIT limite;
END;
$$;

-- 3. Función para tendencia de compras por día
CREATE OR REPLACE FUNCTION get_tendencia_compras(fecha_inicio DATE)
RETURNS TABLE (
  fecha DATE,
  total_dia NUMERIC,
  cantidad_dia BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.fecha,
    SUM(c.total) as total_dia,
    COUNT(c.id) as cantidad_dia
  FROM compras c
  WHERE c.fecha >= fecha_inicio
  GROUP BY c.fecha
  ORDER BY c.fecha ASC;
END;
$$;

-- 4. Función para distribución de gastos por producto
CREATE OR REPLACE FUNCTION get_distribucion_gastos(fecha_inicio DATE, limite INTEGER DEFAULT 6)
RETURNS TABLE (
  nombre TEXT,
  valor NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.nombre::TEXT,
    SUM(dc.precio_total) as valor
  FROM detallecompra dc
  JOIN productos p ON dc.producto_id = p.id
  JOIN compras c ON dc.compra_id = c.id
  WHERE c.fecha >= fecha_inicio
  GROUP BY p.id, p.nombre
  ORDER BY valor DESC
  LIMIT limite;
END;
$$;

-- 5. Función para compras recientes
CREATE OR REPLACE FUNCTION get_compras_recientes(fecha_inicio DATE, limite INTEGER DEFAULT 10)
RETURNS TABLE (
  id BIGINT,
  numero_factura TEXT,
  fecha DATE,
  total NUMERIC,
  proveedor_nombre TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.numero_factura::TEXT,
    c.fecha,
    c.total,
    pr.nombre::TEXT as proveedor_nombre
  FROM compras c
  LEFT JOIN proveedores pr ON c.proveedor_id = pr.id
  WHERE c.fecha >= fecha_inicio
  ORDER BY c.fecha DESC, c.id DESC
  LIMIT limite;
END;
$$;

-- 6. Función para análisis de periodicidad de compras por producto
CREATE OR REPLACE FUNCTION get_analisis_periodicidad(fecha_inicio DATE)
RETURNS TABLE (
  producto_nombre TEXT,
  compras_totales BIGINT,
  dias_promedio NUMERIC,
  ultima_compra DATE,
  primera_compra DATE
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH compras_por_producto AS (
    SELECT 
      p.nombre,
      dc.producto_id,
      c.fecha,
      ROW_NUMBER() OVER (PARTITION BY dc.producto_id ORDER BY c.fecha) as rn,
      LAG(c.fecha) OVER (PARTITION BY dc.producto_id ORDER BY c.fecha) as fecha_anterior
    FROM detallecompra dc
    JOIN productos p ON dc.producto_id = p.id
    JOIN compras c ON dc.compra_id = c.id
    WHERE c.fecha >= fecha_inicio
  ),
  intervalos AS (
    SELECT 
      nombre,
      producto_id,
      fecha,
      fecha_anterior,
      CASE 
        WHEN fecha_anterior IS NOT NULL THEN EXTRACT(DAYS FROM (fecha - fecha_anterior))
        ELSE NULL
      END as dias_entre_compras
    FROM compras_por_producto
  )
  SELECT 
    i.nombre::TEXT,
    COUNT(*) as compras_totales,
    AVG(i.dias_entre_compras) as dias_promedio,
    MAX(i.fecha) as ultima_compra,
    MIN(i.fecha) as primera_compra
  FROM intervalos i
  GROUP BY i.producto_id, i.nombre
  HAVING COUNT(*) > 1  -- Solo productos con más de una compra
  ORDER BY compras_totales DESC;
END;
$$;

-- 7. Función para métricas de proveedores
CREATE OR REPLACE FUNCTION get_metricas_proveedores(fecha_inicio DATE)
RETURNS TABLE (
  proveedor_nombre TEXT,
  compras_totales BIGINT,
  monto_total NUMERIC,
  promedio_compra NUMERIC,
  ultima_compra DATE
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.nombre::TEXT,
    COUNT(c.id) as compras_totales,
    SUM(c.total) as monto_total,
    AVG(c.total) as promedio_compra,
    MAX(c.fecha) as ultima_compra
  FROM compras c
  JOIN proveedores pr ON c.proveedor_id = pr.id
  WHERE c.fecha >= fecha_inicio
  GROUP BY pr.id, pr.nombre
  ORDER BY monto_total DESC;
END;
$$;
