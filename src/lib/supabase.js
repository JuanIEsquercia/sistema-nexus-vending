import { createClient } from '@supabase/supabase-js'

// Tu URL y Key de Supabase (reemplaza con los valores de tu proyecto)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

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
    const { data, error } = await supabase
      .from('stock')
      .upsert({
        producto_id,
        cantidad,
        costo_unitario,
        fecha_actualizacion: new Date().toISOString()
      })
      .select();
    
    if (error) throw error;
    return data[0];
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
  }
}; 