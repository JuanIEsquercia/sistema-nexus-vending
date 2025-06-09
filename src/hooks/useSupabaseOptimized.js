import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

// Hook base optimizado
export function useSupabaseOptimized() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeAsync = useCallback(async (operation) => {
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
  }, []);

  return { loading, error, executeAsync, setError };
}

// Hook optimizado para productos con caché simple
export function useProductosOptimized() {
  const [productos, setProductos] = useState([]);
  const [lastFetch, setLastFetch] = useState(null);
  const { loading, error, executeAsync, setError } = useSupabaseOptimized();

  // Caché por 5 minutos
  const CACHE_DURATION = 5 * 60 * 1000;

  const cargarProductos = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && lastFetch && (now - lastFetch) < CACHE_DURATION && productos.length > 0) {
      return productos;
    }

    const data = await executeAsync(async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, multiplicador_precio')
        .order('nombre');
      
      if (error) throw error;
      return data;
    });

    setProductos(data || []);
    setLastFetch(now);
    return data;
  }, [productos, lastFetch, executeAsync]);

  const crearProducto = useCallback(async (producto) => {
    const nuevo = await executeAsync(async () => {
      const { data, error } = await supabase
        .from('productos')
        .insert([producto])
        .select('id, nombre, multiplicador_precio');
      
      if (error) throw error;
      return data[0];
    });

    setProductos(prev => [...prev, nuevo]);
    return nuevo;
  }, [executeAsync]);

  const actualizarProducto = useCallback(async (id, producto) => {
    const actualizado = await executeAsync(async () => {
      const { data, error } = await supabase
        .from('productos')
        .update(producto)
        .eq('id', id)
        .select('id, nombre, multiplicador_precio');
      
      if (error) throw error;
      return data[0];
    });

    setProductos(prev => prev.map(p => p.id === id ? actualizado : p));
    return actualizado;
  }, [executeAsync]);

  const eliminarProducto = useCallback(async (id) => {
    await executeAsync(async () => {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    });

    setProductos(prev => prev.filter(p => p.id !== id));
  }, [executeAsync]);

  useEffect(() => {
    cargarProductos();
  }, []);

  const productosMemorized = useMemo(() => productos, [productos]);

  return {
    productos: productosMemorized,
    loading,
    error,
    setError,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    recargar: () => cargarProductos(true)
  };
}

// Hook optimizado para proveedores con caché
export function useProveedoresOptimized() {
  const [proveedores, setProveedores] = useState([]);
  const [lastFetch, setLastFetch] = useState(null);
  const { loading, error, executeAsync, setError } = useSupabaseOptimized();

  const CACHE_DURATION = 5 * 60 * 1000;

  const cargarProveedores = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && lastFetch && (now - lastFetch) < CACHE_DURATION && proveedores.length > 0) {
      return proveedores;
    }

    const data = await executeAsync(async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('id, nombre, telefono')
        .order('nombre');
      
      if (error) throw error;
      return data;
    });

    setProveedores(data || []);
    setLastFetch(now);
    return data;
  }, [proveedores, lastFetch, executeAsync]);

  const crearProveedor = useCallback(async (proveedor) => {
    const nuevo = await executeAsync(async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .insert([proveedor])
        .select('id, nombre, telefono');
      
      if (error) throw error;
      return data[0];
    });

    setProveedores(prev => [...prev, nuevo]);
    return nuevo;
  }, [executeAsync]);

  const actualizarProveedor = useCallback(async (id, proveedor) => {
    const actualizado = await executeAsync(async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .update(proveedor)
        .eq('id', id)
        .select('id, nombre, telefono');
      
      if (error) throw error;
      return data[0];
    });

    setProveedores(prev => prev.map(p => p.id === id ? actualizado : p));
    return actualizado;
  }, [executeAsync]);

  const eliminarProveedor = useCallback(async (id) => {
    await executeAsync(async () => {
      const { error } = await supabase
        .from('proveedores')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    });

    setProveedores(prev => prev.filter(p => p.id !== id));
  }, [executeAsync]);

  useEffect(() => {
    cargarProveedores();
  }, []);

  return {
    proveedores: useMemo(() => proveedores, [proveedores]),
    loading,
    error,
    setError,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
    recargar: () => cargarProveedores(true)
  };
}

