// Utilidades para exportar compras y cargas de máquina a CSV
export const exportCSV = {
  // Convertir datos a formato CSV
  convertToCSV(data, headers) {
    if (!data || data.length === 0) {
      return '';
    }

    // Crear la línea de encabezados usando los labels
    const headerRow = headers.map(header => `"${header.label}"`).join(',');
    
    // Crear las líneas de datos usando las keys
    const dataRows = data.map(row => {
      return headers.map(header => {
        const value = row[header.key] || '';
        // Escapar comillas y envolver en comillas si contiene comas o saltos de línea
        const escapedValue = String(value).replace(/"/g, '""');
        return `"${escapedValue}"`;
      }).join(',');
    });

    return [headerRow, ...dataRows].join('\n');
  },

  // Descargar archivo CSV
  downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  // Exportar compras a CSV
  exportarCompras(compras) {
    const headers = [
      { key: 'id', label: 'ID Compra' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'proveedor_nombre', label: 'Proveedor' },
      { key: 'total', label: 'Total' },
      { key: 'observaciones', label: 'Observaciones' }
    ];

    // Procesar datos de compras
    const processedData = compras.map(compra => ({
      id: compra.id,
      fecha: new Date(compra.fecha).toLocaleDateString('es-ES'),
      proveedor_nombre: compra.proveedores?.nombre || 'N/A',
      total: compra.total || 0,
      observaciones: compra.observaciones || ''
    }));

    const csvContent = this.convertToCSV(processedData, headers);
    this.downloadCSV(csvContent, `compras_${new Date().toISOString().split('T')[0]}.csv`);
  },

  // Exportar cargas de máquina a CSV
  exportarCargasMaquina(cargas) {
    const headers = [
      { key: 'id', label: 'ID Carga' },
      { key: 'producto_nombre', label: 'Producto' },
      { key: 'cantidad_cargada', label: 'Cantidad Cargada' },
      { key: 'fecha_carga', label: 'Fecha de Carga' },
      { key: 'observaciones', label: 'Observaciones' }
    ];

    // Procesar datos de cargas
    const processedData = cargas.map(carga => ({
      id: carga.id,
      producto_nombre: carga.productos?.nombre || 'N/A',
      cantidad_cargada: carga.cantidad_cargada || 0,
      fecha_carga: new Date(carga.fecha_carga).toLocaleDateString('es-ES'),
      observaciones: carga.observaciones || ''
    }));

    const csvContent = this.convertToCSV(processedData, headers);
    this.downloadCSV(csvContent, `cargas_maquina_${new Date().toISOString().split('T')[0]}.csv`);
  },

  // Exportar detalles de compra a CSV
  exportarDetallesCompra(detalles) {
    const headers = [
      { key: 'id', label: 'ID Detalle' },
      { key: 'compra_id', label: 'ID Compra' },
      { key: 'numero_factura', label: 'Número Factura' },
      { key: 'fecha_compra', label: 'Fecha Compra' },
      { key: 'proveedor_nombre', label: 'Proveedor' },
      { key: 'producto_nombre', label: 'Producto' },
      { key: 'cantidad', label: 'Cantidad' },
      { key: 'precio_total', label: 'Precio Total' },
      { key: 'costo_unitario', label: 'Costo Unitario' }
    ];

    // Procesar datos de detalles
    const processedData = detalles.map(detalle => ({
      id: detalle.id,
      compra_id: detalle.compra_id,
      numero_factura: detalle.compras?.numero_factura || 'N/A',
      fecha_compra: detalle.compras?.fecha ? new Date(detalle.compras.fecha).toLocaleDateString('es-ES') : 'N/A',
      proveedor_nombre: detalle.compras?.proveedores?.nombre || 'N/A',
      producto_nombre: detalle.productos?.nombre || 'N/A',
      cantidad: detalle.cantidad || 0,
      precio_total: detalle.precio_total || 0,
      costo_unitario: detalle.costo_unitario || 0
    }));

    const csvContent = this.convertToCSV(processedData, headers);
    this.downloadCSV(csvContent, `detalles_compra_${new Date().toISOString().split('T')[0]}.csv`);
  }
}; 