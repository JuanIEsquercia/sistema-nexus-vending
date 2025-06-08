import { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Table, Badge, Spinner } from 'react-bootstrap';
import { useProductos, useStock, useCargasMaquina } from '../../hooks/useSupabase';

function CargaProductosMaquina() {
  const { productos, loading: loadingProductos } = useProductos();
  const { stock, loading: loadingStock, actualizarStock } = useStock();
  const { cargas, loading: loadingCargas, error, setError, crearCargaMaquina } = useCargasMaquina();

  const [nuevaCarga, setNuevaCarga] = useState({
    producto: '',
    cantidad: '',
    fechaCarga: new Date().toISOString().split('T')[0],
    responsable: ''
  });

  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [guardando, setGuardando] = useState(false);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
  };

  const obtenerStockProducto = (productoId) => {
    const stockItem = stock.find(s => s.producto_id === parseInt(productoId));
    return stockItem ? stockItem.cantidad : 0;
  };

  const obtenerCostoUnitario = (productoId) => {
    const stockItem = stock.find(s => s.producto_id === parseInt(productoId));
    return stockItem ? stockItem.costo_unitario : 0;
  };

  const calcularPrecioVenta = (productoId) => {
    const producto = productos.find(p => p.id === parseInt(productoId));
    const costoUnitario = obtenerCostoUnitario(productoId);
    
    if (producto && costoUnitario > 0) {
      return (costoUnitario * producto.multiplicador_precio).toFixed(2);
    }
    return '0.00';
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (!nuevaCarga.producto || !nuevaCarga.cantidad || !nuevaCarga.responsable.trim()) {
      mostrarMensaje('danger', 'Por favor complete todos los campos');
      return;
    }

    const cantidadCarga = parseInt(nuevaCarga.cantidad);
    if (cantidadCarga <= 0) {
      mostrarMensaje('danger', 'La cantidad debe ser mayor a 0');
      return;
    }

    const stockActual = obtenerStockProducto(nuevaCarga.producto);
    if (cantidadCarga > stockActual) {
      mostrarMensaje('danger', `No hay suficiente stock. Disponible: ${stockActual} unidades`);
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      // Crear registro de carga
      const cargaData = {
        producto_id: parseInt(nuevaCarga.producto),
        cantidad: cantidadCarga,
        fecha_carga: nuevaCarga.fechaCarga,
        responsable: nuevaCarga.responsable.trim()
      };

      await crearCargaMaquina(cargaData);

      // Actualizar stock (restar la cantidad cargada)
      const nuevaCantidadStock = stockActual - cantidadCarga;
      const costoUnitario = obtenerCostoUnitario(nuevaCarga.producto);
      await actualizarStock(parseInt(nuevaCarga.producto), nuevaCantidadStock, costoUnitario);

      mostrarMensaje('success', `Carga registrada exitosamente. Stock actualizado: ${nuevaCantidadStock} unidades`);
      
      // Limpiar formulario
      setNuevaCarga({
        producto: '',
        cantidad: '',
        fechaCarga: new Date().toISOString().split('T')[0],
        responsable: ''
      });
    } catch (error) {
      mostrarMensaje('danger', `Error: ${error.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const loading = loadingProductos || loadingStock || loadingCargas;

  return (
    <Container fluid className="component-container py-4 fade-in">
      <div className="component-content">
        {/* Header */}
        <div className="component-header">
          <h1 className="display-6 fw-bold text-primary mb-3">🔄 Carga de Productos en Máquinas</h1>
          <p className="lead text-muted">Registra los productos cargados en las máquinas vending</p>
        </div>

        {/* Mensaje de Alert */}
        {(mensaje.texto || error) && (
          <Alert variant={mensaje.tipo || 'danger'} className="mx-2 mx-lg-0 mb-4">
            <strong>{(mensaje.tipo === 'success' || !mensaje.texto) ? '✅ Éxito:' : '⚠️ Error:'}</strong> 
            {mensaje.texto || error}
          </Alert>
        )}

        <div className="component-grid">
          <Row className="g-4 h-100">
            {/* Formulario de Carga */}
            <Col xs={12} lg={6} className="d-flex">
              <Card className="form-card w-100">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">➕ Nueva Carga</h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={manejarSubmit}>
                    <Row className="g-3">
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Producto</Form.Label>
                          <Form.Select
                            value={nuevaCarga.producto}
                            onChange={(e) => setNuevaCarga({...nuevaCarga, producto: e.target.value})}
                            required
                            disabled={loading || guardando}
                          >
                            <option value="">Seleccionar producto...</option>
                            {productos.map(producto => {
                              const stockActual = obtenerStockProducto(producto.id);
                              return (
                                <option key={producto.id} value={producto.id}>
                                  {producto.nombre} (Stock: {stockActual})
                                </option>
                              );
                            })}
                          </Form.Select>
                          {loadingProductos && (
                            <Form.Text className="text-muted">Cargando productos...</Form.Text>
                          )}
                        </Form.Group>
                      </Col>

                      {/* Información del producto seleccionado */}
                      {nuevaCarga.producto && (
                        <Col xs={12}>
                          <Card className="bg-light border-0">
                            <Card.Body className="py-2">
                              <Row className="g-2 text-center">
                                <Col xs={4}>
                                  <div className="small text-muted">Stock Actual</div>
                                  <Badge bg={obtenerStockProducto(nuevaCarga.producto) > 0 ? 'success' : 'danger'} className="fs-6">
                                    {obtenerStockProducto(nuevaCarga.producto)} unidades
                                  </Badge>
                                </Col>
                                <Col xs={4}>
                                  <div className="small text-muted">Costo Unitario</div>
                                  <Badge bg="info" className="fs-6">
                                    ${obtenerCostoUnitario(nuevaCarga.producto).toFixed(2)}
                                  </Badge>
                                </Col>
                                <Col xs={4}>
                                  <div className="small text-muted">Precio Venta</div>
                                  <Badge bg="warning" className="fs-6">
                                    ${calcularPrecioVenta(nuevaCarga.producto)}
                                  </Badge>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        </Col>
                      )}

                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>Cantidad a Cargar</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            max={nuevaCarga.producto ? obtenerStockProducto(nuevaCarga.producto) : undefined}
                            placeholder="10"
                            value={nuevaCarga.cantidad}
                            onChange={(e) => setNuevaCarga({...nuevaCarga, cantidad: e.target.value})}
                            required
                            disabled={guardando}
                          />
                          {nuevaCarga.producto && (
                            <Form.Text className="text-muted">
                              Máximo disponible: {obtenerStockProducto(nuevaCarga.producto)} unidades
                            </Form.Text>
                          )}
                        </Form.Group>
                      </Col>

                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>Fecha de Carga</Form.Label>
                          <Form.Control
                            type="date"
                            value={nuevaCarga.fechaCarga}
                            onChange={(e) => setNuevaCarga({...nuevaCarga, fechaCarga: e.target.value})}
                            required
                            disabled={guardando}
                          />
                        </Form.Group>
                      </Col>

                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Responsable</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Nombre del encargado"
                            value={nuevaCarga.responsable}
                            onChange={(e) => setNuevaCarga({...nuevaCarga, responsable: e.target.value})}
                            required
                            disabled={guardando}
                          />
                        </Form.Group>
                      </Col>

                      <Col xs={12}>
                        <div className="d-grid">
                          <Button 
                            variant="primary" 
                            type="submit"
                            disabled={guardando || !nuevaCarga.producto || obtenerStockProducto(nuevaCarga.producto) === 0}
                          >
                            {guardando ? (
                              <>
                                <Spinner size="sm" className="me-2" />
                                Registrando...
                              </>
                            ) : (
                              '🔄 Registrar Carga'
                            )}
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Stock Actual */}
            <Col xs={12} lg={6} className="d-flex">
              <Card className="list-card w-100">
                <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center flex-wrap">
                  <h5 className="mb-0">📊 Stock Actual</h5>
                  <Badge bg="light" text="success">
                    {loadingStock ? '⏳' : `${stock.length} productos`}
                  </Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  {loadingStock ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="text-muted mt-3">Cargando stock...</p>
                    </div>
                  ) : stock.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="display-1 text-muted mb-3">📦</div>
                      <h5 className="text-muted">No hay stock disponible</h5>
                      <p className="text-muted mb-0">Registra compras para generar stock</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="mb-0" size="sm">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th className="text-center">Cantidad</th>
                            <th className="text-center">Costo Unit.</th>
                            <th className="text-center">Precio Venta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stock.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <div className="fw-semibold">
                                  {item.productos ? item.productos.nombre : 'N/A'}
                                </div>
                              </td>
                              <td className="text-center">
                                <Badge bg={item.cantidad > 10 ? 'success' : item.cantidad > 0 ? 'warning' : 'danger'}>
                                  {item.cantidad}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Badge bg="info" className="fs-6">
                                  ${parseFloat(item.costo_unitario || 0).toFixed(2)}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Badge bg="secondary" className="fs-6">
                                  ${item.productos && item.costo_unitario ? 
                                    (parseFloat(item.costo_unitario) * item.productos.multiplicador_precio).toFixed(2) : 
                                    '0.00'}
                                </Badge>
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

            {/* Historial de Cargas */}
            <Col xs={12} className="d-flex">
              <Card className="list-card w-100">
                <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center flex-wrap">
                  <h5 className="mb-0">📋 Historial de Cargas</h5>
                  <Badge bg="light" text="info">
                    {loadingCargas ? '⏳' : `Total: ${cargas.length}`}
                  </Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  {loadingCargas ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="text-muted mt-3">Cargando historial...</p>
                    </div>
                  ) : cargas.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="display-1 text-muted mb-3">🔄</div>
                      <h5 className="text-muted">No hay cargas registradas</h5>
                      <p className="text-muted mb-0">Registra tu primera carga de máquina</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead>
                          <tr>
                            <th className="d-none d-md-table-cell">Fecha</th>
                            <th>Producto</th>
                            <th className="text-center">Cantidad</th>
                            <th className="d-none d-lg-table-cell">Responsable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cargas.slice(-15).reverse().map((carga) => (
                            <tr key={carga.id}>
                              <td className="d-none d-md-table-cell">
                                <div className="fw-medium">{carga.fecha_carga}</div>
                              </td>
                              <td>
                                <div className="fw-semibold">
                                  {carga.productos ? carga.productos.nombre : 'N/A'}
                                </div>
                                <div className="small text-muted d-md-none">
                                  {carga.fecha_carga}
                                </div>
                                <div className="small text-muted d-lg-none">
                                  Por: {carga.responsable}
                                </div>
                              </td>
                              <td className="text-center">
                                <Badge bg="primary" className="fs-6">
                                  {carga.cantidad} unid.
                                </Badge>
                              </td>
                              <td className="d-none d-lg-table-cell">
                                <span className="text-muted">{carga.responsable}</span>
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

export default CargaProductosMaquina; 