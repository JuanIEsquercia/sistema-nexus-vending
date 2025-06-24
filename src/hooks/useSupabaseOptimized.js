import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

// Hook SIMPLE para productos (para usar en formularios - carga todos)
export function useProductosSimple() {
  const [productos, setProductos] = useState([]);
  const [lastFetch, setLastFetch] = useState(null);
  const { loading, error, executeAsync, setError } = useSupabaseOptimized();
  const mountedRef = useRef(true);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  const cargarProductos = useCallback(async (force = false) => {
    if (!mountedRef.current) return;
    
    const now = Date.now();
    
    // Verificar caché sin dependencias circulares
    if (!force && lastFetch && (now - lastFetch) < CACHE_DURATION) {
      return;
    }

    const data = await executeAsync(async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, multiplicador_precio')
        .order('nombre');
      
      if (error) throw error;
      return data;
    });

    if (mountedRef.current) {
      setProductos(data || []);
      setLastFetch(now);
    }
  }, [executeAsync, lastFetch]);

  useEffect(() => {
    mountedRef.current = true;
    cargarProductos();
    
    return () => {
      mountedRef.current = false;
    };
  }, []); // Solo ejecutar una vez al montar

  return {
    productos,
    loading,
    error,
    setError,
    recargar: () => cargarProductos(true)
  };
}

// Hook PAGINADO para productos (para mostrar listas grandes)
export function useProductosOptimized(pageSize = 25) {
  const [productos, setProductos] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const { loading, error, executeAsync, setError } = useSupabaseOptimized();
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  const cargarProductos = useCallback(async (page = 0, reset = false) => {
    if (!mountedRef.current) return;
    
    const data = await executeAsync(async () => {
      // Contar total
      const { count } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true });

      // Obtener productos paginados
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, multiplicador_precio')
        .order('nombre')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) throw error;

      if (mountedRef.current) {
        setTotalCount(count || 0);
        setHasMore((page + 1) * pageSize < count);
      }
      
      return data || [];
    });

    if (mountedRef.current) {
      if (reset || page === 0) {
        setProductos(data);
      } else {
        setProductos(prev => [...prev, ...data]);
      }
      
      setCurrentPage(page);
    }
    return data;
  }, [pageSize, executeAsync]);

  const cargarMasProductos = useCallback(() => {
    if (!loading && hasMore && mountedRef.current) {
      cargarProductos(currentPage + 1, false);
    }
  }, [loading, hasMore, currentPage, cargarProductos]);

  const crearProducto = useCallback(async (producto) => {
    const nuevo = await executeAsync(async () => {
      const { data, error } = await supabase
        .from('productos')
        .insert([producto])
        .select('id, nombre, multiplicador_precio');
      
      if (error) throw error;
      return data[0];
    });

    // Recargar primera página
    if (mountedRef.current) {
      await cargarProductos(0, true);
    }
    return nuevo;
  }, [executeAsync, cargarProductos]);

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

    if (mountedRef.current) {
      setProductos(prev => prev.map(p => p.id === id ? actualizado : p));
    }
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

    // Recargar página actual
    if (mountedRef.current) {
      await cargarProductos(0, true);
    }
  }, [executeAsync, cargarProductos]);

  // Cargar solo una vez al montar el componente
  useEffect(() => {
    mountedRef.current = true;
    
    if (!initializedRef.current) {
      initializedRef.current = true;
      cargarProductos(0, true);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, []); // Lista de dependencias vacía - solo ejecutar una vez

  return {
    productos: useMemo(() => productos, [productos]),
    loading,
    error,
    setError,
    currentPage,
    totalCount,
    hasMore,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    cargarMas: cargarMasProductos,
    recargar: () => cargarProductos(0, true)
  };
}

// Hook SIMPLE para proveedores (para formularios)
export function useProveedoresSimple() {
  const [proveedores, setProveedores] = useState([]);
  const [lastFetch, setLastFetch] = useState(null);
  const { loading, error, executeAsync, setError } = useSupabaseOptimized();
  const mountedRef = useRef(true);

  const CACHE_DURATION = 5 * 60 * 1000;

  const cargarProveedores = useCallback(async (force = false) => {
    if (!mountedRef.current) return;
    
    const now = Date.now();
    
    if (!force && lastFetch && (now - lastFetch) < CACHE_DURATION) {
      return;
    }

    const data = await executeAsync(async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('id, nombre, telefono')
        .order('nombre');
      
      if (error) throw error;
      return data;
    });

    if (mountedRef.current) {
      setProveedores(data || []);
      setLastFetch(now);
    }
  }, [executeAsync, lastFetch]);

  useEffect(() => {
    mountedRef.current = true;
    cargarProveedores();
    
    return () => {
      mountedRef.current = false;
    };
  }, []); // Solo ejecutar una vez

  return {
    proveedores,
    loading,
    error,
    setError,
    recargar: () => cargarProveedores(true)
  };
}

