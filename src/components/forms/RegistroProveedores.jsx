import { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Table, Badge, Spinner } from 'react-bootstrap';
import { useProveedores } from '../../hooks/useSupabase';

function RegistroProveedores() {
  const {
    proveedores,
    loading,
    error,
    setError,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor
  } = useProveedores();

  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombre: '',
    telefono: ''
  });

  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const limpiarFormulario = () => {
    setNuevoProveedor({ nombre: '', telefono: '' });
    setEditandoId(null);
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
  };

  const validarTelefono = (telefono) => {
    // Acepta formatos: 123-456-7890, (123) 456-7890, 123.456.7890, 1234567890
    const regex = /^[\+]?[1-9][\d]{0,15}$|^[\d\-\.\(\)\s]+$/;
    return regex.test(telefono.replace(/\s/g, ''));
  };

  const formatearTelefono = (telefono) => {
    // Eliminar todos los caracteres no numéricos
    const numeros = telefono.replace(/\D/g, '');
    
    // Si tiene 10 dígitos, formatear como XXX-XXX-XXXX
    if (numeros.length === 10) {
      return `${numeros.slice(0, 3)}-${numeros.slice(3, 6)}-${numeros.slice(6)}`;
    }
    
    // Si tiene más o menos dígitos, devolver tal como está
    return telefono;
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    
    if (!nuevoProveedor.nombre.trim() || !nuevoProveedor.telefono.trim()) {
      mostrarMensaje('danger', 'Por favor complete todos los campos');
      return;
    }

    if (!validarTelefono(nuevoProveedor.telefono)) {
      mostrarMensaje('danger', 'Por favor ingrese un número de teléfono válido');
      return;
    }

    try {
      setError(null);
      
      const proveedorData = {
        nombre: nuevoProveedor.nombre.trim(),
        telefono: formatearTelefono(nuevoProveedor.telefono.trim())
      };

      if (editandoId) {
        await actualizarProveedor(editandoId, proveedorData);
        mostrarMensaje('success', 'Proveedor actualizado exitosamente');
      } else {
        await crearProveedor(proveedorData);
        mostrarMensaje('success', 'Proveedor registrado exitosamente');
      }

      limpiarFormulario();
    } catch (error) {
      if (error.message.includes('duplicate key')) {
        mostrarMensaje('danger', 'Ya existe un proveedor con ese nombre');
      } else {
        mostrarMensaje('danger', `Error: ${error.message}`);
      }
    }
  };

  const editarProveedorLocal = (proveedor) => {
    setNuevoProveedor({
      nombre: proveedor.nombre,
      telefono: proveedor.telefono
    });
    setEditandoId(proveedor.id);
  };

  const confirmarEliminar = async (id, nombre) => {
    if (window.confirm(`¿Está seguro de eliminar el proveedor "${nombre}"?`)) {
      try {
        await eliminarProveedor(id);
        mostrarMensaje('success', 'Proveedor eliminado exitosamente');
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
          <h1 className="display-6 fw-bold text-primary mb-3">🏢 Gestión de Proveedores</h1>
          <p className="lead text-muted">Administra la información de contacto de tus proveedores</p>
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
                    {editandoId ? '✏️ Editar Proveedor' : '➕ Nuevo Proveedor'}
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={manejarSubmit}>
                    <Row className="g-3">
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Nombre del Proveedor</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Ej: Distribuidora Central"
                            value={nuevoProveedor.nombre}
                            onChange={(e) => setNuevoProveedor({...nuevoProveedor, nombre: e.target.value})}
                            required
                            disabled={loading}
                          />
                        </Form.Group>
                      </Col>

                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Teléfono</Form.Label>
                          <Form.Control
                            type="tel"
                            placeholder="123-456-7890"
                            value={nuevoProveedor.telefono}
                            onChange={(e) => setNuevoProveedor({...nuevoProveedor, telefono: e.target.value})}
                            required
                            disabled={loading}
                          />
                          <Form.Text className="text-muted">
                            Formatos aceptados: 123-456-7890, (123) 456-7890, 123.456.7890
                          </Form.Text>
                        </Form.Group>
                      </Col>

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
                                {editandoId ? '💾 Actualizar' : '➕ Registrar'} Proveedor
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

            {/* Lista de Proveedores */}
            <Col xs={12} lg={7} className="d-flex">
              <Card className="list-card w-100">
                <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center flex-wrap">
                  <h5 className="mb-0">📋 Proveedores Registrados</h5>
                  <Badge bg="light" text="info">
                    {loading ? '⏳' : `Total: ${proveedores.length}`}
                  </Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="text-muted mt-3">Cargando proveedores...</p>
                    </div>
                  ) : proveedores.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="display-1 text-muted mb-3">🏢</div>
                      <h5 className="text-muted">No hay proveedores registrados</h5>
                      <p className="text-muted mb-0">Agrega tu primer proveedor usando el formulario</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead>
                          <tr>
                            <th className="d-none d-md-table-cell">ID</th>
                            <th>Proveedor</th>
                            <th className="text-center">Teléfono</th>
                            <th className="text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {proveedores.map((proveedor) => (
                            <tr key={proveedor.id} className={editandoId === proveedor.id ? 'table-warning' : ''}>
                              <td className="d-none d-md-table-cell fw-medium">#{proveedor.id}</td>
                              <td>
                                <div className="fw-semibold">{proveedor.nombre}</div>
                                <div className="small text-muted d-md-none">ID: #{proveedor.id}</div>
                              </td>
                              <td className="text-center">
                                <Badge bg="secondary" className="fs-6">{proveedor.telefono}</Badge>
                              </td>
                              <td>
                                <div className="d-flex justify-content-center gap-1 flex-wrap">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => editarProveedorLocal(proveedor)}
                                    title="Editar proveedor"
                                    disabled={loading}
                                  >
                                    <span className="d-none d-md-inline">✏️ Editar</span>
                                    <span className="d-md-none">✏️</span>
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => confirmarEliminar(proveedor.id, proveedor.nombre)}
                                    title="Eliminar proveedor"
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

export default RegistroProveedores; 