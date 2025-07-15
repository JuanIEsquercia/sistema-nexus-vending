import { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Table, Badge, Spinner } from 'react-bootstrap';
import { useComprasOptimized, useProductosSimple, useProveedoresSimple } from '../../hooks/useSupabaseOptimized';
import { supabase } from '../../lib/supabase';
import PaginationLoader from '../common/PaginationLoader';

function RegistroComprasOptimized() {
  // Hooks simples para formularios (carga completa con caché)
  const { productos, loading: loadingProductos } = useProductosSimple();
  const { proveedores, loading: loadingProveedores } = useProveedoresSimple();
  const { 
    compras, 
    loading: loadingCompras, 
    error, 
    setError, 
    crearCompra, 
    eliminarCompra,
    cargarMas,
    hasMore,
    totalCount
  } = useComprasOptimized(8); // 8 compras por página

  const [compra, setCompra] = useState({
    proveedor: '',
    numeroFactura: '',
    fecha: new Date().toISOString().split('T')[0],
    detalles: [{ producto: '', cantidad: '', precioTotal: '' }]
  });

  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [guardando, setGuardando] = useState(false);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
  };

  const agregarDetalle = () => {
    setCompra(prev => {
      const nuevosDetalles = [...prev.detalles, { producto: '', cantidad: '', precioTotal: '' }];
      return {
        ...prev,
        detalles: nuevosDetalles
      };
    });
  };

  const eliminarDetalle = (index) => {
    if (compra.detalles.length > 1) {
      setCompra(prev => ({
        ...prev,
        detalles: prev.detalles.filter((_, i) => i !== index)
      }));
    }
  };

  const actualizarDetalle = (index, campo, valor) => {
    setCompra(prev => ({
      ...prev,
      detalles: prev.detalles.map((detalle, i) =>
        i === index ? { ...detalle, [campo]: valor } : detalle
      )
    }));
  };

  // Calcular costo unitario: Precio Total ÷ Cantidad
  const calcularCostoUnitario = (detalle) => {
    const precioTotal = parseFloat(detalle.precioTotal) || 0;
    const cantidad = parseFloat(detalle.cantidad) || 0;
    return cantidad > 0 ? precioTotal / cantidad : 0;
  };

  const calcularSubtotal = (detalle) => parseFloat(detalle.precioTotal) || 0;

  const calcularTotal = () => {
    return compra.detalles.reduce((total, detalle) => total + calcularSubtotal(detalle), 0);
  };

  const calcularPrecioVenta = (productoId, costoUnitario) => {
    const producto = productos.find(p => p.id === parseInt(productoId));
    if (producto && costoUnitario > 0) {
      return (costoUnitario * producto.multiplicador_precio).toFixed(2);
    }
    return '0.00';
  };

  const eliminarCompraHandler = async (compraId) => {
    if (!window.confirm('⚠️ ¿Estás seguro de eliminar esta compra?\n\nEsto revertirá automáticamente el stock que se había agregado.')) {
      return;
    }

    try {
      await eliminarCompra(compraId);
      mostrarMensaje('success', '✅ Compra eliminada exitosamente. Stock revertido automáticamente.');
    } catch (error) {
      console.error('Error eliminando compra:', error);
      mostrarMensaje('danger', `❌ Error: ${error.message}`);
    }
  };

  const validarFormulario = () => {
    if (!compra.proveedor) {
      mostrarMensaje('danger', 'Debe seleccionar un proveedor');
      return false;
    }

    if (!compra.numeroFactura.trim()) {
      mostrarMensaje('danger', 'Debe ingresar el número de factura');
      return false;
    }

    // Verificar que no exista una factura con el mismo número (solo en los datos cargados)
    const facturaExiste = compras.some(c => c.numero_factura === compra.numeroFactura.trim());
    if (facturaExiste) {
      mostrarMensaje('danger', 'Ya existe una compra con ese número de factura en los registros cargados');
      return false;
    }

    // Validar detalles
    for (let i = 0; i < compra.detalles.length; i++) {
      const detalle = compra.detalles[i];
      if (!detalle.producto || !detalle.cantidad || !detalle.precioTotal) {
        mostrarMensaje('danger', `Complete todos los campos del producto ${i + 1}`);
        return false;
      }
      if (parseFloat(detalle.cantidad) <= 0) {
        mostrarMensaje('danger', `La cantidad del producto ${i + 1} debe ser mayor a 0`);
        return false;
      }
      if (parseFloat(detalle.precioTotal) <= 0) {
        mostrarMensaje('danger', `El precio total del producto ${i + 1} debe ser mayor a 0`);
        return false;
      }
    }

    return true;
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const compraData = {
        proveedor_id: parseInt(compra.proveedor),
        numero_factura: compra.numeroFactura.trim(),
        fecha: compra.fecha,
        total: calcularTotal()
      };

      const detallesData = compra.detalles.map(detalle => ({
        producto_id: parseInt(detalle.producto),
        cantidad: parseInt(detalle.cantidad),
        precio_total: parseFloat(detalle.precioTotal),
        costo_unitario: calcularCostoUnitario(detalle)
      }));

      await crearCompra(compraData, detallesData);
      mostrarMensaje('success', `✅ Compra registrada exitosamente. Total: $${calcularTotal().toFixed(2)}`);
      
      // Limpiar formulario
      setCompra({
        proveedor: '',
        numeroFactura: '',
        fecha: new Date().toISOString().split('T')[0],
        detalles: [{ producto: '', cantidad: '', precioTotal: '' }]
      });
    } catch (error) {
      if (error.message.includes('duplicate key')) {
        mostrarMensaje('danger', 'Ya existe una compra con ese número de factura');
      } else {
        mostrarMensaje('danger', `❌ Error: ${error.message}`);
      }
    } finally {
      setGuardando(false);
    }
  };

  const loading = loadingProductos || loadingProveedores;

  return (
    <Container fluid className="component-container py-4 fade-in">
      <div className="component-content">
        {/* Header */}
        <div className="component-header">
          <h1 className="display-6 fw-bold text-primary mb-3">📦 Registro de Compras (Optimizado)</h1>
          <p className="lead text-muted">Registra las compras con cálculo automático de costo unitario</p>
        </div>

        {/* Mensaje de Alert */}
        {(mensaje.texto || error) && (
          <Alert variant={mensaje.tipo || 'danger'} className="mx-2 mx-lg-0 mb-4">
            {mensaje.texto || error}
          </Alert>
        )}

        <Row>
          {/* Formulario de nueva compra */}
          <Col lg={6} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-plus-circle me-2"></i>
                  Nueva Compra
                </h5>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" />
                    <p className="mt-2">Cargando datos...</p>
                  </div>
                ) : (
                  <Form onSubmit={manejarSubmit}>
                    {/* Proveedor */}
                    <Form.Group className="mb-3">
                      <Form.Label>Proveedor *</Form.Label>
                      <Form.Select
                        id="proveedor-select-optimized"
                        name="proveedor"
                        value={compra.proveedor}
                        onChange={(e) => setCompra(prev => ({ ...prev, proveedor: e.target.value }))}
                        required
                      >
                        <option value="">Selecciona un proveedor</option>
                        {proveedores.map(proveedor => (
                          <option key={proveedor.id} value={proveedor.id}>
                            {proveedor.nombre}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    {/* Número de factura y fecha */}
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Número de Factura *</Form.Label>
                          <Form.Control
                            id="numero-factura-input-optimized"
                            name="numeroFactura"
                            type="text"
                            value={compra.numeroFactura}
                            onChange={(e) => setCompra(prev => ({ ...prev, numeroFactura: e.target.value }))}
                            placeholder="Ej: F-001-001"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Fecha *</Form.Label>
                          <Form.Control
                            id="fecha-compra-input-optimized"
                            name="fecha"
                            type="date"
                            value={compra.fecha}
                            onChange={(e) => setCompra(prev => ({ ...prev, fecha: e.target.value }))}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Detalles de productos */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="text-info mb-0">📋 Detalles de Productos</h6>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={agregarDetalle}
                        disabled={guardando}
                        type="button"
                      >
                        ➕ Agregar Producto ({compra.detalles.length})
                      </Button>
                    </div>

                    <div className="table-responsive">
                      <Table className="mb-0" size="sm">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th className="text-center">Cantidad</th>
                            <th className="text-center">Precio Total</th>
                            <th className="text-center">Costo Unit.</th>
                            <th className="text-center">Precio Venta</th>
                            <th className="text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {compra.detalles.map((detalle, index) => {
                            const costoUnitario = calcularCostoUnitario(detalle);
                            
                            return (
                              <tr key={index}>
                                <td>
                                  <Form.Select
                                    id={`producto-select-optimized-${index}`}
                                    name={`producto-${index}`}
                                    value={detalle.producto}
                                    onChange={(e) => actualizarDetalle(index, 'producto', e.target.value)}
                                    size="sm"
                                    required
                                    disabled={guardando}
                                  >
                                    <option value="">Seleccionar...</option>
                                    {productos.map(producto => (
                                      <option key={producto.id} value={producto.id}>
                                        {producto.nombre}
                                      </option>
                                    ))}
                                  </Form.Select>
                                </td>
                                <td>
                                  <Form.Control
                                    id={`cantidad-input-optimized-${index}`}
                                    name={`cantidad-${index}`}
                                    type="number"
                                    min="1"
                                    value={detalle.cantidad}
                                    onChange={(e) => actualizarDetalle(index, 'cantidad', e.target.value)}
                                    size="sm"
                                    className="text-center"
                                    placeholder="56"
                                    required
                                    disabled={guardando}
                                  />
                                </td>
                                <td>
                                  <Form.Control
                                    id={`precio-total-input-optimized-${index}`}
                                    name={`precioTotal-${index}`}
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={detalle.precioTotal}
                                    onChange={(e) => actualizarDetalle(index, 'precioTotal', e.target.value)}
                                    size="sm"
                                    className="text-center"
                                    placeholder="280.00"
                                    required
                                    disabled={guardando}
                                  />
                                </td>
                                <td className="text-center">
                                  <Badge bg="info" className="fs-6">
                                    ${costoUnitario.toFixed(2)}
                                  </Badge>
                                </td>
                                <td className="text-center">
                                  <Badge bg="success">
                                    ${calcularPrecioVenta(detalle.producto, costoUnitario)}
                                  </Badge>
                                </td>
                                <td className="text-center">
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => eliminarDetalle(index)}
                                    disabled={compra.detalles.length === 1 || guardando}
                                    title="Eliminar producto"
                                    type="button"
                                  >
                                    🗑️
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                    
                    {/* Ejemplo explicativo */}
                    <div className="mt-3">
                      <small className="text-muted">
                        <strong>💡 Ejemplo:</strong> Si compras 56 alfajores por $280 total → 
                        Costo unitario: $280 ÷ 56 = $5.00 por alfajor
                      </small>
                    </div>

                    {/* Total */}
                    <div className="bg-primary text-white p-3 rounded mb-3">
                      <h5 className="mb-0">Total: ${calcularTotal().toFixed(2)}</h5>
                    </div>

                    {/* Botón submit */}
                    <Button
                      type="submit"
                      variant="success"
                      disabled={guardando || loading}
                      className="w-100"
                    >
                      {guardando ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Registrando...
                        </>
                      ) : (
                        'Registrar Compra'
                      )}
                    </Button>
                  </Form>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Historial de compras con paginación */}
          <Col lg={6} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-clock-history me-2"></i>
                  Historial de Compras
                </h5>
                <Badge bg="light" text="dark">{totalCount} total</Badge>
              </Card.Header>
              <Card.Body className="p-0">
                {loadingCompras && compras.length === 0 ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" />
                    <p className="mt-2">Cargando compras...</p>
                  </div>
                ) : compras.length === 0 ? (
                  <div className="text-center p-4 text-muted">
                    <i className="bi bi-inbox" style={{ fontSize: '2rem' }}></i>
                    <p className="mt-2">No hay compras registradas</p>
                  </div>
                ) : (
                  <>
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      <Table striped hover responsive className="mb-0">
                        <thead className="bg-light sticky-top">
                          <tr>
                            <th>Fecha</th>
                            <th>Factura</th>
                            <th>Proveedor</th>
                            <th>Total</th>
                            <th width="80">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {compras.map(compra => (
                            <tr key={compra.id}>
                              <td>{new Date(compra.fecha).toLocaleDateString()}</td>
                              <td>
                                <code>{compra.numero_factura}</code>
                              </td>
                              <td>{compra.proveedores?.nombre}</td>
                              <td>
                                <Badge bg="success">${compra.total.toFixed(2)}</Badge>
                              </td>
                              <td>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => eliminarCompraHandler(compra.id)}
                                  title="Eliminar compra"
                                >
                                  🗑️
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    {/* Paginación */}
                    <PaginationLoader
                      loading={loadingCompras}
                      hasMore={hasMore}
                      onLoadMore={cargarMas}
                      currentCount={compras.length}
                      totalCount={totalCount}
                      itemName="compras"
                      autoLoad={false}
                    />
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </Container>
  );
}

export default RegistroComprasOptimized; 