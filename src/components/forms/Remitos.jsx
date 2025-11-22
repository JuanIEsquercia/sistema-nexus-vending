import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Modal, Alert, Badge } from 'react-bootstrap';

import './forms.css';

function Remitos() {
  const [remitos, setRemitos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });
  
  // Formulario de remito
  const [formData, setFormData] = useState({
    numero: '',
    observaciones: '',
    destinatario_nombre: '',
    destinatario_cuit: ''
  });
  
  // Productos del remito
  const [productos, setProductos] = useState([
    { descripcion: '', cantidad: 1 }
  ]);

  // Empresa remitente fija
  const EMPRESA_REMITENTE = 'NEXUS VENDING';

  // Generar ID único para remitos
  const generarId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Generar número de remito automático
  const generarNumeroRemito = () => {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `REM-${año}${mes}${dia}-${timestamp}`;
  };

  const mostrarAlerta = (message, variant = 'success') => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductoChange = (index, field, value) => {
    const nuevosProductos = [...productos];
    nuevosProductos[index][field] = value;
    setProductos(nuevosProductos);
  };

  const agregarProducto = () => {
    setProductos([...productos, { descripcion: '', cantidad: 1 }]);
  };

  const eliminarProducto = (index) => {
    if (productos.length > 1) {
      setProductos(productos.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.destinatario_nombre.trim() || !formData.destinatario_cuit.trim()) {
      mostrarAlerta('Por favor completa el nombre y CUIT del destinatario', 'warning');
      return;
    }

    if (productos.some(p => !p.descripcion.trim())) {
      mostrarAlerta('Todos los productos deben tener una descripción', 'warning');
      return;
    }

    if (productos.some(p => !p.cantidad || parseFloat(p.cantidad) <= 0)) {
      mostrarAlerta('Todos los productos deben tener una cantidad válida', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      const numeroRemito = formData.numero.trim() || generarNumeroRemito();
      
      const nuevoRemito = {
        id: generarId(),
        numero: numeroRemito,
        remitente: EMPRESA_REMITENTE,
        destinatario_nombre: formData.destinatario_nombre.trim(),
        destinatario_cuit: formData.destinatario_cuit.trim(),
        observaciones: formData.observaciones.trim(),
        fecha_emision: new Date().toISOString(),
        fecha_entrega: new Date().toISOString(),
        productos_entregados: productos.map(p => ({ ...p, cantidad: parseFloat(p.cantidad) || 0, id: generarId() }))
      };

      setRemitos(prev => [nuevoRemito, ...prev]);
      
      mostrarAlerta('Remito creado exitosamente');
      setShowModal(false);
      resetForm();
    } catch (error) {
      mostrarAlerta('Error al crear remito: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      numero: '',
      observaciones: '',
      destinatario_nombre: '',
      destinatario_cuit: ''
    });
    setProductos([{ descripcion: '', cantidad: 1 }]);
  };

  const exportarPDF = async (remito) => {
    try {
      setLoading(true);
      
      const fechaEmision = new Date(remito.fecha_emision).toLocaleDateString('es-ES');
      const fechaEntrega = new Date(remito.fecha_entrega).toLocaleDateString('es-ES');
      
      // Crear contenido HTML optimizado para una sola hoja A4
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Remito - ${remito.numero}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: Arial, sans-serif; 
              padding: 10mm; 
              background: white; 
              line-height: 1.3;
              font-size: 11px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 8mm; 
              padding: 6mm; 
              border-bottom: 2px solid #0d6efd; 
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            }
            .header h1 { 
              color: #0d6efd; 
              margin-bottom: 3mm; 
              font-size: 20px; 
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .header h2 { 
              color: #333; 
              margin: 2mm 0; 
              font-size: 14px; 
              font-weight: 600;
            }
            .numero-remito {
              font-size: 12px;
              color: #666;
              font-weight: 600;
              margin-top: 2mm;
            }
            .info-section { 
              margin-bottom: 6mm; 
              padding: 4mm;
              border: 1px solid #e9ecef;
            }
            .info-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 4mm; 
              margin-bottom: 4mm; 
            }
            .info-box { 
              padding: 3mm;
              background: #f8f9fa;
              border-left: 2px solid #0d6efd;
            }
            .info-box h4 {
              color: #495057;
              margin-bottom: 2mm;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              border-bottom: 1px solid #0d6efd;
              padding-bottom: 1mm;
            }
            .info-box p {
              margin: 1mm 0;
              font-size: 10px;
              color: #212529;
              line-height: 1.4;
            }
            .productos-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 4mm; 
              font-size: 10px;
            }
            .productos-table th, .productos-table td { 
              border: 1px solid #dee2e6; 
              padding: 3mm 2mm; 
              text-align: left; 
            }
            .productos-table th { 
              background: #0d6efd; 
              color: white; 
              font-weight: bold; 
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .productos-table td.cantidad { 
              text-align: center; 
              font-weight: 600; 
              width: 25mm;
            }
            .productos-table tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .observaciones {
              margin-top: 4mm;
              padding: 3mm;
              background: #fff3cd;
              border-left: 2px solid #ffc107;
              font-size: 10px;
            }
            .observaciones h5 {
              margin: 0 0 1mm 0;
              font-size: 10px;
              color: #856404;
              font-weight: bold;
            }
            .observaciones p {
              margin: 0;
              font-size: 9px;
              color: #856404;
              line-height: 1.3;
            }
            .footer { 
              margin-top: 6mm; 
              padding: 4mm; 
              border-top: 1px solid #dee2e6; 
              text-align: center; 
              background: #f8f9fa;
            }
            .footer > p { 
              color: #495057; 
              font-size: 9px; 
              line-height: 1.3;
              margin-bottom: 4mm;
            }
            .footer .firmas {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10mm;
              margin-top: 8mm;
            }
            .footer .firma-box {
              padding: 3mm;
              border-top: 1px solid #dee2e6;
              min-height: 20mm;
            }
            .footer .firma-box p {
              margin: 1mm 0;
              font-size: 9px;
              color: #6c757d;
            }
            .no-print { 
              display: none; 
            }
            @media print {
              body { 
                margin: 8mm; 
                padding: 0;
              }
              .header { 
                margin-bottom: 5mm;
                padding: 4mm;
                page-break-inside: avoid;
              }
              .info-section {
                margin-bottom: 4mm;
                padding: 3mm;
                page-break-inside: avoid;
              }
              .productos-table {
                page-break-inside: avoid;
                font-size: 9px;
              }
              .productos-table th, .productos-table td {
                padding: 2mm;
              }
              .footer {
                margin-top: 5mm;
                padding: 3mm;
                page-break-inside: avoid;
              }
              .observaciones {
                page-break-inside: avoid;
              }
            }
            @page {
              size: A4;
              margin: 8mm;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>REMITO</h1>
            <h2>${remito.remitente}</h2>
            <div class="numero-remito">N° ${remito.numero}</div>
          </div>
          
          <div class="info-section">
            <div class="info-grid">
              <div class="info-box">
                <h4>Remitente</h4>
                <p><strong>Empresa:</strong> ${remito.remitente}</p>
              </div>
              <div class="info-box">
                <h4>Destinatario</h4>
                <p><strong>Nombre:</strong> ${remito.destinatario_nombre}</p>
                <p><strong>CUIT:</strong> ${remito.destinatario_cuit}</p>
              </div>
            </div>
            
            <div class="info-grid">
              <div class="info-box">
                <h4>Fechas</h4>
                <p><strong>Emisión:</strong> ${fechaEmision}</p>
                <p><strong>Entrega:</strong> ${fechaEntrega}</p>
              </div>
              <div class="info-box">
                <h4>Detalles</h4>
                <p><strong>Items:</strong> ${remito.productos_entregados.length}</p>
              </div>
            </div>
          </div>
          
          <div class="info-section">
            <h4 style="color: #333; margin-bottom: 3mm; font-size: 11px; border-bottom: 1px solid #0d6efd; padding-bottom: 1mm; font-weight: bold;">Productos Entregados</h4>
            <table class="productos-table">
              <thead>
                <tr>
                  <th>Descripción del Producto</th>
                  <th class="cantidad">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                ${remito.productos_entregados.map(producto => `
                  <tr>
                    <td>${producto.descripcion}</td>
                    <td class="cantidad">${producto.cantidad}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          ${remito.observaciones ? `
            <div class="observaciones">
              <h5>Observaciones:</h5>
              <p>${remito.observaciones}</p>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>
              Este remito certifica la entrega de los productos detallados anteriormente.<br>
              Documento generado automáticamente por el sistema <strong>Nexus Vending Management</strong>.
            </p>
            
            <div class="firmas">
              <div class="firma-box">
                <p><strong>Remitente</strong></p>
                <p style="margin-top: 8mm;">_________________________</p>
                <p style="font-size: 8px;">${remito.remitente}</p>
              </div>
              <div class="firma-box">
                <p><strong>Destinatario</strong></p>
                <p style="margin-top: 8mm;">_________________________</p>
                <p style="font-size: 8px;">${remito.destinatario_nombre}</p>
              </div>
            </div>
          </div>
          
          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; margin: 5px; background: #0d6efd; color: white; border: none; border-radius: 5px; cursor: pointer;">🖨️ Imprimir Remito</button>
            <button onclick="window.close()" style="padding: 10px 20px; margin: 5px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">❌ Cerrar</button>
          </div>
          
          <script>
            // Auto-abrir diálogo de impresión al cargar
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
        </html>
      `;
      
      // Abrir en nueva ventana para imprimir
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // El diálogo de impresión se abrirá automáticamente por el script
        mostrarAlerta('Remito generado. El diálogo de impresión se abrirá automáticamente.');
      } else {
        mostrarAlerta('No se pudo abrir la ventana de impresión. Verifica que los pop-ups estén permitidos.', 'warning');
      }
    } catch (error) {
      mostrarAlerta('Error al exportar remito: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const eliminarRemito = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este remito?')) {
      try {
        setLoading(true);
        setRemitos(prev => prev.filter(r => r.id !== id));
        mostrarAlerta('Remito eliminado exitosamente');
      } catch (error) {
        mostrarAlerta('Error al eliminar remito: ' + error.message, 'danger');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">📦 Gestión de Remitos</h4>
              <Button 
                variant="primary" 
                onClick={() => setShowModal(true)}
                disabled={loading}
              >
                ➕ Nuevo Remito
              </Button>
            </Card.Header>
            <Card.Body>
              {alert.show && (
                <Alert variant={alert.variant} dismissible onClose={() => setAlert({ show: false, message: '', variant: 'success' })}>
                  {alert.message}
                </Alert>
              )}

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              ) : remitos.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No hay remitos creados aún.</p>
                  <Button variant="outline-primary" onClick={() => setShowModal(true)}>
                    Crear el primer remito
                  </Button>
                </div>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>N° Remito</th>
                      <th>Remitente</th>
                      <th>Destinatario</th>
                      <th>CUIT</th>
                      <th>Fecha Emisión</th>
                      <th>Items</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remitos.map((remito) => (
                      <tr key={remito.id}>
                        <td><strong>{remito.numero}</strong></td>
                        <td>{remito.remitente}</td>
                        <td>{remito.destinatario_nombre}</td>
                        <td>{remito.destinatario_cuit}</td>
                        <td>{new Date(remito.fecha_emision).toLocaleDateString('es-ES')}</td>
                        <td><Badge bg="info">{remito.productos_entregados.length} items</Badge></td>
                        <td>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => exportarPDF(remito)}
                            disabled={loading}
                            className="me-2"
                          >
                            📄 PDF
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => eliminarRemito(remito.id)}
                            disabled={loading}
                          >
                            🗑️
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal para crear/editar remito */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Nuevo Remito</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>N° Remito (Opcional - se genera automático si se deja vacío)</Form.Label>
                  <Form.Control
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleInputChange}
                    placeholder="Ej: REM-20241201-001"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Remitente (Fijo)</Form.Label>
                  <Form.Control
                    type="text"
                    value={EMPRESA_REMITENTE}
                    disabled
                    className="bg-light"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Destinatario - Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    name="destinatario_nombre"
                    value={formData.destinatario_nombre}
                    onChange={handleInputChange}
                    required
                    placeholder="Nombre o razón social"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Destinatario - CUIT *</Form.Label>
                  <Form.Control
                    type="text"
                    name="destinatario_cuit"
                    value={formData.destinatario_cuit}
                    onChange={handleInputChange}
                    required
                    placeholder="XX-XXXXXXXX-X"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Observaciones</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                placeholder="Observaciones o notas adicionales..."
              />
            </Form.Group>

            <hr />

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>Productos Entregados</h5>
              <Button type="button" variant="outline-primary" size="sm" onClick={agregarProducto}>
                ➕ Agregar Producto
              </Button>
            </div>

            {productos.map((producto, index) => (
              <Row key={index} className="mb-3">
                <Col md={9}>
                  <Form.Control
                    type="text"
                    placeholder="Descripción del producto/insumo"
                    value={producto.descripcion}
                    onChange={(e) => handleProductoChange(index, 'descripcion', e.target.value)}
                    required
                  />
                </Col>
                <Col md={2}>
                  <Form.Control
                    type="number"
                    placeholder="Cant."
                    value={producto.cantidad}
                    onChange={(e) => handleProductoChange(index, 'cantidad', e.target.value)}
                    min="1"
                    step="1"
                    required
                  />
                </Col>
                <Col md={1}>
                  {productos.length > 1 && (
                    <Button
                      type="button"
                      variant="outline-danger"
                      size="sm"
                      onClick={() => eliminarProducto(index)}
                      style={{ width: '100%' }}
                    >
                      🗑️
                    </Button>
                  )}
                </Col>
              </Row>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Remito'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default Remitos;

