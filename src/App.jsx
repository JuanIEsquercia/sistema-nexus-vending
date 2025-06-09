import { useState } from 'react';
import NavbarComponent from './components/layout/Navbar';
import RegistroCompras from './components/forms/RegistroCompras';
import RegistroProductos from './components/forms/RegistroProductos';
import CargaProductosMaquina from './components/forms/CargaProductosMaquina';
import RegistroProveedores from './components/forms/RegistroProveedores';
import './components/forms/forms.css';

function App() {
  const [vistaActiva, setVistaActiva] = useState('productos');

  const renderizarVista = () => {
    switch (vistaActiva) {
      case 'productos':
        return <RegistroProductos />;
      case 'proveedores':
        return <RegistroProveedores />;
      case 'compras':
        return <RegistroCompras />;
      case 'cargas':
        return <CargaProductosMaquina />;
      default:
        return <RegistroProductos />;
    }
  };

  return (
    <div className="app-container">
      <NavbarComponent vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} />
      
      <main className="main-content" style={{ paddingTop: '76px' }}>
        {renderizarVista()}
      </main>
    </div>
  );
}

export default App;