// Hook PAGINADO para proveedores
export function useProveedoresOptimized(pageSize = 30) {
  const [proveedores, setProveedores] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const { loading, error, executeAsync, setError } = useSupabaseOptimized();
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  const cargarProveedores = useCallback(async (page = 0, reset = false) => {
    if (!mountedRef.current) return;
    
    const data = await executeAsync(async () => {
      const { count } = await supabase
        .from('proveedores')
        .select('*', { count: 'exact', head: true });

      const { data, error } = await supabase
        .from('proveedores')
        .select('id, nombre, telefono')
        .order('nombre')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) throw error;

      if (mountedRef.current) {
        setTotalCount(count || 0);
        setHasMore((page + 1) * pageSize < count);
      }
      
      return data || [];
    });

    if (mountedRef.current) {
      if (reset || page === 0) {
        setProveedores(data);
      } else {
        setProveedores(prev => [...prev, ...data]);
      }
      
      setCurrentPage(page);
    }
    return data;
  }, [pageSize, executeAsync]);

  const cargarMasProveedores = useCallback(() => {
    if (!loading && hasMore && mountedRef.current) {
      cargarProveedores(currentPage + 1, false);
    }
  }, [loading, hasMore, currentPage, cargarProveedores]);

  const crearProveedor = useCallback(async (proveedor) => {
    const nuevo = await executeAsync(async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .insert([proveedor])
        .select('id, nombre, telefono');
      
      if (error) throw error;
      return data[0];
    });

    if (mountedRef.current) {
      await cargarProveedores(0, true);
    }
    return nuevo;
  }, [executeAsync, cargarProveedores]);

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

    if (mountedRef.current) {
      setProveedores(prev => prev.map(p => p.id === id ? actualizado : p));
    }
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

    if (mountedRef.current) {
      await cargarProveedores(0, true);
    }
  }, [executeAsync, cargarProveedores]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!initializedRef.current) {
      initializedRef.current = true;
      cargarProveedores(0, true);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, []); // Solo ejecutar una vez

  return {
    proveedores: useMemo(() => proveedores, [proveedores]),
    loading,
    error,
    setError,
    currentPage,
    totalCount,
    hasMore,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
    cargarMas: cargarMasProveedores,
    recargar: () => cargarProveedores(0, true)
  };
}

// Hook optimizado para compras con paginación
export function useComprasOptimized(pageSize = 10) {
  const [compras, setCompras] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const { loading, error, executeAsync, setError } = useSupabaseOptimized();
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  const cargarCompras = useCallback(async (page = 0, reset = false) => {
    if (!mountedRef.current) return;
    
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

      if (mountedRef.current) {
        setTotalCount(count || 0);
        setHasMore((page + 1) * pageSize < count);
      }
      
      return data || [];
    });

    if (mountedRef.current) {
      if (reset || page === 0) {
        setCompras(data);
      } else {
        setCompras(prev => [...prev, ...data]);
      }
      
      setCurrentPage(page);
    }
    return data;
  }, [pageSize, executeAsync]);

  const cargarMasCompras = useCallback(() => {
    if (!loading && hasMore && mountedRef.current) {
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
    if (mountedRef.current) {
      await cargarCompras(0, true);
    }
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
    if (mountedRef.current) {
      await cargarCompras(0, true);
    }
  }, [executeAsync, cargarCompras]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!initializedRef.current) {
      initializedRef.current = true;
      cargarCompras(0, true);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, []); // Solo ejecutar una vez

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
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  const cargarStock = useCallback(async (page = 0, reset = false) => {
    if (!mountedRef.current) return;
    
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

      if (mountedRef.current) {
        setTotalCount(count || 0);
        setHasMore((page + 1) * pageSize < count);
      }
      
      return data || [];
    });

    if (mountedRef.current) {
      if (reset || page === 0) {
        setStock(data);
      } else {
        setStock(prev => [...prev, ...data]);
      }
      
      setCurrentPage(page);
    }
    return data;
  }, [pageSize, executeAsync]);

  const cargarMasStock = useCallback(() => {
    if (!loading && hasMore && mountedRef.current) {
      cargarStock(currentPage + 1, false);
    }
  }, [loading, hasMore, currentPage, cargarStock]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!initializedRef.current) {
      initializedRef.current = true;
      cargarStock(0, true);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, []); // Solo ejecutar una vez

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
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  const cargarCargasMaquina = useCallback(async (page = 0, reset = false) => {
    if (!mountedRef.current) return;
    
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

      if (mountedRef.current) {
        setTotalCount(count || 0);
        setHasMore((page + 1) * pageSize < count);
      }
      
      return data || [];
    });

    if (mountedRef.current) {
      if (reset || page === 0) {
        setCargas(data);
      } else {
        setCargas(prev => [...prev, ...data]);
      }
      
      setCurrentPage(page);
    }
    return data;
  }, [pageSize, executeAsync]);

  const cargarMasCargas = useCallback(() => {
    if (!loading && hasMore && mountedRef.current) {
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
    if (mountedRef.current) {
      await cargarCargasMaquina(0, true);
    }
    return nueva;
  }, [executeAsync, cargarCargasMaquina]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!initializedRef.current) {
      initializedRef.current = true;
      cargarCargasMaquina(0, true);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, []); // Solo ejecutar una vez

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