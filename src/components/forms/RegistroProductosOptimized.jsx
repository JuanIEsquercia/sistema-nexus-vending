import { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Table, Badge, Spinner } from 'react-bootstrap';
import { useProductosSimple } from '../../hooks/useSupabaseOptimized';

function RegistroProductosOptimized() {
  const {
    productos,
    loading,
    error,
    setError,
    crearProducto,
    actualizarProducto,
    eliminarProducto
  } = useProductosSimple();

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    multiplicadorPrecio: ''
  });

  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const limpiarFormulario = () => {
    setNuevoProducto({ nombre: '', multiplicadorPrecio: '' });
    setEditandoId(null);
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
  };

  const calcularPrecioVenta = (costoBase, multiplicador) => {
    if (!costoBase || !multiplicador) return '0.00';
    return (parseFloat(costoBase) * parseFloat(multiplicador)).toFixed(2);
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    
    if (!nuevoProducto.nombre.trim() || !nuevoProducto.multiplicadorPrecio) {
      mostrarMensaje('danger', 'Por favor complete todos los campos');
      return;
    }

    if (parseFloat(nuevoProducto.multiplicadorPrecio) <= 0) {
      mostrarMensaje('danger', 'El multiplicador de precio debe ser mayor a 0');
      return;
    }

    try {
      setError(null);
      
      const productoData = {
        nombre: nuevoProducto.nombre.trim(),
        multiplicador_precio: parseFloat(nuevoProducto.multiplicadorPrecio)
      };

      if (editandoId) {
        await actualizarProducto(editandoId, productoData);
        mostrarMensaje('success', 'Producto actualizado exitosamente');
      } else {
        await crearProducto(productoData);
        mostrarMensaje('success', 'Producto registrado exitosamente');
      }

      limpiarFormulario();
    } catch (error) {
      if (error.message.includes('duplicate key')) {
        mostrarMensaje('danger', 'Ya existe un producto con ese nombre');
      } else {
        mostrarMensaje('danger', `Error: ${error.message}`);
      }
    }
  };

  const editarProducto = (producto) => {
    setNuevoProducto({
      nombre: producto.nombre,
      multiplicadorPrecio: producto.multiplicador_precio.toString()
    });
    setEditandoId(producto.id);
  };

  const confirmarEliminar = async (id, nombre) => {
    if (window.confirm(`¿Está seguro de eliminar el producto "${nombre}"?`)) {
      try {
        await eliminarProducto(id);
        mostrarMensaje('success', 'Producto eliminado exitosamente');
        if (editandoId === id) {
          limpiarFormulario();
        }
      } catch (error) {
        mostrarMensaje('danger', `Error al eliminar: ${error.message}`);
      }
    }
  };

  return (
    <Container fluid className="component-container py-4 fade-in">
      <div className="component-content">
        {/* Header */}
        <div className="component-header">
          <h1 className="display-6 fw-bold text-primary mb-3">🆕 Gestión de Productos (Optimizado)</h1>
          <p className="lead text-muted">Administra el catálogo de productos con multiplicadores de precio</p>
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
            {/* Formulario de Registro */}
            <Col xs={12} lg={5} className="d-flex">
              <Card className="form-card w-100">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">
                    {editandoId ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={manejarSubmit}>
                    <Row className="g-3">
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Nombre del Producto</Form.Label>
                          <Form.Control
                            id="nombre-producto-input-optimized"
                            name="nombre"
                            type="text"
                            placeholder="Ej: Coca Cola 500ml"
                            value={nuevoProducto.nombre}
                            onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                            required
                            disabled={loading}
                          />
                        </Form.Group>
                      </Col>

                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Multiplicador de Precio</Form.Label>
                          <Form.Control
                            id="multiplicador-precio-input-optimized"
                            name="multiplicadorPrecio"
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="1.8"
                            value={nuevoProducto.multiplicadorPrecio}
                            onChange={(e) => setNuevoProducto({...nuevoProducto, multiplicadorPrecio: e.target.value})}
                            required
                            disabled={loading}
                          />
                          <Form.Text className="text-muted">
                            Factor por el que se multiplica el costo para obtener el precio de venta
                          </Form.Text>
                        </Form.Group>
                      </Col>

                      {/* Ejemplo de cálculo */}
                      {nuevoProducto.multiplicadorPrecio && (
                        <Col xs={12}>
                          <Card className="bg-light border-0">
                            <Card.Body className="py-2">
                              <h6 className="text-info mb-2">💡 Ejemplo de Precios:</h6>
                              <div className="small">
                                <div>• Costo $5.00 → Venta: ${calcularPrecioVenta('5.00', nuevoProducto.multiplicadorPrecio)}</div>
                                <div>• Costo $10.00 → Venta: ${calcularPrecioVenta('10.00', nuevoProducto.multiplicadorPrecio)}</div>
                                <div>• Costo $15.00 → Venta: ${calcularPrecioVenta('15.00', nuevoProducto.multiplicadorPrecio)}</div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      )}

                      <Col xs={12}>
                        <div className="d-grid gap-2 d-md-flex">
                          <Button 
                            variant="primary" 
                            type="submit"
                            className="flex-md-fill"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Spinner size="sm" className="me-2" />
                                Guardando...
                              </>
                            ) : (
                              <>
                                {editandoId ? '💾 Actualizar' : '➕ Registrar'} Producto
                              </>
                            )}
                          </Button>
                          {editandoId && (
                            <Button 
                              variant="outline-primary" 
                              onClick={limpiarFormulario}
                              className="flex-md-fill"
                              disabled={loading}
                            >
                              ❌ Cancelar
                            </Button>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Lista de Productos */}
            <Col xs={12} lg={7} className="d-flex">
              <Card className="list-card w-100">
                <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center flex-wrap">
                  <h5 className="mb-0">📋 Productos Registrados</h5>
                  <Badge bg="light" text="info">
                    {loading ? '⏳' : `Total: ${productos.length}`}
                  </Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="text-muted mt-3">Cargando productos...</p>
                    </div>
                  ) : productos.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="display-1 text-muted mb-3">🆕</div>
                      <h5 className="text-muted">No hay productos registrados</h5>
                      <p className="text-muted mb-0">Agrega tu primer producto usando el formulario</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead>
                          <tr>
                            <th className="d-none d-md-table-cell">ID</th>
                            <th>Producto</th>
                            <th className="text-center">Multiplicador</th>
                            <th className="text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productos.map((producto) => (
                            <tr key={producto.id} className={editandoId === producto.id ? 'table-warning' : ''}>
                              <td className="d-none d-md-table-cell fw-medium">#{producto.id}</td>
                              <td>
                                <div className="fw-semibold">{producto.nombre}</div>
                                <div className="small text-muted d-md-none">ID: #{producto.id}</div>
                              </td>
                              <td className="text-center">
                                <Badge bg="success" className="fs-6">
                                  {producto.multiplicador_precio}x
                                </Badge>
                              </td>
                              <td>
                                <div className="d-flex justify-content-center gap-1 flex-wrap">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => editarProducto(producto)}
                                    title="Editar producto"
                                    disabled={loading}
                                  >
                                    <span className="d-none d-md-inline">✏️ Editar</span>
                                    <span className="d-md-none">✏️</span>
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => confirmarEliminar(producto.id, producto.nombre)}
                                    title="Eliminar producto"
                                    disabled={loading}
                                  >
                                    <span className="d-none d-md-inline">🗑️ Eliminar</span>
                                    <span className="d-md-none">🗑️</span>
                                  </Button>
                                </div>
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

export default RegistroProductosOptimized; 