// Hook optimizado para compras con paginación
export function useComprasOptimized(pageSize = 10) {
  const [compras, setCompras] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const { loading, error, executeAsync, setError } = useSupabaseOptimized();

  const cargarCompras = useCallback(async (page = 0, reset = false) => {
    const data = await executeAsync(async () => {
      // Contar total de compras
      const { count } = await supabase
        .from('compras')
        .select('*', { count: 'exact', head: true });

      // Obtener compras paginadas con datos mínimos necesarios
      const { data, error } = await supabase
        .from('compras')
        .select(`
          id,
          numero_factura,
          fecha,
          total,
          proveedores!inner(nombre)
        `)
        .order('fecha', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) throw error;

      setTotalCount(count || 0);
      setHasMore((page + 1) * pageSize < count);
      
      return data || [];
    });

    if (reset || page === 0) {
      setCompras(data);
    } else {
      setCompras(prev => [...prev, ...data]);
    }
    
    setCurrentPage(page);
    return data;
  }, [pageSize, executeAsync]);

  const cargarMasCompras = useCallback(() => {
    if (!loading && hasMore) {
      cargarCompras(currentPage + 1, false);
    }
  }, [loading, hasMore, currentPage, cargarCompras]);

  const crearCompra = useCallback(async (compra, detalles) => {
    const nueva = await executeAsync(async () => {
      const { data: nuevaCompra, error: errorCompra } = await supabase
        .from('compras')
        .insert([compra])
        .select();
      
      if (errorCompra) throw errorCompra;

      const detallesConCompraId = detalles.map(detalle => ({
        ...detalle,
        compra_id: nuevaCompra[0].id
      }));

      const { error: errorDetalles } = await supabase
        .from('detallecompra')
        .insert(detallesConCompraId);
      
      if (errorDetalles) throw errorDetalles;

      return nuevaCompra[0];
    });

    // Solo recargar la primera página para mostrar la nueva compra
    await cargarCompras(0, true);
    return nueva;
  }, [executeAsync, cargarCompras]);

  const eliminarCompra = useCallback(async (compraId) => {
    await executeAsync(async () => {
      const { error } = await supabase
        .from('compras')
        .delete()
        .eq('id', compraId);
      
      if (error) throw error;
    });

    // Recargar página actual manteniendo posición
    await cargarCompras(0, true);
  }, [executeAsync, cargarCompras]);

  useEffect(() => {
    cargarCompras(0, true);
  }, []);

  return {
    compras: useMemo(() => compras, [compras]),
    loading,
    error,
    setError,
    currentPage,
    totalCount,
    hasMore,
    crearCompra,
    eliminarCompra,
    cargarMas: cargarMasCompras,
    recargar: () => cargarCompras(0, true)
  };
}

// Hook optimizado para stock con paginación
export function useStockOptimized(pageSize = 20) {
  const [stock, setStock] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const { loading, error, executeAsync, setError } = useSupabaseOptimized();

  const cargarStock = useCallback(async (page = 0, reset = false) => {
    const data = await executeAsync(async () => {
      const { count } = await supabase
        .from('stock')
        .select('*', { count: 'exact', head: true });

      const { data, error } = await supabase
        .from('stock')
        .select(`
          id,
          producto_id,
          cantidad,
          costo_unitario,
          fecha_actualizacion,
          productos!inner(nombre, multiplicador_precio)
        `)
        .order('fecha_actualizacion', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) throw error;

      setTotalCount(count || 0);
      setHasMore((page + 1) * pageSize < count);
      
      return data || [];
    });

    if (reset || page === 0) {
      setStock(data);
    } else {
      setStock(prev => [...prev, ...data]);
    }
    
    setCurrentPage(page);
    return data;
  }, [pageSize, executeAsync]);

  const cargarMasStock = useCallback(() => {
    if (!loading && hasMore) {
      cargarStock(currentPage + 1, false);
    }
  }, [loading, hasMore, currentPage, cargarStock]);

  useEffect(() => {
    cargarStock(0, true);
  }, []);

  return {
    stock: useMemo(() => stock, [stock]),
    loading,
    error,
    setError,
    currentPage,
    totalCount,
    hasMore,
    cargarMas: cargarMasStock,
    recargar: () => cargarStock(0, true)
  };
}

// Hook optimizado para cargas de máquina con paginación
export function useCargasMaquinaOptimized(pageSize = 15) {
  const [cargas, setCargas] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const { loading, error, executeAsync, setError } = useSupabaseOptimized();

  const cargarCargasMaquina = useCallback(async (page = 0, reset = false) => {
    const data = await executeAsync(async () => {
      const { count } = await supabase
        .from('cargaproductosmaquina')
        .select('*', { count: 'exact', head: true });

      const { data, error } = await supabase
        .from('cargaproductosmaquina')
        .select(`
          id,
          producto_id,
          cantidad_cargada,
          responsable,
          fecha_carga,
          productos!inner(nombre)
        `)
        .order('fecha_carga', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) throw error;

      setTotalCount(count || 0);
      setHasMore((page + 1) * pageSize < count);
      
      return data || [];
    });

    if (reset || page === 0) {
      setCargas(data);
    } else {
      setCargas(prev => [...prev, ...data]);
    }
    
    setCurrentPage(page);
    return data;
  }, [pageSize, executeAsync]);

  const cargarMasCargas = useCallback(() => {
    if (!loading && hasMore) {
      cargarCargasMaquina(currentPage + 1, false);
    }
  }, [loading, hasMore, currentPage, cargarCargasMaquina]);

  const crearCargaMaquina = useCallback(async (carga) => {
    const nueva = await executeAsync(async () => {
      const { data, error } = await supabase
        .from('cargaproductosmaquina')
        .insert([carga])
        .select();
      
      if (error) throw error;
      return data[0];
    });

    // Recargar solo la primera página
    await cargarCargasMaquina(0, true);
    return nueva;
  }, [executeAsync, cargarCargasMaquina]);

  useEffect(() => {
    cargarCargasMaquina(0, true);
  }, []);

  return {
    cargas: useMemo(() => cargas, [cargas]),
    loading,
    error,
    setError,
    currentPage,
    totalCount,
    hasMore,
    crearCargaMaquina,
    cargarMas: cargarMasCargas,
    recargar: () => cargarCargasMaquina(0, true)
  };
} 