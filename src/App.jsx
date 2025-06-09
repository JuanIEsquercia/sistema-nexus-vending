import { useState } from 'react';
import { Badge } from 'react-bootstrap';
import NavbarComponent from './components/layout/Navbar';
import RegistroCompras from './components/forms/RegistroCompras';
import RegistroComprasOptimized from './components/forms/RegistroComprasOptimized';
import RegistroProductos from './components/forms/RegistroProductos';
import CargaProductosMaquina from './components/forms/CargaProductosMaquina';
import RegistroProveedores from './components/forms/RegistroProveedores';
import './components/forms/forms.css';

function App() {
  const [vistaActiva, setVistaActiva] = useState('productos');
  const [modoOptimizado, setModoOptimizado] = useState(true);

  const renderizarVista = () => {
    switch (vistaActiva) {
      case 'productos':
        return <RegistroProductos />;
      case 'proveedores':
        return <RegistroProveedores />;
      case 'compras':
        return modoOptimizado ? <RegistroComprasOptimized /> : <RegistroCompras />;
      case 'cargas':
        return <CargaProductosMaquina />;
      default:
        return <RegistroProductos />;
    }
  };

  return (
    <div className="app-container">
      <NavbarComponent vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} />
      
      {/* Toggle de modo optimizado (solo para compras por ahora) */}
      {vistaActiva === 'compras' && (
        <div className="text-center py-2" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="d-inline-flex align-items-center gap-3">
            <span className="text-muted">Modo:</span>
            <div className="d-flex align-items-center gap-2">
              <Badge 
                bg={!modoOptimizado ? 'primary' : 'light'} 
                text={!modoOptimizado ? 'white' : 'dark'}
                role="button"
                onClick={() => setModoOptimizado(false)}
                style={{ cursor: 'pointer' }}
              >
                Clásico
              </Badge>
              <Badge 
                bg={modoOptimizado ? 'success' : 'light'} 
                text={modoOptimizado ? 'white' : 'dark'}
                role="button"
                onClick={() => setModoOptimizado(true)}
                style={{ cursor: 'pointer' }}
              >
                ⚡ Optimizado (Paginación + Caché)
              </Badge>
            </div>
          </div>
        </div>
      )}
      
      <main className="main-content" style={{ paddingTop: vistaActiva === 'compras' ? '76px' : '76px' }}>
        {renderizarVista()}
      </main>
    </div>
  );
}

export default App;
