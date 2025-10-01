import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Button, Form, Badge } from 'react-bootstrap';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays } from 'date-fns';
import { supabase } from '../../lib/supabase';
import './dashboard.css';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    kpis: {},
    productosMasComprados: [],
    tendenciaCompras: [],
    distribucionGastos: [],
    comprasRecientes: []
  });
  const [filtroFecha, setFiltroFecha] = useState('30'); // días
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Colores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    cargarDatos();
  }, [filtroFecha, filtroTipo]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fechaInicio = subDays(new Date(), parseInt(filtroFecha));
      
      // Cargar todos los datos en paralelo
      const [
        kpis,
        productosMasComprados,
        tendenciaCompras,
        distribucionGastos,
        comprasRecientes
      ] = await Promise.all([
        cargarKPIs(fechaInicio),
        cargarProductosMasComprados(fechaInicio),
        cargarTendenciaCompras(fechaInicio),
        cargarDistribucionGastos(fechaInicio),
        cargarComprasRecientes(fechaInicio)
      ]);

      console.log('Datos cargados:', {
        kpis,
        productosMasComprados,
        tendenciaCompras,
        distribucionGastos,
        comprasRecientes
      });

      setData({
        kpis,
        productosMasComprados,
        tendenciaCompras,
        distribucionGastos,
        comprasRecientes
      });
    } catch (err) {
      console.error('Error cargando datos:', err);
      console.error('Detalles del error:', err.message);
      setError(`Error al cargar los datos del dashboard: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cargarKPIs = async (fechaInicio) => {
    // Usar consultas simples por ahora
    return await cargarKPIsFallback(fechaInicio);
  };

  const cargarKPIsFallback = async (fechaInicio) => {
    // Total de compras y cantidad
    const { data: compras, error: errorCompras } = await supabase
      .from('compras')
      .select('total')
      .gte('fecha', fechaInicio.toISOString().split('T')[0]);

    if (errorCompras) throw errorCompras;

    const totalCompras = compras?.reduce((sum, c) => sum + (c.total || 0), 0) || 0;
    const cantidadCompras = compras?.length || 0;
    const promedioCompra = cantidadCompras > 0 ? totalCompras / cantidadCompras : 0;

    // Productos únicos comprados - consulta optimizada
    const { data: productosUnicos, error: errorProductos } = await supabase
      .from('detallecompra')
      .select('producto_id')
      .gte('created_at', fechaInicio.toISOString());

    if (errorProductos) throw errorProductos;

    const productosUnicosCount = new Set(productosUnicos?.map(p => p.producto_id) || []).size;

    return {
      totalCompras,
      cantidadCompras,
      promedioCompra,
      productosUnicos: productosUnicosCount
    };
  };

  const cargarProductosMasComprados = async (fechaInicio) => {
    const { data, error } = await supabase
      .from('detallecompra')
      .select(`
        cantidad,
        precio_total,
        productos!inner(nombre)
      `)
      .gte('created_at', fechaInicio.toISOString());

    if (error) throw error;

    const productosAgrupados = {};
    data?.forEach(detalle => {
      const nombre = detalle.productos?.nombre || 'Sin nombre';
      if (!productosAgrupados[nombre]) {
        productosAgrupados[nombre] = {
          nombre,
          cantidad: 0,
          monto: 0
        };
      }
      productosAgrupados[nombre].cantidad += detalle.cantidad || 0;
      productosAgrupados[nombre].monto += detalle.precio_total || 0;
    });

    return Object.values(productosAgrupados)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);
  };

  const cargarTendenciaCompras = async (fechaInicio) => {
    const { data, error } = await supabase
      .from('compras')
      .select(`
        total,
        proveedor_id,
        proveedores (
          nombre
        )
      `)
      .gte('fecha', fechaInicio.toISOString().split('T')[0]);

    console.log('Datos crudos de compras:', data);
    console.log('Error si existe:', error);

    if (error) throw error;

    // Agrupar por proveedor
    const porProveedor = {};
    data?.forEach(compra => {
      console.log('Procesando compra:', compra);
      const nombreProveedor = compra.proveedores?.nombre || `Proveedor ID: ${compra.proveedor_id}` || 'Sin proveedor';
      if (!porProveedor[nombreProveedor]) {
        porProveedor[nombreProveedor] = {
          proveedor: nombreProveedor,
          totalComprado: 0,
          cantidadCompras: 0
        };
      }
      porProveedor[nombreProveedor].totalComprado += parseFloat(compra.total) || 0;
      porProveedor[nombreProveedor].cantidadCompras += 1;
    });

    const resultado = Object.values(porProveedor)
      .sort((a, b) => b.totalComprado - a.totalComprado);
    
    console.log('Resultado final por proveedor:', resultado);
    return resultado;
  };

  const cargarDistribucionGastos = async (fechaInicio) => {
    const { data, error } = await supabase
      .from('detallecompra')
      .select(`
        precio_total,
        productos!inner(nombre)
      `)
      .gte('created_at', fechaInicio.toISOString());

    if (error) throw error;

    const distribucion = {};
    data?.forEach(detalle => {
      const nombre = detalle.productos?.nombre || 'Sin nombre';
      if (!distribucion[nombre]) {
        distribucion[nombre] = { nombre, valor: 0 };
      }
      distribucion[nombre].valor += detalle.precio_total || 0;
    });

    return Object.values(distribucion)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);
  };

  const cargarComprasRecientes = async (fechaInicio) => {
    // Primero obtener las compras del período
    const { data: comprasData, error: errorCompras } = await supabase
      .from('compras')
      .select('id, fecha')
      .gte('fecha', fechaInicio.toISOString().split('T')[0])
      .order('fecha', { ascending: true });

    if (errorCompras) throw errorCompras;

    if (!comprasData || comprasData.length === 0) {
      return [];
    }

    const compraIds = comprasData.map(c => c.id);

    // Luego obtener los detalles de esas compras
    const { data, error } = await supabase
      .from('detallecompra')
      .select(`
        cantidad,
        compra_id,
        productos!inner(id, nombre)
      `)
      .in('compra_id', compraIds);

    if (error) throw error;

    console.log('Datos crudos de detallecompra:', data);
    console.log('Compras del período:', comprasData);

    // Crear un mapa de compra_id a fecha
    const comprasFechas = {};
    comprasData.forEach(compra => {
      comprasFechas[compra.id] = new Date(compra.fecha);
    });

    // Agrupar por producto y calcular periodicidad
    const productosPorId = {};
    
    data?.forEach(detalle => {
      const productoId = detalle.productos?.id;
      const productoNombre = detalle.productos?.nombre || 'Sin nombre';
      const fecha = comprasFechas[detalle.compra_id];
      const cantidad = detalle.cantidad || 0;
      
      if (!fecha) return; // Si no encontramos la fecha, saltar

      if (!productosPorId[productoId]) {
        productosPorId[productoId] = {
          nombre: productoNombre,
          compras: []
        };
      }

      productosPorId[productoId].compras.push({
        fecha,
        cantidad
      });
    });

    // Calcular consumo diario promedio y periodicidad para cada producto
    const resultados = Object.values(productosPorId).map(producto => {
      // Ordenar compras por fecha
      producto.compras.sort((a, b) => a.fecha - b.fecha);

      let consumoDiarioTotal = 0;
      let intervalosContados = 0;

      // Calcular consumo entre cada par de compras
      for (let i = 0; i < producto.compras.length - 1; i++) {
        const compraActual = producto.compras[i];
        const compraSiguiente = producto.compras[i + 1];
        
        const diasEntreMedio = Math.ceil((compraSiguiente.fecha - compraActual.fecha) / (1000 * 60 * 60 * 24));
        
        if (diasEntreMedio > 0) {
          // El consumo en ese período fue la cantidad comprada en la compra actual
          const consumoDiario = compraActual.cantidad / diasEntreMedio;
          consumoDiarioTotal += consumoDiario;
          intervalosContados++;
        }
      }

      // Calcular consumo diario promedio
      const consumoDiarioPromedio = intervalosContados > 0 
        ? consumoDiarioTotal / intervalosContados 
        : 0;

      // Calcular cantidad promedio por compra
      const cantidadPromedioPorCompra = producto.compras.reduce((sum, c) => sum + c.cantidad, 0) / producto.compras.length;

      // Calcular días de cobertura (periodicidad)
      const diasCobertura = consumoDiarioPromedio > 0 
        ? Math.round(cantidadPromedioPorCompra / consumoDiarioPromedio)
        : 0;

      // Última compra
      const ultimaCompra = producto.compras[producto.compras.length - 1];
      const diasDesdeUltimaCompra = Math.ceil((new Date() - ultimaCompra.fecha) / (1000 * 60 * 60 * 24));

      // Determinar si necesita reposición
      const necesitaReposicion = diasDesdeUltimaCompra > diasCobertura;

      return {
        nombre: producto.nombre,
        cantidadCompras: producto.compras.length,
        consumoDiarioPromedio: Math.round(consumoDiarioPromedio * 100) / 100,
        cantidadPromedioPorCompra: Math.round(cantidadPromedioPorCompra),
        diasCobertura,
        ultimaCompra: ultimaCompra.fecha,
        diasDesdeUltimaCompra,
        necesitaReposicion
      };
    });

    // Ordenar por días de cobertura (menor a mayor = más frecuente)
    return resultados
      .filter(r => r.cantidadCompras > 1 && r.diasCobertura > 0) // Solo productos con más de 1 compra
      .sort((a, b) => a.diasCobertura - b.diasCobertura);
  };

  const formatearMoneda = (valor) => {
    const numero = parseFloat(valor) || 0;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numero);
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Cargando dashboard...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <h4>Error en el Dashboard</h4>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={cargarDatos}>
            Reintentar
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <div className="dashboard-container w-100">
      {/* Header */}
      <div style={{ padding: '20px 20px 0 20px' }}>
        <Row className="mb-4">
          <Col xs={12}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-1">📊 Dashboard de Compras</h2>
                <p className="text-muted mb-0">Análisis y métricas de tu sistema de gestión</p>
              </div>
              <div className="d-flex gap-2">
                <Form.Select 
                  size="sm" 
                  value={filtroFecha} 
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="7">Últimos 7 días</option>
                  <option value="30">Últimos 30 días</option>
                  <option value="90">Últimos 90 días</option>
                  <option value="365">Último año</option>
                </Form.Select>
                <Button variant="outline-primary" size="sm" onClick={cargarDatos}>
                  🔄 Actualizar
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* KPIs */}
      <div className="dashboard-grid">
        <Card className="text-center h-100 border-0 shadow-sm">
          <Card.Body>
            <div className="text-primary mb-2">
              <i className="bi bi-currency-dollar" style={{ fontSize: '2rem' }}></i>
            </div>
            <h4 className="text-primary">{formatearMoneda(data.kpis.totalCompras)}</h4>
            <p className="text-muted mb-0">Total en Compras</p>
          </Card.Body>
        </Card>
        <Card className="text-center h-100 border-0 shadow-sm">
          <Card.Body>
            <div className="text-success mb-2">
              <i className="bi bi-cart-check" style={{ fontSize: '2rem' }}></i>
            </div>
            <h4 className="text-success">{data.kpis.cantidadCompras}</h4>
            <p className="text-muted mb-0">Compras Realizadas</p>
          </Card.Body>
        </Card>
        <Card className="text-center h-100 border-0 shadow-sm">
          <Card.Body>
            <div className="text-warning mb-2">
              <i className="bi bi-graph-up" style={{ fontSize: '2rem' }}></i>
            </div>
            <h4 className="text-warning">{formatearMoneda(data.kpis.promedioCompra)}</h4>
            <p className="text-muted mb-0">Promedio por Compra</p>
          </Card.Body>
        </Card>
        <Card className="text-center h-100 border-0 shadow-sm">
          <Card.Body>
            <div className="text-info mb-2">
              <i className="bi bi-box-seam" style={{ fontSize: '2rem' }}></i>
            </div>
            <h4 className="text-info">{data.kpis.productosUnicos}</h4>
            <p className="text-muted mb-0">Productos Únicos</p>
          </Card.Body>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="dashboard-charts">
        {/* Productos más comprados */}
        <Card className="h-100 border-0 shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">🏆 Productos Más Comprados</h5>
          </Card.Header>
          <Card.Body style={{ minHeight: '350px', position: 'relative' }}>
            {data.productosMasComprados.length > 0 ? (
              <div style={{ width: '100%', height: '300px', display: 'block', position: 'relative' }}>
                <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.productosMasComprados}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="nombre" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'cantidad' ? `${value} unidades` : formatearMoneda(value),
                      name === 'cantidad' ? 'Cantidad' : 'Monto'
                    ]}
                  />
                  <Bar dataKey="cantidad" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-5">
                <p className="text-muted">No hay datos de productos comprados en el período seleccionado</p>
              </div>
            )}
            </Card.Body>
        </Card>

        {/* Distribución de gastos */}
        <Card className="h-100 border-0 shadow-sm">
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0">🥧 Distribución de Gastos</h5>
          </Card.Header>
          <Card.Body style={{ minHeight: '350px', position: 'relative' }}>
            {data.distribucionGastos.length > 0 ? (
              <div style={{ width: '100%', height: '300px', display: 'block', position: 'relative' }}>
                <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.distribucionGastos}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ nombre, percent }) => `${nombre} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="valor"
                  >
                    {data.distribucionGastos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatearMoneda(value)} />
                </PieChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-5">
                <p className="text-muted">No hay datos de distribución de gastos en el período seleccionado</p>
              </div>
            )}
            </Card.Body>
        </Card>
      </div>

      {/* Compras por Proveedor */}
      <div className="dashboard-trend">
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">🏢 Compras por Proveedor</h5>
            </Card.Header>
            <Card.Body>
              {data.tendenciaCompras.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Proveedor</th>
                        <th className="text-center">Cantidad de Compras</th>
                        <th className="text-end">Total Comprado</th>
                        <th className="text-end">Promedio por Compra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.tendenciaCompras.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <strong>{item.proveedor}</strong>
                          </td>
                          <td className="text-center">
                            <Badge bg="primary">{item.cantidadCompras}</Badge>
                          </td>
                          <td className="text-end fw-bold text-success">
                            {formatearMoneda(item.totalComprado || 0)}
                          </td>
                          <td className="text-end text-muted">
                            {formatearMoneda((item.totalComprado || 0) / (item.cantidadCompras || 1))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-active">
                        <td><strong>TOTAL</strong></td>
                        <td className="text-center">
                          <strong>{data.tendenciaCompras.reduce((sum, item) => sum + (item.cantidadCompras || 0), 0)}</strong>
                        </td>
                        <td className="text-end">
                          <strong className="text-success">
                            {formatearMoneda(data.tendenciaCompras.reduce((sum, item) => sum + (item.totalComprado || 0), 0))}
                          </strong>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted">No hay datos de compras por proveedor en el período seleccionado</p>
                </div>
              )}
            </Card.Body>
          </Card>
      </div>

      {/* Periodicidad y Consumo de Productos */}
      <div className="dashboard-table">
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">⏱️ Periodicidad de Compra por Producto</h5>
              <small>Cada cuántos días compramos cada producto según consumo histórico</small>
            </Card.Header>
            <Card.Body>
              {data.comprasRecientes.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th className="text-center">Compras<br/>Realizadas</th>
                        <th className="text-center">Consumo<br/>Diario Prom.</th>
                        <th className="text-center">Cant. Prom.<br/>por Compra</th>
                        <th className="text-center">Días de<br/>Cobertura</th>
                        <th className="text-center">Última<br/>Compra</th>
                        <th className="text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.comprasRecientes.map((item, index) => (
                        <tr key={index} className={item.necesitaReposicion ? 'table-warning' : ''}>
                          <td>
                            <strong>{item.nombre}</strong>
                          </td>
                          <td className="text-center">
                            <Badge bg="info">{item.cantidadCompras}</Badge>
                          </td>
                          <td className="text-center">
                            {item.consumoDiarioPromedio} u/día
                          </td>
                          <td className="text-center">
                            <strong>{item.cantidadPromedioPorCompra}</strong> unidades
                          </td>
                          <td className="text-center">
                            <Badge bg="primary" className="fs-6">
                              {item.diasCobertura} días
                            </Badge>
                          </td>
                          <td className="text-center text-muted">
                            Hace {item.diasDesdeUltimaCompra} días
                          </td>
                          <td className="text-center">
                            {item.necesitaReposicion ? (
                              <Badge bg="danger">⚠️ Revisar</Badge>
                            ) : (
                              <Badge bg="success">✓ OK</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 p-3 bg-light rounded">
                    <small className="text-muted">
                      <strong>💡 Cómo leer esta tabla:</strong><br/>
                      • <strong>Días de Cobertura:</strong> Cada cuántos días necesitas comprar este producto.<br/>
                      • <strong>Estado "Revisar":</strong> Han pasado más días desde la última compra que lo que dura normalmente.
                    </small>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted">No hay suficientes datos para calcular periodicidad. Se necesitan al menos 2 compras de cada producto.</p>
                </div>
              )}
            </Card.Body>
          </Card>
      </div>
    </div>
    </>
  );
}

export default Dashboard;
