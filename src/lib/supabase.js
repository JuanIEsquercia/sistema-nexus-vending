import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase con validación
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://awnudpkaqgyadfvjvacf.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3bnVkcGthcWd5YWRmdmp2YWNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNDA3OTcsImV4cCI6MjA2NDkxNjc5N30.mGDeJyhT3ew9ADPk0rlpIlUvMq_hfFDnlvIUhpEb2D8'

// Validar configuración
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseKey ? 'Configurada' : 'No configurada');
}

// Detectar si estamos en desarrollo
const isDevelopment = import.meta.env.DEV

// Crear cliente con configuración básica
export const supabase = createClient(supabaseUrl, supabaseKey)

// Funciones helper para las operaciones CRUD
export const supabaseApi = {
  // ===== PRODUCTOS =====
  async getProductos() {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('nombre');
    
    if (error) throw error;
    return data;
  },

  async createProducto(producto) {
    const { data, error } = await supabase
      .from('productos')
      .insert([producto])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async updateProducto(id, producto) {
    const { data, error } = await supabase
      .from('productos')
      .update(producto)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async deleteProducto(id) {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // ===== PROVEEDORES =====
  async getProveedores() {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('nombre');
    
    if (error) throw error;
    return data;
  },

  async createProveedor(proveedor) {
    const { data, error } = await supabase
      .from('proveedores')
      .insert([proveedor])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async updateProveedor(id, proveedor) {
    const { data, error } = await supabase
      .from('proveedores')
      .update(proveedor)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async deleteProveedor(id) {
    const { error } = await supabase
      .from('proveedores')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // ===== COMPRAS =====
  async getCompras() {
    const { data, error } = await supabase
      .from('compras')
      .select(`
        *,
        proveedores(nombre),
        detallecompra(*)
      `)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createCompra(compra, detalles) {
    const { data: nuevaCompra, error: errorCompra } = await supabase
      .from('compras')
      .insert([compra])
      .select();
    
    if (errorCompra) throw errorCompra;

    // Insertar detalles de compra
    const detallesConCompraId = detalles.map(detalle => ({
      ...detalle,
      compra_id: nuevaCompra[0].id
    }));

    const { error: errorDetalles } = await supabase
      .from('detallecompra')
      .insert(detallesConCompraId);
    
    if (errorDetalles) throw errorDetalles;

    return nuevaCompra[0];
  },

  // ===== STOCK =====
  async getStock() {
    const { data, error } = await supabase
      .from('stock')
      .select(`
        *,
        productos(nombre, multiplicador_precio)
      `)
      .order('fecha_actualizacion', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateStock(producto_id, cantidad, costo_unitario) {
    // Primero verificar si existe el registro
    const { data: existingStock } = await supabase
      .from('stock')
      .select('*')
      .eq('producto_id', producto_id)
      .single();

    if (existingStock) {
      // Si existe, actualizar
      const { data, error } = await supabase
        .from('stock')
        .update({
          cantidad,
          costo_unitario,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('producto_id', producto_id)
        .select();
      
      if (error) throw error;
      return data[0];
    } else {
      // Si no existe, insertar
      const { data, error } = await supabase
        .from('stock')
        .insert({
          producto_id,
          cantidad,
          costo_unitario,
          fecha_actualizacion: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      return data[0];
    }
  },

  // ===== CARGA PRODUCTOS MÁQUINA =====
  async getCargasMaquina() {
    const { data, error } = await supabase
      .from('cargaproductosmaquina')
      .select(`
        *,
        productos(nombre)
      `)
      .order('fecha_carga', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createCargaMaquina(carga) {
    const { data, error } = await supabase
      .from('cargaproductosmaquina')
      .insert([carga])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // ===== EXPORTACIÓN CSV =====
  async exportarTodasLasCompras() {
    const { data, error } = await supabase
      .from('compras')
      .select(`
        *,
        proveedores(nombre)
      `)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async exportarTodasLasCargasMaquina() {
    const { data, error } = await supabase
      .from('cargaproductosmaquina')
      .select(`
        *,
        productos(nombre)
      `)
      .order('fecha_carga', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async exportarTodosLosDetallesCompra() {
    const { data, error } = await supabase
      .from('detallecompra')
      .select(`
        *,
        compras(numero_factura, fecha, proveedores(nombre)),
        productos(nombre)
      `)
      .order('compra_id', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // ===== KEEP-ALIVE =====
  async pingDatabase() {
    try {
      // Hacer una consulta simple para mantener la conexión activa
      const { data, error } = await supabase
        .from('productos')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Error en ping a la base de datos:', error);
      
      // Detectar tipos específicos de error
      if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
        console.error('🚨 Error de red detectado - Verificar conexión a Supabase');
      }
      
      return { success: false, error: error.message, timestamp: new Date().toISOString() };
    }
  },

  // ===== DIAGNÓSTICO DE CONEXIÓN =====
  async diagnosticarConexion() {
    const diagnosticos = {
      variablesEntorno: {
        url: !!import.meta.env.VITE_SUPABASE_URL,
        key: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      configuracion: {
        url: supabaseUrl,
        key: supabaseKey ? 'Configurada' : 'No configurada'
      },
      timestamp: new Date().toISOString()
    };

    try {
      const ping = await this.pingDatabase();
      diagnosticos.conexion = ping;
    } catch (error) {
      diagnosticos.conexion = { success: false, error: error.message };
    }

    return diagnosticos;
  }

};

// ===== KEEP-ALIVE SERVICE =====
class SupabaseKeepAlive {
  constructor() {
    this.intervalId = null;
    this.isActive = false;
    this.pingInterval = 36 * 60 * 60 * 1000; // 36 horas por defecto
    this.lastPing = null;
    this.pingHistory = [];
  }

  start(intervalHours = 36) {
    if (this.isActive) {
      console.log('Keep-alive ya está activo');
      return;
    }

    this.pingInterval = intervalHours * 60 * 60 * 1000;
    this.isActive = true;
    
    console.log(`🔄 Iniciando keep-alive de Supabase cada ${intervalHours} horas`);
    
    // Ping inmediato
    this.ping();
    
    // Ping periódico
    this.intervalId = setInterval(() => {
      this.ping();
    }, this.pingInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isActive = false;
    console.log('⏹️ Keep-alive de Supabase detenido');
  }

  async ping() {
    try {
      const result = await supabaseApi.pingDatabase();
      this.lastPing = result;
      
      // Mantener historial de los últimos 10 pings
      this.pingHistory.unshift(result);
      if (this.pingHistory.length > 10) {
        this.pingHistory.pop();
      }

      if (result.success) {
        console.log(`✅ Ping exitoso a Supabase: ${result.timestamp}`);
      } else {
        // Solo mostrar warning en producción, no en desarrollo
        if (!import.meta.env.DEV) {
          console.warn(`⚠️ Ping fallido a Supabase: ${result.error}`);
        }
      }
      
      return result;
    } catch (error) {
      // Solo mostrar error en producción
      if (!import.meta.env.DEV) {
        console.error('❌ Error en ping de keep-alive:', error);
      }
      return { success: false, error: error.message, timestamp: new Date().toISOString() };
    }
  }

  getStatus() {
    return {
      isActive: this.isActive,
      lastPing: this.lastPing,
      pingHistory: this.pingHistory,
      intervalHours: this.pingInterval / (60 * 60 * 1000)
    };
  }

  // Ping manual
  async manualPing() {
    console.log('🔄 Ping manual iniciado...');
    return await this.ping();
  }
}

// Instancia global del keep-alive
export const supabaseKeepAlive = new SupabaseKeepAlive();

// Auto-iniciar keep-alive solo en producción
if (typeof window !== 'undefined' && !isDevelopment) {
  // Solo en producción - cada 36 horas
  supabaseKeepAlive.start(36); // Cada 36 horas
  
  // También mantener activo cuando la ventana está visible (solo si han pasado más de 12 horas desde el último ping)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && supabaseKeepAlive.isActive) {
      const lastPing = supabaseKeepAlive.lastPing;
      const now = new Date();
      const hoursSinceLastPing = lastPing ? (now - new Date(lastPing.timestamp)) / (1000 * 60 * 60) : 999;
      
      if (hoursSinceLastPing > 12) {
        console.log('👁️ Ventana visible - haciendo ping preventivo');
        supabaseKeepAlive.ping();
      }
    }
  });
} else if (isDevelopment) {
  console.log('🚫 Keep-alive desactivado en desarrollo para evitar errores de CORS');
} 