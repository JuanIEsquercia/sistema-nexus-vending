import { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Table, Badge, Spinner } from 'react-bootstrap';
import { useCompras, useProductos, useProveedores, useExportDetallesCompra } from '../../hooks/useSupabase';
import { supabase } from '../../lib/supabase';
import ExportCSVButton from '../common/ExportCSVButton';

function RegistroCompras() {
  const { productos, loading: loadingProductos } = useProductos();
  const { proveedores, loading: loadingProveedores } = useProveedores();
  const { compras, loading: loadingCompras, error, setError, crearCompra, recargar: recargarCompras } = useCompras();
  const { exportarTodosLosDetallesCompra } = useExportDetallesCompra();

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
    setCompra(prev => ({
      ...prev,
      detalles: [...prev.detalles, { producto: '', cantidad: '', precioTotal: '' }]
    }));
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
    if (cantidad > 0) {
      return precioTotal / cantidad;
    }
    return 0;
  };

  // El subtotal es directamente el precio total del producto
  const calcularSubtotal = (detalle) => {
    return parseFloat(detalle.precioTotal) || 0;
  };

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

  const eliminarCompra = async (compraId) => {
    if (!window.confirm('⚠️ ¿Estás seguro de eliminar esta compra?\n\nEsto revertirá automáticamente el stock que se había agregado.')) {
      return;
    }

    try {
      // Eliminar la compra (los detalles se eliminan automáticamente por CASCADE)
      const { error } = await supabase
        .from('compras')
        .delete()
        .eq('id', compraId);

      if (error) throw error;

      mostrarMensaje('success', '✅ Compra eliminada exitosamente. Stock revertido automáticamente.');
      
      // Recargar la lista
      await recargarCompras();
      
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

    // Verificar que no exista una factura con el mismo número
    const facturaExiste = compras.some(c => c.numero_factura === compra.numeroFactura.trim());
    if (facturaExiste) {
      mostrarMensaje('danger', 'Ya existe una compra con ese número de factura');
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
      mostrarMensaje('success', `Compra registrada exitosamente. Total: $${calcularTotal().toFixed(2)}`);
      
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
        mostrarMensaje('danger', `Error: ${error.message}`);
      }
    } finally {
      setGuardando(false);
    }
  };

  const loading = loadingProductos || loadingProveedores || loadingCompras;

  return (
    <Container fluid className="component-container py-4 fade-in">
      <div className="component-content">
        {/* Header */}
        <div className="component-header">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h1 className="display-6 fw-bold text-primary mb-0">📦 Registro de Compras</h1>
              <p className="lead text-muted mb-0">Registra las compras con cálculo automático de costo unitario</p>
            </div>
            <ExportCSVButton
              tipo="detalles"
              onExport={exportarTodosLosDetallesCompra}
              variant="outline-success"
              size="md"
              className="ms-3"
            />
          </div>
        </div>

        {/* Mensaje de Alert */}
        {(mensaje.texto || error) && (
          <Alert variant={mensaje.tipo || 'danger'} className="mx-2 mx-lg-0 mb-4">
            <strong>{(mensaje.tipo === 'success' || !mensaje.texto) ? '✅ Éxito:' : '⚠️ Error:'}</strong> 
            {mensaje.texto || error}
          </Alert>
        )}

        <div className="component-grid">
          <Row className="g-4">
            {/* Formulario de Registro */}
            <Col xs={12}>
              <Card className="form-card">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">➕ Nueva Compra</h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={manejarSubmit}>
                    {/* Información General */}
                    <Row className="g-3 mb-4">
                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>Proveedor</Form.Label>
                          <Form.Select
                            id="proveedor-select"
                            name="proveedor"
                            value={compra.proveedor}
                            onChange={(e) => setCompra({...compra, proveedor: e.target.value})}
                            required
                            disabled={loading || guardando}
                          >
                            <option value="">Seleccionar proveedor...</option>
                            {proveedores.map(proveedor => (
                              <option key={proveedor.id} value={proveedor.id}>
                                {proveedor.nombre}
                              </option>
                            ))}
                          </Form.Select>
                          {loadingProveedores && (
                            <Form.Text className="text-muted">Cargando proveedores...</Form.Text>
                          )}
                        </Form.Group>
                      </Col>

                      <Col xs={12} md={3}>
                        <Form.Group>
                          <Form.Label>Número de Factura</Form.Label>
                          <Form.Control
                            id="numero-factura-input"
                            name="numeroFactura"
                            type="text"
                            placeholder="FAC-001"
                            value={compra.numeroFactura}
                            onChange={(e) => setCompra({...compra, numeroFactura: e.target.value})}
                            required
                            disabled={guardando}
                          />
                        </Form.Group>
                      </Col>

                      <Col xs={12} md={3}>
                        <Form.Group>
                          <Form.Label>Fecha</Form.Label>
                          <Form.Control
                            id="fecha-compra-input"
                            name="fecha"
                            type="date"
                            value={compra.fecha}
                            onChange={(e) => setCompra({...compra, fecha: e.target.value})}
                            required
                            disabled={guardando}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Detalles de Productos */}
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="text-info mb-0">📋 Detalles de Productos</h6>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          onClick={agregarDetalle}
                          disabled={guardando}
                        >
                          ➕ Agregar Producto
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
                                      id={`producto-select-${index}`}
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
                                      id={`cantidad-input-${index}`}
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
                                      id={`precio-total-input-${index}`}
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
                    </div>

                    {/* Total */}
                    <Row className="mb-4">
                      <Col xs={12}>
                        <Card className="bg-light border-0">
                          <Card.Body className="py-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <h5 className="text-info mb-0">💰 Total de la Compra:</h5>
                              <h4 className="text-success mb-0 fw-bold">${calcularTotal().toFixed(2)}</h4>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    {/* Botón de Envío */}
                    <Row>
                      <Col xs={12}>
                        <div className="d-grid">
                          <Button 
                            variant="primary" 
                            type="submit" 
                            size="lg"
                            disabled={guardando || loadingProductos || loadingProveedores}
                          >
                            {guardando ? (
                              <>
                                <Spinner size="sm" className="me-2" />
                                Registrando Compra...
                              </>
                            ) : (
                              '💾 Registrar Compra'
                            )}
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Historial de Compras - Sección separada */}
            <Col xs={12}>
              <Card className="list-card">
                <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center flex-wrap">
                  <h5 className="mb-0">📋 Historial de Compras Recientes</h5>
                  <Badge bg="light" text="info">
                    {loadingCompras ? '⏳' : `Total: ${compras.length} compras`}
                  </Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  {loadingCompras ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="text-muted mt-3">Cargando compras...</p>
                    </div>
                  ) : compras.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="display-1 text-muted mb-3">📦</div>
                      <h5 className="text-muted">No hay compras registradas</h5>
                      <p className="text-muted mb-0">Registra tu primera compra usando el formulario superior</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead>
                          <tr>
                            <th>Factura</th>
                            <th>Proveedor</th>
                            <th>Fecha</th>
                            <th className="text-center">Productos</th>
                            <th className="text-center">Total</th>
                            <th className="text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {compras.slice(-15).reverse().map((compra) => (
                            <tr key={compra.id}>
                              <td>
                                <div className="fw-medium text-primary">{compra.numero_factura}</div>
                              </td>
                              <td>
                                <div className="fw-semibold">
                                  {compra.proveedores ? compra.proveedores.nombre : 'N/A'}
                                </div>
                              </td>
                              <td>
                                <div className="text-muted">{compra.fecha}</div>
                              </td>
                              <td className="text-center">
                                <Badge bg="secondary">
                                  {compra.detallecompra ? compra.detallecompra.length : 0} producto{compra.detallecompra && compra.detallecompra.length !== 1 ? 's' : ''}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Badge bg="success" className="fs-6">
                                  ${parseFloat(compra.total).toFixed(2)}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => eliminarCompra(compra.id)}
                                  title="Eliminar compra (revierte stock automáticamente)"
                                >
                                  🗑️ Eliminar
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </Container>
  );
}

export default RegistroCompras;