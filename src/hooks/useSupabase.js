import { useState, useEffect } from 'react';
import { supabaseApi } from '../lib/supabase';

export function useSupabase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeAsync = async (operation) => {
    setLoading(true);
    setError(null);
    try {
      const result = await operation();
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, executeAsync, setError };
}

// Hook específico para productos
export function useProductos() {
  const [productos, setProductos] = useState([]);
  const { loading, error, executeAsync, setError } = useSupabase();

  const cargarProductos = async () => {
    const data = await executeAsync(() => supabaseApi.getProductos());
    setProductos(data || []);
  };

  const crearProducto = async (producto) => {
    const nuevo = await executeAsync(() => supabaseApi.createProducto(producto));
    setProductos(prev => [...prev, nuevo]);
    return nuevo;
  };

  const actualizarProducto = async (id, producto) => {
    const actualizado = await executeAsync(() => supabaseApi.updateProducto(id, producto));
    setProductos(prev => prev.map(p => p.id === id ? actualizado : p));
    return actualizado;
  };

  const eliminarProducto = async (id) => {
    await executeAsync(() => supabaseApi.deleteProducto(id));
    setProductos(prev => prev.filter(p => p.id !== id));
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  return {
    productos,
    loading,
    error,
    setError,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    recargar: cargarProductos
  };
}

// Hook específico para proveedores
export function useProveedores() {
  const [proveedores, setProveedores] = useState([]);
  const { loading, error, executeAsync, setError } = useSupabase();

  const cargarProveedores = async () => {
    const data = await executeAsync(() => supabaseApi.getProveedores());
    setProveedores(data || []);
  };

  const crearProveedor = async (proveedor) => {
    const nuevo = await executeAsync(() => supabaseApi.createProveedor(proveedor));
    setProveedores(prev => [...prev, nuevo]);
    return nuevo;
  };

  const actualizarProveedor = async (id, proveedor) => {
    const actualizado = await executeAsync(() => supabaseApi.updateProveedor(id, proveedor));
    setProveedores(prev => prev.map(p => p.id === id ? actualizado : p));
    return actualizado;
  };

  const eliminarProveedor = async (id) => {
    await executeAsync(() => supabaseApi.deleteProveedor(id));
    setProveedores(prev => prev.filter(p => p.id !== id));
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  return {
    proveedores,
    loading,
    error,
    setError,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
    recargar: cargarProveedores
  };
}

// Hook específico para compras
export function useCompras() {
  const [compras, setCompras] = useState([]);
  const { loading, error, executeAsync, setError } = useSupabase();

  const cargarCompras = async () => {
    const data = await executeAsync(() => supabaseApi.getCompras());
    setCompras(data || []);
  };

  const crearCompra = async (compra, detalles) => {
    const nueva = await executeAsync(() => supabaseApi.createCompra(compra, detalles));
    await cargarCompras(); // Recargar para obtener datos completos
    return nueva;
  };

  useEffect(() => {
    cargarCompras();
  }, []);

  return {
    compras,
    loading,
    error,
    setError,
    crearCompra,
    recargar: cargarCompras
  };
}

// Hook específico para stock
export function useStock() {
  const [stock, setStock] = useState([]);
  const { loading, error, executeAsync, setError } = useSupabase();

  const cargarStock = async () => {
    const data = await executeAsync(() => supabaseApi.getStock());
    setStock(data || []);
  };

  const actualizarStock = async (producto_id, cantidad, costo_unitario) => {
    const actualizado = await executeAsync(() => 
      supabaseApi.updateStock(producto_id, cantidad, costo_unitario)
    );
    await cargarStock(); // Recargar para obtener datos completos
    return actualizado;
  };

  useEffect(() => {
    cargarStock();
  }, []);

  return {
    stock,
    loading,
    error,
    setError,
    actualizarStock,
    recargar: cargarStock
  };
}

// Hook específico para cargas de máquina
export function useCargasMaquina() {
  const [cargas, setCargas] = useState([]);
  const { loading, error, executeAsync, setError } = useSupabase();

  const cargarCargasMaquina = async () => {
    const data = await executeAsync(() => supabaseApi.getCargasMaquina());
    setCargas(data || []);
  };

  const crearCargaMaquina = async (carga) => {
    const nueva = await executeAsync(() => supabaseApi.createCargaMaquina(carga));
    await cargarCargasMaquina(); // Recargar para obtener datos completos
    return nueva;
  };

  useEffect(() => {
    cargarCargasMaquina();
  }, []);

  return {
    cargas,
    loading,
    error,
    setError,
    crearCargaMaquina,
    recargar: cargarCargasMaquina
  };
} 

// Hook específico para exportación de compras
export function useExportCompras() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const exportarTodasLasCompras = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseApi.exportarTodasLasCompras();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    exportarTodasLasCompras
  };
}

// Hook específico para exportación de cargas de máquina
export function useExportCargasMaquina() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const exportarTodasLasCargasMaquina = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseApi.exportarTodasLasCargasMaquina();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    exportarTodasLasCargasMaquina
  };
}

// Hook específico para exportación de detalles de compra
export function useExportDetallesCompra() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const exportarTodosLosDetallesCompra = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseApi.exportarTodosLosDetallesCompra();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    exportarTodosLosDetallesCompra
  };
} 