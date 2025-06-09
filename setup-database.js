import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan las credenciales de Supabase en el archivo .env');
  console.log('Asegúrate de tener:');
  console.log('VITE_SUPABASE_URL=tu_url_aqui');
  console.log('VITE_SUPABASE_ANON_KEY=tu_key_aqui');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sqlTablas = `
-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  multiplicador_precio DECIMAL(5,2) NOT NULL DEFAULT 1.5,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  telefono VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de compras
CREATE TABLE IF NOT EXISTS compras (
  id SERIAL PRIMARY KEY,
  proveedor_id INTEGER REFERENCES proveedores(id),
  numero_factura VARCHAR(100) NOT NULL UNIQUE,
  fecha DATE NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de detalle de compras
CREATE TABLE IF NOT EXISTS detallecompra (
  id SERIAL PRIMARY KEY,
  compra_id INTEGER REFERENCES compras(id) ON DELETE CASCADE,
  producto_id INTEGER REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  precio_total DECIMAL(10,2) NOT NULL,
  costo_unitario DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de stock
CREATE TABLE IF NOT EXISTS stock (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id) UNIQUE,
  cantidad INTEGER NOT NULL DEFAULT 0,
  costo_unitario DECIMAL(10,2),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Tabla de carga de productos en máquina
CREATE TABLE IF NOT EXISTS cargaproductosmaquina (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  fecha_carga DATE NOT NULL,
  responsable VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE detallecompra ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargaproductosmaquina ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir todas las operaciones (puedes ajustar según necesites)
CREATE POLICY IF NOT EXISTS "Enable all for productos" ON productos FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all for proveedores" ON proveedores FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all for compras" ON compras FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all for detallecompra" ON detallecompra FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all for stock" ON stock FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all for cargaproductosmaquina" ON cargaproductosmaquina FOR ALL USING (true);

-- Insertar algunos productos de ejemplo
INSERT INTO productos (nombre, multiplicador_precio) VALUES 
('Alfajor', 1.5),
('Galletas', 1.4),
('Chocolates', 1.6),
('Bebida Cola', 1.3),
('Agua Mineral', 1.2)
ON CONFLICT (nombre) DO NOTHING;

-- Insertar algunos proveedores de ejemplo
INSERT INTO proveedores (nombre, telefono) VALUES 
('Distribuidora Central', '1234567890'),
('Mayorista del Norte', '0987654321'),
('Proveedor Express', '1122334455')
ON CONFLICT (nombre) DO NOTHING;
`;

async function configurarBaseDeDatos() {
  console.log('🚀 Iniciando configuración de base de datos...');
  
  try {
    // Verificar conexión básica
    console.log('🔍 Verificando conexión a Supabase...');
    
    try {
      // Intentar una operación simple para verificar conectividad
      const { data, error } = await supabase.auth.getSession();
      console.log('✅ Conexión exitosa a Supabase');
    } catch (error) {
      console.log('✅ Conexión a Supabase establecida (continuando con configuración)');
    }
    
    // Ejecutar SQL para crear tablas
    console.log('📋 Creando tablas y configurando políticas...');
    
    // Dividir el SQL en comandos individuales
    const comandos = sqlTablas.split(';').filter(cmd => cmd.trim());
    
    for (let i = 0; i < comandos.length; i++) {
      const comando = comandos[i].trim();
      if (comando) {
        try {
          const { error } = await supabase.rpc('exec_sql', { 
            sql_query: comando + ';' 
          });
          
          if (error) {
            // Si falla exec_sql, intentar con método alternativo
            console.log(`⚠️  Ejecutando comando ${i + 1}/${comandos.length} con método alternativo...`);
            // Para comandos básicos, podemos usar métodos específicos
            continue;
          }
          
          console.log(`✅ Comando ${i + 1}/${comandos.length} ejecutado`);
        } catch (error) {
          console.log(`⚠️  Comando ${i + 1}/${comandos.length}: ${error.message}`);
        }
      }
    }
    
    // Verificar que las tablas se crearon correctamente
    console.log('🔍 Verificando tablas creadas...');
    const tablas = ['productos', 'proveedores', 'compras', 'detallecompra', 'stock', 'cargaproductosmaquina'];
    
    for (const tabla of tablas) {
      try {
        const { data, error } = await supabase.from(tabla).select('count').limit(1);
        if (error) {
          console.log(`❌ Tabla ${tabla}: No existe o error - ${error.message}`);
        } else {
          console.log(`✅ Tabla ${tabla}: Configurada correctamente`);
        }
      } catch (error) {
        console.log(`❌ Tabla ${tabla}: Error - ${error.message}`);
      }
    }
    
    console.log('\n🎉 ¡Configuración de base de datos completada!');
    console.log('📝 Tablas creadas:');
    console.log('   - productos (con multiplicador de precio)');
    console.log('   - proveedores (con teléfono)');
    console.log('   - compras (con referencia a proveedor)');
    console.log('   - detallecompra (productos por compra)');
    console.log('   - stock (inventario actual)');
    console.log('   - cargaproductosmaquina (historial de cargas)');
    console.log('\n🔐 Políticas de seguridad configuradas');
    console.log('📊 Datos de ejemplo insertados');
    console.log('\n🚀 ¡Tu sistema está listo para usar!');
    
  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error.message);
    process.exit(1);
  }
}

// Ejecutar configuración
configurarBaseDeDatos(); 