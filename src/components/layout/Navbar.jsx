import { Navbar, Nav, Container } from 'react-bootstrap';
import nexusLogo from '../../assets/nexus-logo.png';
import './navbar.css';

function NavbarComponent({ vistaActiva, setVistaActiva }) {
  return (
    <Navbar bg="light" variant="light" expand="lg" className="navbar-custom shadow-sm" fixed="top">
      <Container fluid>
        <Navbar.Brand href="#" className="navbar-brand-custom d-flex align-items-center">
          <img 
            src={nexusLogo} 
            alt="Nexus Vending" 
            height="40" 
            style={{ objectFit: 'contain' }}
          />
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link 
              href="#"
              className={`nav-link-custom ${vistaActiva === 'productos' ? 'active' : ''}`}
              onClick={() => setVistaActiva('productos')}
            >
              🆕 Productos
            </Nav.Link>
            
            <Nav.Link 
              href="#"
              className={`nav-link-custom ${vistaActiva === 'proveedores' ? 'active' : ''}`}
              onClick={() => setVistaActiva('proveedores')}
            >
              🏢 Proveedores
            </Nav.Link>
            
            <Nav.Link 
              href="#"
              className={`nav-link-custom ${vistaActiva === 'compras' ? 'active' : ''}`}
              onClick={() => setVistaActiva('compras')}
            >
              📦 Compras
            </Nav.Link>
            
            {/* OCULTO TEMPORALMENTE
            <Nav.Link 
              href="#"
              className={`nav-link-custom ${vistaActiva === 'cargas' ? 'active' : ''}`}
              onClick={() => setVistaActiva('cargas')}
            >
              🔄 Cargar
            </Nav.Link>
            */}
            
            <Nav.Link
              href="#"
              className={`nav-link-custom ${vistaActiva === 'presupuestos' ? 'active' : ''}`}
              onClick={() => setVistaActiva('presupuestos')}
            >
              📋 Presupuestos
            </Nav.Link>
            <Nav.Link
              href="#"
              className={`nav-link-custom ${vistaActiva === 'dashboard' ? 'active' : ''}`}
              onClick={() => setVistaActiva('dashboard')}
            >
              📊 Dashboard
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarComponent; 