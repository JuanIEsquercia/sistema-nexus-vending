import { useState } from 'react';
import NavbarComponent from './components/layout/Navbar';
import RegistroCompras from './components/forms/RegistroCompras';
import RegistroProductos from './components/forms/RegistroProductos';
import RegistroProductosOptimized from './components/forms/RegistroProductosOptimized';
// import CargaProductosMaquina from './components/forms/CargaProductosMaquina'; // OCULTO TEMPORALMENTE
import RegistroProveedores from './components/forms/RegistroProveedores';
import Presupuestos from './components/forms/Presupuestos';
import Dashboard from './components/forms/Dashboard';

function App() {
  const [vistaActiva, setVistaActiva] = useState('productos');
  const [modoOptimizado, setModoOptimizado] = useState(false);

  const renderizarVista = () => {
    switch (vistaActiva) {
      case 'productos':
        return modoOptimizado ? <RegistroProductosOptimized /> : <RegistroProductos />;
      case 'proveedores':
        return <RegistroProveedores />;
              case 'compras':
                return <RegistroCompras />;
      // case 'cargas':
      //   return <CargaProductosMaquina />; // OCULTO TEMPORALMENTE
      case 'presupuestos':
        return <Presupuestos />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return modoOptimizado ? <RegistroProductosOptimized /> : <RegistroProductos />;
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: 'none', 
      margin: 0, 
      padding: 0, 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <NavbarComponent vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} />
      
      {/* Toggle de modo optimizado */}
      {vistaActiva === 'productos' && (
        <div style={{ 
          textAlign: 'center', 
          padding: '10px 0', 
          backgroundColor: '#f8f9fa',
          width: '100%',
          margin: 0
        }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '15px' 
          }}>
            <span style={{ color: '#6c757d' }}>Modo:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={() => setModoOptimizado(false)}
                style={{ 
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: !modoOptimizado ? '#0d6efd' : '#f8f9fa',
                  color: !modoOptimizado ? 'white' : '#212529'
                }}
              >
                Clásico
              </button>
              <button 
                onClick={() => setModoOptimizado(true)}
                style={{ 
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: modoOptimizado ? '#198754' : '#f8f9fa',
                  color: modoOptimizado ? 'white' : '#212529'
                }}
              >
                ⚡ Optimizado (Paginación + Caché)
              </button>
            </div>
          </div>
        </div>
      )}
      
      <main style={{ 
        flex: 1,
        width: '100%',
        maxWidth: 'none',
        margin: 0,
        padding: vistaActiva === 'dashboard' ? '0' : '0',
        paddingTop: vistaActiva === 'productos' ? '76px' : '76px'
      }}>
        {renderizarVista()}
      </main>
    </div>
  );
}

export default App;
