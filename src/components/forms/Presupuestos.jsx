import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Modal, Alert, Badge } from 'react-bootstrap';

import './forms.css';

function Presupuestos() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });
  
  // Formulario de presupuesto
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    validez_dias: 7,
    cliente: '',
    contacto: ''
  });
  
  // Conceptos del presupuesto
  const [conceptos, setConceptos] = useState([
    { descripcion: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }
  ]);

  // Generar ID único para presupuestos
  const generarId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Formatear moneda argentina (puntos para miles, coma para decimales)
  const formatearMoneda = (valor) => {
    const numero = parseFloat(valor || 0);
    return numero.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
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

  const handleConceptoChange = (index, field, value) => {
    const nuevosConceptos = [...conceptos];
    nuevosConceptos[index][field] = value;
    
    // Calcular subtotal
    if (field === 'cantidad' || field === 'precio_unitario') {
      const cantidad = parseFloat(nuevosConceptos[index].cantidad) || 0;
      const precio = parseFloat(nuevosConceptos[index].precio_unitario) || 0;
      nuevosConceptos[index].subtotal = cantidad * precio;
    }
    
    setConceptos(nuevosConceptos);
  };

  const agregarConcepto = () => {
    setConceptos([...conceptos, { descripcion: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }]);
  };

  const eliminarConcepto = (index) => {
    if (conceptos.length > 1) {
      setConceptos(conceptos.filter((_, i) => i !== index));
    }
  };

  const calcularTotal = () => {
    return conceptos.reduce((total, concepto) => total + (concepto.subtotal || 0), 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.cliente.trim()) {
      mostrarAlerta('Por favor completa todos los campos obligatorios', 'warning');
      return;
    }

    if (conceptos.some(c => !c.descripcion.trim())) {
      mostrarAlerta('Todos los conceptos deben tener una descripción', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      const nuevoPresupuesto = {
        id: generarId(),
        ...formData,
        fecha_emision: new Date().toISOString(),
        fecha_vencimiento: new Date(Date.now() + (formData.validez_dias * 24 * 60 * 60 * 1000)).toISOString(),
        total: calcularTotal(),
        conceptos_presupuesto: conceptos.map(c => ({ ...c, id: generarId() }))
      };

      setPresupuestos(prev => [nuevoPresupuesto, ...prev]);
      
      mostrarAlerta('Presupuesto creado exitosamente');
      setShowModal(false);
      resetForm();
    } catch (error) {
      mostrarAlerta('Error al crear presupuesto: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      validez_dias: 7,
      cliente: '',
      contacto: ''
    });
    setConceptos([{ descripcion: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }]);
  };

  const exportarPDF = async (presupuesto) => {
    try {
      setLoading(true);
      
      const fechaEmision = new Date(presupuesto.fecha_emision).toLocaleDateString('es-ES');
      const fechaVencimiento = new Date(presupuesto.fecha_vencimiento).toLocaleDateString('es-ES');
      
      
      
      // Crear contenido HTML para imprimir con logo
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Presupuesto - ${presupuesto.titulo}</title>
                     <style>
                           body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: white; 
                line-height: 1.4;
                max-width: 800px;
                margin: 0 auto;
              }
                           .header { 
                text-align: center; 
                margin-bottom: 20px; 
                padding: 20px 15px; 
                border-bottom: 2px solid #0d6efd; 
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border-radius: 6px;
                min-height: 120px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
              }
              
                           .header h1 { 
                color: #0d6efd; 
                margin-bottom: 8px; 
                font-size: 24px; 
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .header h2 { 
                color: #333; 
                margin-bottom: 5px; 
                font-size: 18px; 
                font-weight: 600;
              }
              .header p { 
                color: #666; 
                margin: 0; 
                font-style: italic; 
                font-size: 14px;
              }
                           .info-section { 
                margin-bottom: 20px; 
                padding: 15px;
                background: #ffffff;
                border: 1px solid #e9ecef;
                border-radius: 6px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
                           .info-grid { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 15px; 
                gap: 20px;
              }
              .info-grid > div { 
                flex: 1; 
                padding: 10px;
                background: #f8f9fa;
                border-radius: 4px;
              }
                           .info-grid h4 {
                color: #495057;
                margin-bottom: 8px;
                font-size: 16px;
                border-bottom: 1px solid #0d6efd;
                padding-bottom: 4px;
              }
              .info-grid p {
                margin: 4px 0;
                font-size: 13px;
              }
                           .conceptos-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 15px; 
                box-shadow: 0 1px 4px rgba(0,0,0,0.1);
                border-radius: 6px;
                overflow: hidden;
              }
                           .conceptos-table th, .conceptos-table td { 
                border: 1px solid #dee2e6; 
                padding: 8px 10px; 
                text-align: left; 
                font-size: 12px;
              }
                           .conceptos-table th { 
                background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%); 
                color: white; 
                font-weight: bold; 
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
             .conceptos-table td.cantidad { text-align: center; font-weight: 600; }
             .conceptos-table td.precio, .conceptos-table td.subtotal { 
               text-align: right; 
               font-weight: 600;
               font-family: 'Courier New', monospace;
             }
             .conceptos-table tr:nth-child(even) {
               background-color: #f8f9fa;
             }
             .conceptos-table tr:hover {
               background-color: #e9ecef;
             }
                           .total { 
                text-align: right; 
                font-size: 18px; 
                font-weight: bold; 
                background: #ffffff; 
                color: #000000;
                padding: 12px 20px; 
                border-radius: 6px; 
                margin-top: 10px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                border: 2px solid #28a745;
              }
              .total p {
                margin: 0;
                font-size: 20px;
                font-weight: bold;
                color: #000000;
              }
                           .footer { 
                margin-top: 20px; 
                padding: 15px 15px; 
                border-top: 2px solid #dee2e6; 
                text-align: center; 
                background: #f8f9fa;
                border-radius: 6px;
              }
              .footer p { 
                color: #495057; 
                font-size: 13px; 
                line-height: 1.4;
                margin: 0;
              }
             .nexus-brand { 
               color: #0d6efd; 
               font-weight: bold; 
               font-size: 16px;
             }
                           @media print {
                body { 
                  margin: 15mm; 
                  padding: 0;
                  max-width: none;
                }
                .header { 
                  border-bottom: 2px solid #0d6efd; 
                  margin-bottom: 15px;
                  page-break-inside: avoid;
                }
                .info-section {
                  page-break-inside: avoid;
                  margin-bottom: 15px;
                }
                .conceptos-table {
                  page-break-inside: avoid;
                }
                .total {
                  page-break-inside: avoid;
                  margin-top: 10px;
                }
                .footer {
                  page-break-inside: avoid;
                  margin-top: 15px;
                }
                .no-print { display: none; }
              }
           </style>
        </head>
        <body>
                                 <div class="header">
              <h1>PRESUPUESTO</h1>
              <h2>${presupuesto.titulo}</h2>
              <p>${presupuesto.descripcion || ''}</p>
            </div>
          
                     <div class="info-section">
             <div class="info-grid">
               <div>
                 <h4>Información del Cliente</h4>
                 <p><strong>Cliente:</strong> ${presupuesto.cliente}</p>
                 <p><strong>Contacto:</strong> ${presupuesto.contacto || 'No especificado'}</p>
               </div>
               <div>
                 <h4>Información del Presupuesto</h4>
                 <p><strong>Fecha de Emisión:</strong> ${fechaEmision}</p>
                 <p><strong>Válido hasta:</strong> ${fechaVencimiento}</p>
                 <p><strong>Vigencia:</strong> ${presupuesto.validez_dias} días</p>
               </div>
             </div>
           </div>
           
                       <div class="info-section">
              <h4 style="color: #333; margin-bottom: 12px; font-size: 16px; border-bottom: 1px solid #0d6efd; padding-bottom: 6px;">Conceptos del Presupuesto</h4>
            <table class="conceptos-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th class="cantidad">Cantidad</th>
                  <th class="precio">Precio Unit.</th>
                  <th class="subtotal">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                                 ${presupuesto.conceptos_presupuesto.map(concepto => `
                   <tr>
                     <td>${concepto.descripcion}</td>
                     <td class="cantidad">${concepto.cantidad}</td>
                     <td class="precio">$${formatearMoneda(concepto.precio_unitario)}</td>
                     <td class="subtotal">$${formatearMoneda(concepto.subtotal)}</td>
                   </tr>
                 `).join('')}
              </tbody>
            </table>
            
                         <div class="total">
               <p style="margin: 5px 0;">Total: $${formatearMoneda(presupuesto.total)}</p>
             </div>
          </div>
          
          <div class="footer">
            <p>
              <strong>Oferta válida por ${presupuesto.validez_dias} días desde la fecha de emisión.</strong><br>
              Este presupuesto fue generado automáticamente por el sistema <span class="nexus-brand">Nexus Vending Management</span>.
            </p>
          </div>
          
          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; margin: 5px; background: #0d6efd; color: white; border: none; border-radius: 5px; cursor: pointer;">🖨️ Imprimir Presupuesto</button>
            <button onclick="window.close()" style="padding: 10px 20px; margin: 5px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">❌ Cerrar</button>
          </div>
        </body>
        </html>
      `;
      
      // Abrir en nueva ventana para imprimir
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Esperar a que se cargue el contenido
      printWindow.onload = function() {
        printWindow.focus();
      };
      
      mostrarAlerta('PDF generado exitosamente');
    } catch (error) {
      mostrarAlerta('Error al exportar presupuesto: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const eliminarPresupuesto = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) {
      try {
        setLoading(true);
        setPresupuestos(prev => prev.filter(p => p.id !== id));
        mostrarAlerta('Presupuesto eliminado exitosamente');
      } catch (error) {
        mostrarAlerta('Error al eliminar presupuesto: ' + error.message, 'danger');
      } finally {
        setLoading(false);
      }
    }
  };

  const estaVencido = (fechaVencimiento) => {
    return new Date(fechaVencimiento) < new Date();
  };

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">📋 Gestión de Presupuestos</h4>
              <Button 
                variant="primary" 
                onClick={() => setShowModal(true)}
                disabled={loading}
              >
                ➕ Nuevo Presupuesto
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
              ) : presupuestos.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No hay presupuestos creados aún.</p>
                  <Button variant="outline-primary" onClick={() => setShowModal(true)}>
                    Crear el primer presupuesto
                  </Button>
                </div>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Cliente</th>
                      <th>Fecha Emisión</th>
                      <th>Vigencia</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presupuestos.map((presupuesto) => (
                      <tr key={presupuesto.id}>
                        <td>{presupuesto.titulo}</td>
                        <td>{presupuesto.cliente}</td>
                        <td>{new Date(presupuesto.fecha_emision).toLocaleDateString('es-ES')}</td>
                        <td>{presupuesto.validez_dias} días</td>
                                                 <td>${formatearMoneda(presupuesto.total)}</td>
                        <td>
                          {estaVencido(presupuesto.fecha_vencimiento) ? (
                            <Badge bg="danger">Vencido</Badge>
                          ) : (
                            <Badge bg="success">Vigente</Badge>
                          )}
                        </td>
                        <td>
                                                     <Button
                             size="sm"
                             variant="outline-primary"
                             onClick={() => exportarPDF(presupuesto)}
                             disabled={loading}
                             className="me-2"
                                                       >
                              📄 PDF
                            </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => eliminarPresupuesto(presupuesto.id)}
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

      {/* Modal para crear/editar presupuesto */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Nuevo Presupuesto</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Título del Presupuesto *</Form.Label>
                  <Form.Control
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vigencia (días) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="validez_dias"
                    value={formData.validez_dias}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cliente *</Form.Label>
                  <Form.Control
                    type="text"
                    name="cliente"
                    value={formData.cliente}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contacto</Form.Label>
                  <Form.Control
                    type="text"
                    name="contacto"
                    value={formData.contacto}
                    onChange={handleInputChange}
                    placeholder="Teléfono, email, etc."
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder="Descripción general del presupuesto..."
              />
            </Form.Group>

            <hr />

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>Conceptos del Presupuesto</h5>
              <Button type="button" variant="outline-primary" size="sm" onClick={agregarConcepto}>
                ➕ Agregar Concepto
              </Button>
            </div>

            {conceptos.map((concepto, index) => (
              <Row key={index} className="mb-3">
                <Col md={6}>
                  <Form.Control
                    type="text"
                    placeholder="Descripción del concepto"
                    value={concepto.descripcion}
                    onChange={(e) => handleConceptoChange(index, 'descripcion', e.target.value)}
                    required
                  />
                </Col>
                <Col md={2}>
                  <Form.Control
                    type="number"
                    placeholder="Cant."
                    value={concepto.cantidad}
                    onChange={(e) => handleConceptoChange(index, 'cantidad', e.target.value)}
                    min="1"
                    step="1"
                  />
                </Col>
                <Col md={2}>
                  <Form.Control
                    type="number"
                    placeholder="Precio"
                    value={concepto.precio_unitario}
                    onChange={(e) => handleConceptoChange(index, 'precio_unitario', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </Col>
                <Col md={1}>
                                     <Form.Control
                     type="text"
                     value={`$${formatearMoneda(concepto.subtotal)}`}
                     readOnly
                     className="text-end"
                   />
                </Col>
                <Col md={1}>
                  {conceptos.length > 1 && (
                    <Button
                      type="button"
                      variant="outline-danger"
                      size="sm"
                      onClick={() => eliminarConcepto(index)}
                    >
                      🗑️
                    </Button>
                  )}
                </Col>
              </Row>
            ))}

                         <div className="text-end">
               <h5>Total: ${formatearMoneda(calcularTotal())}</h5>
             </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Presupuesto'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default Presupuestos; 