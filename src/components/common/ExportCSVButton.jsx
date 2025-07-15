import { useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { exportCSV } from '../../utils/exportCSV';

function ExportCSVButton({ 
  tipo, // 'compras' o 'cargas'
  onExport,
  variant = 'outline-success', 
  size = 'sm',
  className = '',
  disabled = false,
  children 
}) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Obtener todos los datos
      const data = await onExport();
      
      // Exportar según el tipo
      if (tipo === 'compras') {
        exportCSV.exportarCompras(data);
      } else if (tipo === 'cargas') {
        exportCSV.exportarCargasMaquina(data);
      } else if (tipo === 'detalles') {
        exportCSV.exportarDetallesCompra(data);
      }
      
      console.log(`Archivo exportado: ${tipo}`);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert(`Error al exportar: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const getButtonText = () => {
    if (exporting) return 'Exportando...';
    if (tipo === 'compras') return '📊 Exportar Compras';
    if (tipo === 'cargas') return '📊 Exportar Cargas';
    if (tipo === 'detalles') return '📊 Exportar Detalles';
    return children || '📊 Exportar CSV';
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleExport}
      disabled={disabled || exporting}
      title={`Exportar ${tipo} a CSV`}
    >
      {exporting ? (
        <>
          <Spinner size="sm" className="me-2" />
          {getButtonText()}
        </>
      ) : (
        getButtonText()
      )}
    </Button>
  );
}

export default ExportCSVButton; 